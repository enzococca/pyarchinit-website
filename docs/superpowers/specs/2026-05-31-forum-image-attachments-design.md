# Spec — Allegati immagine nel forum (con scansione antivirus)

- **Data:** 2026-05-31
- **Stato:** approvato (design), in attesa del piano di implementazione
- **Ambito:** permettere agli utenti loggati (non bannati) di allegare **immagini** ai thread e alle risposte del forum, con validazione del contenuto e scansione antivirus (VirusTotal) prima della pubblicazione.

## 1. Obiettivo e ambito

Gli utenti possono allegare immagini per spiegarsi meglio (screenshot, foto). Ogni immagine è validata e scansionata; resta in quarantena finché non risulta pulita.

**Fuori ambito (v1):** video, PDF, ZIP/archivi, file generici/eseguibili. Solo immagini.

## 2. Vincoli e prerequisiti

### 2.1 Vincolo Vercel
Niente disco locale: `lib/media.ts` scrive su filesystem locale e **non funziona su Vercel**. Gli allegati vanno su **Supabase Storage**.

### 2.2 Prerequisiti operativi (forniti dall'utente / setup)
- **Bucket** `forum-attachments` su Supabase Storage, con **lettura pubblica**.
- Env su Vercel (Production):
  - `SUPABASE_URL` = `https://cygykmizdjusppwlpwwv.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY` = service role key (Supabase → Settings → API)
  - `VIRUSTOTAL_API_KEY` = API key gratuita (virustotal.com)
- `next.config.js`: aggiungere `cygykmizdjusppwlpwwv.supabase.co` ai `remotePatterns` di `images` (per `next/image`).

La feature è implementabile e testabile prima che le chiavi siano presenti (degrado morbido, §6).

## 3. Modello dati (Prisma)

```prisma
model ForumAttachment {
  id         String       @id @default(cuid())
  url        String                       // URL pubblico Supabase
  path       String                       // path nel bucket (per delete)
  mimeType   String       @default("image/webp")
  size       Int
  width      Int?
  height     Int?
  scanStatus ScanStatus   @default(PENDING)
  vtAnalysisId String?                    // id analisi VirusTotal (per re-check)
  uploaderId String
  threadId   String?
  replyId    String?
  createdAt  DateTime     @default(now())

  uploader User         @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  thread   ForumThread? @relation(fields: [threadId], references: [id], onDelete: Cascade)
  reply    ForumReply?  @relation(fields: [replyId], references: [id], onDelete: Cascade)

  @@index([threadId])
  @@index([replyId])
}

enum ScanStatus {
  PENDING
  CLEAN
  INFECTED
}
```
Relazioni inverse: `attachments ForumAttachment[]` su `User`, `ForumThread`, `ForumReply`.
Migrazione **additiva** via `prisma db push` (DB = Supabase prod, operazione sicura).

## 4. Flusso di associazione (upload-first)

1. Nel form (nuovo thread o risposta) l'utente seleziona immagini → ognuna viene caricata subito a `POST /api/forum/attachments` (multipart). La risposta è `{ id, url, scanStatus, width, height }`. L'allegato nasce **orfano** (`threadId`/`replyId` = null, `uploaderId` = utente corrente).
2. All'invio del form, il client manda il JSON del thread/risposta con in più `attachmentIds: string[]`.
3. La route di creazione thread/risposta, dopo aver creato il record, collega gli allegati:
   `updateMany({ where: { id: { in: attachmentIds }, uploaderId: me, threadId: null, replyId: null }, data: { threadId } })` (o `replyId`). Vincolo: si collegano solo allegati propri e non ancora collegati.
4. **Orfani:** allegati mai collegati (post abbandonato) restano con thread/reply null. Accettabile in v1; opzionale cleanup futuro (cron/lazy). Non si crea cron ora.

## 5. Upload, validazione e scansione

