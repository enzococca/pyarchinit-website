# Spec — Notifiche email del forum (modello "follow")

- **Data:** 2026-05-30
- **Stato:** approvato (design), in attesa di piano di implementazione
- **Ambito:** notifiche email per attività del forum, basate su un modello di
  sottoscrizione ("follow") a thread e categorie, con auto-follow su
  partecipazione e disiscrizione one-click.

## 1. Obiettivo

Quando qualcuno scrive nel forum, gli utenti interessati ricevono una notifica
via email:

- **Nuova risposta** in un thread → email a chi **segue quel thread**.
- **Nuovo thread** in una categoria → email a chi **segue quella categoria**.

Il modello "follow" (anziché "email a tutti") garantisce pertinenza e zero spam:
le notifiche arrivano solo a chi ha scelto di seguire (o vi ha partecipato).

## 2. Vincoli e prerequisiti

### 2.1 Prerequisito bloccante — dominio Resend verificato
Oggi l'invio usa `onboarding@resend.dev`, il mittente di test di Resend che
**recapita solo all'indirizzo del titolare dell'account** (enzo.ccc@gmail.com).
Finché non si verifica un dominio su Resend (es. `@pyarchinit.org`) impostando
`EMAIL_FROM`, le notifiche **non vengono consegnate agli altri utenti**.

La feature può essere **costruita e testata** (verso l'indirizzo del titolare)
prima del dominio, ma **non è realmente operativa** finché il dominio non è
verificato. Questo passo è fuori dal codice (configurazione Resend + variabile
`EMAIL_FROM` su Vercel).

### 2.2 Migrazione su database di produzione (Supabase)
Le modifiche allo schema sono **additive** (nuove tabelle + una colonna con
default) → operazione **sicura**, nessun dato esistente toccato. Va però
applicata con attenzione perché l'ambiente locale punta ora allo stesso DB
Supabase di produzione: **vietati** comandi distruttivi (`migrate reset`,
`db push --force-reset`).

## 3. Modello dati (Prisma)

### 3.1 Nuove tabelle

```prisma
model ThreadSubscription {
  id               String      @id @default(cuid())
  userId           String
  threadId         String
  unsubscribeToken String      @unique @default(cuid())
  createdAt        DateTime    @default(now())

  user   User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  thread ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@unique([userId, threadId])
  @@index([threadId])
}

model CategorySubscription {
  id               String        @id @default(cuid())
  userId           String
  categoryId       String
  unsubscribeToken String        @unique @default(cuid())
  createdAt        DateTime      @default(now())

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  category ForumCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId])
  @@index([categoryId])
}
```

### 3.2 Modifiche a modelli esistenti
- `User`: aggiungere `forumEmailOptOut Boolean @default(false)` + relazioni
  inverse `threadSubscriptions` e `categorySubscriptions`.
- `ForumThread`: relazione inversa `subscriptions ThreadSubscription[]`.
- `ForumCategory`: relazione inversa `subscriptions CategorySubscription[]`.

`unsubscribeToken` è per-sottoscrizione (consente disiscrizione one-click senza
login). `forumEmailOptOut` è l'interruttore globale per-utente (spegne tutte le
email del forum, indipendentemente dalle sottoscrizioni).

## 4. Comportamento "follow"

| Oggetto | Auto-follow | Follow manuale |
|---|---|---|
| **Thread** | chi **apre** il thread e chi **risponde** | bottone "Segui / Non seguire" sulla pagina del thread |
| **Categoria** | *nessuno* (sarebbe sorprendente) | bottone "Segui categoria" sulla pagina della categoria |

- L'auto-follow crea una `ThreadSubscription` se non esiste già (idempotente).
- Il toggle manuale crea/elimina la sottoscrizione corrispondente.

## 5. Trigger delle notifiche

### 5.1 Nuova risposta (`POST /api/forum/replies`)
1. Crea la risposta (comportamento attuale).
2. Auto-follow: assicura una `ThreadSubscription` per l'autore della risposta.
3. Destinatari = follower del thread **meno** l'autore della risposta, **meno**
   chi ha `forumEmailOptOut = true`.
4. Invia in background l'email "nuova risposta".

> Questo **sostituisce** la logica attuale che notifica solo l'autore del thread:
> l'autore del thread è già follower (auto-follow alla creazione), quindi resta
> coperto, ma ora lo sono anche gli altri partecipanti.

### 5.2 Nuovo thread (`POST /api/forum/threads`)
1. Crea il thread (comportamento attuale).
2. Auto-follow: crea una `ThreadSubscription` per il creatore.
3. Destinatari = follower della **categoria** **meno** il creatore, **meno**
   chi ha `forumEmailOptOut = true`.
4. Invia in background l'email "nuovo thread".

## 6. Email