### 5.1 `POST /api/forum/attachments`
- Auth: utente loggato; **403 se bannato** (coerente con la feature ban).
- Riceve un singolo file immagine (multipart).
- **Validazione di base (sempre):**
  - MIME in allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
  - Controllo **magic-bytes** (il contenuto è davvero quell'immagine) — non fidarsi del MIME dichiarato.
  - Dimensione ≤ **8 MB**.
  - **Ri-codifica con `sharp`** → `webp` (resize max 2000px lato lungo, qualità 85). Questo neutralizza payload nascosti e normalizza il file. (Le GIF animate: per v1 si prende il primo frame / si converte; nota nel piano.)
- Upload del buffer ri-codificato su Supabase Storage: `POST {SUPABASE_URL}/storage/v1/object/forum-attachments/{cuid}.webp` con header `Authorization: Bearer {SERVICE_ROLE_KEY}`. URL pubblico: `{SUPABASE_URL}/storage/v1/object/public/forum-attachments/{...}`.
- Crea il record `ForumAttachment` con `scanStatus = PENDING`.
- **Scansione VirusTotal (v3):**
  1. Calcola `sha256` del buffer; `GET /api/v3/files/{sha256}` (header `x-apikey`). Se 200 → verdetto immediato dalle `last_analysis_stats`.
  2. Se 404 → `POST /api/v3/files` (multipart) → ottieni `analysis_id`; salva in `vtAnalysisId`; **poll** `GET /api/v3/analyses/{id}` fino a `status=completed` per **max ~10s**.
  3. Verdetto: `malicious + suspicious > 0` → **INFECTED** (cancella il file da Storage, `scanStatus=INFECTED`); altrimenti **CLEAN**. Se ancora `queued` allo scadere → resta **PENDING**.
- Ritorna `{ id, url, scanStatus, width, height }`.

### 5.2 Risoluzione dei PENDING (senza cron)
Quando si renderizza la pagina di un thread, per ogni allegato `PENDING` con `vtAnalysisId` si ri-controlla `GET /api/v3/analyses/{id}` (server-side) e si aggiorna `scanStatus` (CLEAN o INFECTED+delete). Best-effort, non blocca il render.

## 6. Degrado morbido (senza chiavi)
- Senza `VIRUSTOTAL_API_KEY`: si applica solo la validazione di base; l'allegato (immagine ri-codificata) è marcato `CLEAN` e mostrato (rischio basso perché ri-codificato).
- Senza `SUPABASE_SERVICE_ROLE_KEY`: l'endpoint di upload risponde errore chiaro ("storage non configurato"); il resto del forum funziona.

## 7. UI

- **Form nuovo thread** (`app/(public)/forum/nuovo/...`) e **ReplyForm** (`app/(public)/forum/thread/[slug]/ReplyForm.tsx`): controllo "📎 Allega immagini" (input file `accept="image/*"`, multiplo, **max 4**), con anteprime locali prima dell'invio e stato di upload. Gli `attachmentIds` ottenuti vengono inviati con il post.
- **Rendering** (pagina thread, per il post iniziale e ogni risposta): griglia di miniature delle immagini `CLEAN` (click → immagine piena, via `next/image`). `PENDING` → segnaposto "🔍 in verifica…". `INFECTED` → non mostrato.

## 8. Permessi e limiti
- Solo utenti loggati e **non bannati** possono caricare/allegare.
- Max **4 immagini per post**, ≤ **8 MB** ciascuna (prima della ri-codifica), tipi in allowlist.
- Il limite di 4 è applicato così: il client permette di selezionarne al massimo 4; la route di creazione thread/risposta, in fase di collegamento, collega al massimo i primi 4 `attachmentIds` (gli eccedenti vengono ignorati e restano orfani).

## 9. File coinvolti (stima)
- `prisma/schema.prisma` — `ForumAttachment` + enum + relazioni (db push)
- `next.config.js` — remotePattern host Supabase
- `lib/supabase-storage.ts` *(nuovo)* — upload/delete su Supabase Storage (REST, `fetch`)
- `lib/virustotal.ts` *(nuovo)* — `scanBuffer()` (hash-lookup → upload → poll) e `recheckAnalysis(id)`; gestione assenza chiave
- `lib/image-validate.ts` *(nuovo)* — allowlist + magic-bytes + re-encode sharp (parte pura/testabile per allowlist+magic-bytes)
- `app/api/forum/attachments/route.ts` *(nuovo)* — POST upload+scan
- `app/api/forum/threads/route.ts` — collega `attachmentIds` al thread creato
- `app/api/forum/replies/route.ts` — collega `attachmentIds` alla risposta creata
- `app/(public)/forum/nuovo/...` — UI allega nel form nuovo thread
- `app/(public)/forum/thread/[slug]/ReplyForm.tsx` — UI allega nella risposta
- `app/(public)/forum/thread/[slug]/page.tsx` — render allegati + re-check PENDING
- `app/(public)/forum/_components/ImageAttach.tsx` *(nuovo)* — componente client di upload/anteprima riusabile

## 10. Testing
Niente framework di test nel progetto. Verifica:
- **Unità (tsx)** per la parte pura di `lib/image-validate.ts`: magic-bytes/allowlist (es. un PNG valido passa, un file con estensione immagine ma header eseguibile viene rifiutato).
- **Manuale:** caricare un'immagine valida → appare (CLEAN); il file di test EICAR (innocuo, riconosciuto da tutti gli AV) → deve risultare INFECTED e non comparire; verificare i limiti (5ª immagine rifiutata, file >8MB rifiutato); utente bannato → upload 403.
- **Typecheck** `npx tsc --noEmit` pulito prima di ogni commit.

## 11. Sicurezza — note oneste
Nessuno scanner garantisce il 100%. La sicurezza qui poggia su più livelli: allowlist rigida + magic-bytes + **ri-codifica** (il livello più efficace per le immagini) + scansione multi-engine (VirusTotal) + quarantena. Le immagini non sono eseguibili; il rischio residuo principale (immagini malformate che sfruttano bug del decoder) è mitigato dalla ri-codifica server-side con `sharp`.