- Riusa `sendEmail` di `lib/email.ts` e il template scuro esistente.
- Contenuto: chi ha scritto, titolo del thread, **anteprima** del testo
  (troncata, es. ~200 caratteri), bottone "Vedi nel forum" →
  `${NEXTAUTH_URL}/forum/thread/<slug>`.
- In fondo: link **"Smetti di seguire questa discussione/categoria"** →
  `${NEXTAUTH_URL}/api/forum/unsubscribe?token=<unsubscribeToken>`.
- Header **`List-Unsubscribe`** con lo stesso URL (richiede di estendere
  `sendEmail`/`EmailOptions` per passare header opzionali a Resend).

## 7. Invio (meccanica)

- L'invio avviene **dopo** aver risposto alla richiesta HTTP (fire-and-forget,
  come l'attuale `.catch(console.error)`), per non rallentare l'utente.
- **Batch** via Resend (`resend.batch.send`) quando i destinatari sono molti.
- **Dedup** dei destinatari ed **esclusione dell'autore** del post.
- Filtra chi ha `forumEmailOptOut = true`.
- Ogni destinatario riceve il **proprio** `unsubscribeToken` nel link.

## 8. API

| Endpoint | Metodo | Scopo |
|---|---|---|
| `/api/forum/subscriptions` | `POST` | crea follow (body: `{ type: "thread"\|"category", id }`) — richiede login |
| `/api/forum/subscriptions` | `DELETE` | rimuove follow (stesso body) — richiede login |
| `/api/forum/unsubscribe` | `GET` | disiscrizione one-click via `?token=…` (no login); pagina di conferma |
| `/api/account/preferences` | `PATCH` | aggiorna `forumEmailOptOut` dell'utente loggato |

Tutti gli endpoint autenticati usano `getSession()` e `(session.user as { id: string }).id`,
coerentemente con le route forum esistenti.

## 9. UI

- **Pagina thread** (`app/(public)/forum/thread/[slug]/page.tsx`): bottone
  "Segui / Non seguire" che riflette lo stato corrente (componente client che
  chiama `/api/forum/subscriptions`). Visibile solo agli utenti loggati.
- **Pagina categoria** (`app/(public)/forum/[category]/page.tsx`): bottone
  "Segui categoria".
- **Profilo** (`app/(public)/account/page.tsx`): interruttore "Ricevi email dal
  forum" che chiama `PATCH /api/account/preferences`.
- **Pagina di disiscrizione**: conferma testuale dopo il click sul link
  dell'email (server-side, legge il token, elimina la sottoscrizione).

## 10. Fuori ambito (YAGNI per la v1)

- Digest periodici (riassunto giornaliero/settimanale) — solo notifiche puntuali.
- Notifiche in-app / campanella.
- Follow di altri utenti.
- Preferenze granulari per tipo di evento (oltre all'interruttore globale).

## 11. Test

Il progetto non ha un framework di test configurato. Verifica prevista:
- **Unità logica destinatari** (dedup, esclusione autore, rispetto opt-out):
  estraibile in una funzione pura testabile con uno script `tsx` una tantum.
- **Manuale**: con dominio non ancora verificato, le email arrivano solo
  all'indirizzo del titolare → testare creando thread/risposte con l'account
  admin e verificando la consegna a enzo.ccc@gmail.com; verificare i link
  "segui/non segui" e "smetti di seguire".
- **Typecheck**: `npx tsc --noEmit` pulito prima del commit.

## 12. File coinvolti (stima)

- `prisma/schema.prisma` — nuove tabelle + colonna + relazioni (migrazione)
- `lib/email.ts` — supporto header opzionali (`List-Unsubscribe`) e invio batch
- `lib/forum-notify.ts` *(nuovo)* — logica destinatari + invio (funzione pura per
  selezione destinatari + funzione di invio)
- `app/api/forum/replies/route.ts` — auto-follow + notifica follower del thread
- `app/api/forum/threads/route.ts` — auto-follow creatore + notifica follower categoria
- `app/api/forum/subscriptions/route.ts` *(nuovo)* — toggle follow
- `app/api/forum/unsubscribe/route.ts` *(nuovo)* — disiscrizione one-click
- `app/api/account/preferences/route.ts` *(nuovo)* — toggle opt-out globale
- `app/(public)/forum/thread/[slug]/` — bottone Segui/Non seguire (componente client)
- `app/(public)/forum/[category]/page.tsx` — bottone Segui categoria
- `app/(public)/account/page.tsx` — interruttore email forum

## 13. Operazioni di rilascio

1. Verificare il dominio su Resend e impostare `EMAIL_FROM` su Vercel (prerequisito 2.1).
2. Applicare la migrazione additiva al DB Supabase.
3. Deploy via push su `master` (auto-deploy Vercel).
