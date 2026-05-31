# Forum Image Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettere agli utenti loggati e non bannati di allegare immagini ai thread e alle risposte del forum, con validazione del contenuto, ri-codifica e scansione antivirus (VirusTotal) con quarantena.

**Architecture:** Upload-first: il client carica ogni immagine su `POST /api/forum/attachments` (validazione + re-encode sharp → webp + upload su Supabase Storage + scansione VirusTotal) ricevendo un `attachmentId`; alla creazione del thread/risposta gli id vengono collegati. Storage su Supabase Storage (REST, no nuove dipendenze). Scansione asincrona con quarantena (`PENDING`→`CLEAN`/`INFECTED`) e re-check lazy alla visualizzazione del thread.

**Tech Stack:** Next.js 14 App Router, Prisma (`db push`), `sharp`, Supabase Storage REST, VirusTotal API v3, TypeScript. Nessun framework di test → logica pura verificata con `tsx`, resto con `tsc --noEmit` + manuale.

**Riferimento spec:** `docs/superpowers/specs/2026-05-31-forum-image-attachments-design.md`

**Prerequisiti operativi (fuori dal codice, degrado morbido se assenti):** bucket `forum-attachments` (pubblico) su Supabase; env Vercel `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VIRUSTOTAL_API_KEY`.

**Nota DB:** locale = Supabase **produzione**. Modifiche additive (sicure). MAI `migrate reset`/`db push --force-reset`/seed.

---

## File Structure

| File | Responsabilità |
|---|---|
| `prisma/schema.prisma` (mod) | `ForumAttachment` + enum `ScanStatus` + relazioni |
| `next.config.js` (mod) | host Supabase nei `remotePatterns` |
| `lib/image-validate.ts` (new) | magic-bytes + allowlist (puro) + re-encode sharp |
| `lib/supabase-storage.ts` (new) | upload/delete su Supabase Storage (REST) |
| `lib/virustotal.ts` (new) | `scanBuffer` + `recheckAnalysis` (degrada senza key) |
| `app/api/forum/attachments/route.ts` (new) | POST upload+validazione+scan |
| `app/api/forum/threads/route.ts` (mod) | collega `attachmentIds` al thread |
| `app/api/forum/replies/route.ts` (mod) | collega `attachmentIds` alla risposta |
| `app/(public)/forum/_components/ImageAttach.tsx` (new) | UI client upload/anteprima (riusabile) |
| `app/(public)/forum/_components/AttachmentGrid.tsx` (new) | rendering miniature (presentazionale) |
| `app/(public)/forum/nuovo/page.tsx` (mod) | integra ImageAttach + invia attachmentIds |
| `app/(public)/forum/thread/[slug]/ReplyForm.tsx` (mod) | integra ImageAttach + invia attachmentIds |
| `app/(public)/forum/thread/[slug]/page.tsx` (mod) | include allegati, re-check PENDING, render |

---

## Task 1: Schema — ForumAttachment

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1: Aggiungere modello + enum**

In fondo al blocco forum (dopo `model ForumReply { ... }` o vicino agli altri model forum) aggiungere:

```prisma
model ForumAttachment {
  id           String     @id @default(cuid())
  url          String
  path         String
  mimeType     String     @default("image/webp")
  size         Int
  width        Int?
  height       Int?
  scanStatus   ScanStatus @default(PENDING)
  vtAnalysisId String?
  uploaderId   String
  threadId     String?
  replyId      String?
  createdAt    DateTime   @default(now())

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

- [ ] **Step 2: Relazioni inverse**

In `model User` (dopo `categorySubscriptions ...`):
```prisma
  attachments ForumAttachment[]
```
In `model ForumThread` (dopo `subscriptions ThreadSubscription[]`):
```prisma
  attachments ForumAttachment[]
```
In `model ForumReply` (dopo `thread ForumThread @relation(...)`):
```prisma
  attachments ForumAttachment[]
```

- [ ] **Step 3: Applicare e rigenerare**

Run: `npx prisma db push && npx prisma generate`
Expected: `🚀  Your database is now in sync` + `Generated Prisma Client`. (Nessun warning di data-loss.)

- [ ] **Step 4: Verifica**

Run: `npx tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); p.forumAttachment.count().then(c=>{console.log('attachments',c);return p.\$disconnect();})"`
Expected: `attachments 0`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(forum): schema ForumAttachment + ScanStatus"
```

---

## Task 2: next.config — host Supabase per next/image

**Files:** Modify `next.config.js`

- [ ] **Step 1: Aggiungere il remotePattern**

In `next.config.js`, dentro `images.remotePatterns`, aggiungere dopo `{ protocol: "https", hostname: "pyarchinit.org" },`:
```js
      { protocol: "https", hostname: "cygykmizdjusppwlpwwv.supabase.co" },
```

- [ ] **Step 2: Commit**

```bash
git add next.config.js
git commit -m "chore(next): consenti immagini da Supabase Storage"
```

---

## Task 3: lib/image-validate.ts — magic-bytes + re-encode

**Files:** Create `lib/image-validate.ts`

- [ ] **Step 1: Scrivere il modulo**

```ts
import sharp from "sharp";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Rileva il tipo reale dell'immagine dai magic-bytes. Ritorna il MIME o null.
export function detectImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // GIF: "GIF87a" / "GIF89a"
  if (buf.slice(0, 6).toString("ascii") === "GIF87a" || buf.slice(0, 6).toString("ascii") === "GIF89a")
    return "image/gif";
  // WEBP: "RIFF"...."WEBP"
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

// Ri-codifica in webp (max 2000px lato lungo), neutralizzando payload e normalizzando.
export async function reencodeToWebp(
  buf: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const img = sharp(buf, { failOn: "error" });
  const meta = await img.metadata();
  const pipeline =
    meta.width && meta.width > 2000
      ? img.resize(2000, null, { withoutEnlargement: true })
      : img;
  const out = await pipeline.webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  return { buffer: Buffer.from(out.data), width: out.info.width, height: out.info.height };
}
```

- [ ] **Step 2: Test (tsx) della parte pura**

Create `scripts/_verify-image-validate.mts`:
```ts
import { detectImageType } from "../lib/image-validate";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]); // eseguibile ELF
const fakeGif = Buffer.from("GIF89a......", "ascii");

const checks: [string, string | null][] = [
  ["png", detectImageType(png)],
  ["jpeg", detectImageType(jpeg)],
  ["elf-as-image", detectImageType(elf)],
  ["gif", detectImageType(fakeGif)],
];
const ok =
  checks[0][1] === "image/png" &&
  checks[1][1] === "image/jpeg" &&
  checks[2][1] === null &&
  checks[3][1] === "image/gif";
console.log(checks, ok ? "✓ PASS" : "✗ FAIL");
if (!ok) process.exit(1);
```

- [ ] **Step 3: Eseguire e verificare PASS**

Run: `npx tsx scripts/_verify-image-validate.mts`
Expected: stampa i check e `✓ PASS` (l'ELF viene rifiutato → null).

- [ ] **Step 4: Pulizia + commit**

```bash
rm scripts/_verify-image-validate.mts
git add lib/image-validate.ts
git commit -m "feat(forum): validazione immagini (magic-bytes + re-encode) + verifica"
```

---

## Task 4: lib/supabase-storage.ts — upload/delete

**Files:** Create `lib/supabase-storage.ts`

- [ ] **Step 1: Scrivere il modulo**

```ts
const BUCKET = "forum-attachments";

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function storageConfigured(): boolean {
  return cfg() !== null;
}

// Carica un buffer e ritorna l'URL pubblico. Lancia se lo storage non è configurato.
export async function uploadObject(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("Supabase Storage non configurato");
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload Storage fallito (${res.status}): ${t}`);
  }
  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteObject(path: string): Promise<void> {
  const c = cfg();
  if (!c) return;
  await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${c.key}` },
  }).catch(() => {});
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (nessun errore nel file).
```bash
git add lib/supabase-storage.ts
git commit -m "feat(forum): client Supabase Storage (upload/delete via REST)"
```

---

## Task 5: lib/virustotal.ts — scansione

**Files:** Create `lib/virustotal.ts`

- [ ] **Step 1: Scrivere il modulo**

```ts
import { createHash } from "crypto";

export type ScanResult = "PENDING" | "CLEAN" | "INFECTED";

const VT = "https://www.virustotal.com/api/v3";

function key(): string | null {
  return process.env.VIRUSTOTAL_API_KEY || null;
}

function verdict(stats: { malicious?: number; suspicious?: number } | undefined): ScanResult {
  if (!stats) return "PENDING";
  return (stats.malicious ?? 0) + (stats.suspicious ?? 0) > 0 ? "INFECTED" : "CLEAN";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Scansiona un buffer. Senza API key degrada a CLEAN (validazione di base già fatta).
// Ritorna lo stato e l'eventuale analysisId per il re-check successivo.
export async function scanBuffer(
  buffer: Buffer
): Promise<{ status: ScanResult; analysisId: string | null }> {
  const k = key();
  if (!k) return { status: "CLEAN", analysisId: null };

  // 1) lookup per hash (immediato se già noto)
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const lookup = await fetch(`${VT}/files/${sha256}`, { headers: { "x-apikey": k } }).catch(() => null);
  if (lookup && lookup.ok) {
    const body = await lookup.json();
    return { status: verdict(body?.data?.attributes?.last_analysis_stats), analysisId: null };
  }

  // 2) upload
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), "upload");
  const up = await fetch(`${VT}/files`, { method: "POST", headers: { "x-apikey": k }, body: form }).catch(() => null);
  if (!up || !up.ok) return { status: "PENDING", analysisId: null };
  const upBody = await up.json();
  const analysisId: string | null = upBody?.data?.id ?? null;
  if (!analysisId) return { status: "PENDING", analysisId: null };

  // 3) poll breve (~8s)
  for (let i = 0; i < 4; i++) {
    await sleep(2000);
    const r = await recheckAnalysis(analysisId);
    if (r !== "PENDING") return { status: r, analysisId };
  }
  return { status: "PENDING", analysisId };
}

// Ricontrolla un'analisi esistente (usato per i PENDING alla visualizzazione).
export async function recheckAnalysis(analysisId: string): Promise<ScanResult> {
  const k = key();
  if (!k) return "CLEAN";
  const res = await fetch(`${VT}/analyses/${analysisId}`, { headers: { "x-apikey": k } }).catch(() => null);
  if (!res || !res.ok) return "PENDING";
  const body = await res.json();
  const attr = body?.data?.attributes;
  if (attr?.status !== "completed") return "PENDING";
  return verdict(attr?.stats);
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add lib/virustotal.ts
git commit -m "feat(forum): scansione VirusTotal (hash-lookup, upload, poll, recheck)"
```

---

## Task 6: API upload allegati

**Files:** Create `app/api/forum/attachments/route.ts`

- [ ] **Step 1: Scrivere la route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { detectImageType, reencodeToWebp, MAX_BYTES } from "@/lib/image-validate";
import { uploadObject, deleteObject, storageConfigured } from "@/lib/supabase-storage";
import { scanBuffer } from "@/lib/virustotal";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
  if (me?.banned) return NextResponse.json({ error: "Sei stato escluso dal forum." }, { status: 403 });

  if (!storageConfigured()) {
    return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Immagine troppo grande (max 8 MB)" }, { status: 400 });
  }

  const raw = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(raw)) {
    return NextResponse.json({ error: "Tipo di file non consentito (solo immagini)" }, { status: 400 });
  }

  let processed: { buffer: Buffer; width: number; height: number };
  try {
    processed = await reencodeToWebp(raw);
  } catch {
    return NextResponse.json({ error: "Immagine non valida" }, { status: 400 });
  }

  const path = `${userId}/${Date.now()}-${Math.round(processed.width)}.webp`;
  let url: string;
  try {
    url = await uploadObject(path, processed.buffer, "image/webp");
  } catch (e) {
    return NextResponse.json({ error: "Upload fallito" }, { status: 502 });
  }

  const scan = await scanBuffer(processed.buffer);
  if (scan.status === "INFECTED") {
    await deleteObject(path);
    return NextResponse.json({ error: "File rifiutato: rilevata minaccia" }, { status: 422 });
  }

  const attachment = await prisma.forumAttachment.create({
    data: {
      url,
      path,
      mimeType: "image/webp",
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      scanStatus: scan.status,
      vtAnalysisId: scan.analysisId,
      uploaderId: userId,
    },
  });

  return NextResponse.json({
    id: attachment.id,
    url: attachment.url,
    scanStatus: attachment.scanStatus,
    width: attachment.width,
    height: attachment.height,
  });
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add app/api/forum/attachments/route.ts
git commit -m "feat(forum): API upload allegati immagine (validazione + storage + scan)"
```

---

## Task 7: Collega allegati al thread

**Files:** Modify `app/api/forum/threads/route.ts`

- [ ] **Step 1: Accettare e collegare attachmentIds**

Nella `POST`, cambiare la destrutturazione del body da:
```ts
  const { title, content, categoryId } = await req.json();
```
a:
```ts
  const { title, content, categoryId, attachmentIds } = await req.json();
```

Subito dopo il blocco che crea il thread e l'`ensureThreadSubscription` (prima del `notifyNewThread`), aggiungere:
```ts
  if (Array.isArray(attachmentIds) && attachmentIds.length > 0) {
    await prisma.forumAttachment.updateMany({
      where: { id: { in: attachmentIds.slice(0, 4) }, uploaderId: userId, threadId: null, replyId: null },
      data: { threadId: thread.id },
    });
  }
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add app/api/forum/threads/route.ts
git commit -m "feat(forum): collega allegati al nuovo thread"
```

---

## Task 8: Collega allegati alla risposta

**Files:** Modify `app/api/forum/replies/route.ts`

- [ ] **Step 1: Accettare e collegare attachmentIds**

Cambiare la destrutturazione da:
```ts
  const { content, threadId } = await req.json();
```
a:
```ts
  const { content, threadId, attachmentIds } = await req.json();
```

Dopo la creazione della `reply` e prima del bump di `updatedAt` (o subito dopo `ensureThreadSubscription`), aggiungere:
```ts
  if (Array.isArray(attachmentIds) && attachmentIds.length > 0) {
    await prisma.forumAttachment.updateMany({
      where: { id: { in: attachmentIds.slice(0, 4) }, uploaderId: userId, threadId: null, replyId: null },
      data: { replyId: reply.id },
    });
  }
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add app/api/forum/replies/route.ts
git commit -m "feat(forum): collega allegati alla risposta"
```

---

## Task 9: Componente client ImageAttach

**Files:** Create `app/(public)/forum/_components/ImageAttach.tsx`

- [ ] **Step 1: Scrivere il componente**

```tsx
"use client";

import { useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface Item {
  localId: string;
  preview: string;
  id?: string;
  status: "uploading" | "done" | "error";
  scanStatus?: "PENDING" | "CLEAN" | "INFECTED";
}

const MAX = 4;

export function ImageAttach({ onChange }: { onChange: (ids: string[]) => void }) {
  const [items, setItems] = useState<Item[]>([]);

  const sync = (next: Item[]) => {
    setItems(next);
    onChange(next.filter((i) => i.status === "done" && i.id).map((i) => i.id!));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX - items.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    let current = items;
    for (const file of chosen) {
      const localId = `${file.name}-${file.size}-${current.length}`;
      const entry: Item = { localId, preview: URL.createObjectURL(file), status: "uploading" };
      current = [...current, entry];
      sync(current);

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/forum/attachments", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        current = current.map((i) =>
          i.localId === localId ? { ...i, status: "done", id: data.id, scanStatus: data.scanStatus } : i
        );
      } else {
        current = current.map((i) => (i.localId === localId ? { ...i, status: "error" } : i));
      }
      sync(current);
    }
  };

  const remove = (localId: string) => sync(items.filter((i) => i.localId !== localId));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((i) => (
          <div key={i.localId} className="relative w-20 h-20 rounded-card overflow-hidden border border-sand/20 bg-code-bg">
            <img src={i.preview} alt="" className="w-full h-full object-cover" />
            {i.status === "uploading" && (
              <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                <Loader2 size={16} className="text-teal animate-spin" />
              </div>
            )}
            {i.status === "error" && (
              <div className="absolute inset-0 bg-terracotta/60 flex items-center justify-center text-[10px] text-white text-center px-1">
                errore
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(i.localId)}
              className="absolute top-0.5 right-0.5 bg-primary/80 rounded-full p-0.5 text-sand/80 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {items.length < MAX && (
        <label className="inline-flex items-center gap-2 text-sm text-teal border border-teal/30 hover:border-teal/60 rounded-card px-3 py-1.5 cursor-pointer transition">
          <ImagePlus size={14} />
          Allega immagini
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      <p className="text-xs text-sand/30 mt-1">Max {MAX} immagini · 8 MB · verifica antivirus</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add "app/(public)/forum/_components/ImageAttach.tsx"
git commit -m "feat(forum): componente client ImageAttach (upload + anteprime)"
```

---

## Task 10: Componente AttachmentGrid (rendering)

**Files:** Create `app/(public)/forum/_components/AttachmentGrid.tsx`

- [ ] **Step 1: Scrivere il componente presentazionale**

```tsx
import Image from "next/image";

interface Attachment {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED";
}

export function AttachmentGrid({ attachments }: { attachments: Attachment[] }) {
  const visible = attachments.filter((a) => a.scanStatus !== "INFECTED");
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {visible.map((a) =>
        a.scanStatus === "PENDING" ? (
          <div
            key={a.id}
            className="w-28 h-28 rounded-card border border-sand/15 bg-code-bg flex items-center justify-center text-[11px] text-sand/40 text-center px-2"
          >
            🔍 in verifica…
          </div>
        ) : (
          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={a.url}
              alt="Allegato"
              width={a.width ?? 200}
              height={a.height ?? 200}
              className="w-28 h-28 object-cover rounded-card border border-sand/15 hover:border-teal/40 transition"
            />
          </a>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add "app/(public)/forum/_components/AttachmentGrid.tsx"
git commit -m "feat(forum): componente AttachmentGrid (miniature)"
```

---

## Task 11: Integrare ImageAttach nel form Nuovo Thread

**Files:** Modify `app/(public)/forum/nuovo/page.tsx`

- [ ] **Step 1: Import + stato**

Aggiungere import dopo gli altri:
```tsx
import { ImageAttach } from "../_components/ImageAttach";
```
Dopo `const [error, setError] = useState<string | null>(null);` aggiungere:
```tsx
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
```

- [ ] **Step 2: Inviare attachmentIds**

Nel `fetch("/api/forum/threads", ...)`, cambiare il body:
```tsx
      body: JSON.stringify({ title, content, categoryId }),
```
in:
```tsx
      body: JSON.stringify({ title, content, categoryId, attachmentIds }),
```

- [ ] **Step 3: Inserire il controllo nel form**

Dopo il blocco `{/* Content */}` (la chiusura `</div>` del textarea contenuto) e prima del blocco `{error && (`, aggiungere:
```tsx
          {/* Allegati */}
          <div>
            <label className="block text-sm text-sand/60 mb-1.5">Allegati</label>
            <ImageAttach onChange={setAttachmentIds} />
          </div>
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add "app/(public)/forum/nuovo/page.tsx"
git commit -m "feat(forum): allega immagini nel form nuovo thread"
```

---

## Task 12: Integrare ImageAttach in ReplyForm

**Files:** Modify `app/(public)/forum/thread/[slug]/ReplyForm.tsx`

- [ ] **Step 1: Import + stato**

Aggiungere import dopo gli altri:
```tsx
import { ImageAttach } from "../../_components/ImageAttach";
```
Dopo `const [error, setError] = useState<string | null>(null);` aggiungere:
```tsx
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
```

- [ ] **Step 2: Inviare attachmentIds + reset**

Cambiare il body del fetch:
```tsx
      body: JSON.stringify({ content, threadId }),
```
in:
```tsx
      body: JSON.stringify({ content, threadId, attachmentIds }),
```
E nel ramo `if (res.ok)`, dopo `setContent("");` aggiungere:
```tsx
      setAttachmentIds([]);
```

- [ ] **Step 3: Inserire il controllo nel form**

Dopo il `<textarea ... />` (e prima di `{error && ...}`), aggiungere:
```tsx
      <ImageAttach onChange={setAttachmentIds} />
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add "app/(public)/forum/thread/[slug]/ReplyForm.tsx"
git commit -m "feat(forum): allega immagini nelle risposte"
```

---

## Task 13: Render allegati + re-check PENDING nella pagina thread

**Files:** Modify `app/(public)/forum/thread/[slug]/page.tsx`

- [ ] **Step 1: Includere gli allegati nella query**

Nell'`include` di `prisma.forumThread.findUnique`, aggiungere `attachments: true` per il thread e dentro `replies.include` aggiungere `attachments: true`:
```tsx
    include: {
      user: { select: { id: true, name: true, email: true } },
      category: true,
      attachments: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      },
    },
```

- [ ] **Step 2: Re-check dei PENDING (dopo `if (!thread) notFound();`)**

Aggiungere import in cima:
```tsx
import { recheckAnalysis } from "@/lib/virustotal";
```
Dopo `if (!thread) notFound();` aggiungere:
```tsx
  // Re-check lazy degli allegati ancora in verifica
  const pending = [
    ...thread.attachments,
    ...thread.replies.flatMap((r) => r.attachments),
  ].filter((a) => a.scanStatus === "PENDING" && a.vtAnalysisId);
  if (pending.length > 0) {
    await Promise.all(
      pending.map(async (a) => {
        const status = await recheckAnalysis(a.vtAnalysisId!);
        if (status !== "PENDING") {
          a.scanStatus = status;
          await prisma.forumAttachment.update({ where: { id: a.id }, data: { scanStatus: status } });
        }
      })
    );
  }
```

- [ ] **Step 3: Import e render del componente**

Aggiungere import:
```tsx
import { AttachmentGrid } from "../../_components/AttachmentGrid";
```
Nel blocco del contenuto del thread, subito dopo il `<div className="prose ...">{thread.content}</div>`, aggiungere:
```tsx
          <AttachmentGrid attachments={thread.attachments} />
```
In ogni risposta, dopo `<p className="text-sm text-sand/80 whitespace-pre-wrap">{reply.content}</p>`, aggiungere:
```tsx
                <AttachmentGrid attachments={reply.attachments} />
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
```bash
git add "app/(public)/forum/thread/[slug]/page.tsx"
git commit -m "feat(forum): render allegati nel thread + re-check PENDING"
```

---

## Task 14: Deploy + prerequisiti + verifica

- [ ] **Step 1: Push (auto-deploy)**

```bash
git push origin master
```

- [ ] **Step 2: Prerequisiti (operativi, una tantum)**

- Creare il bucket `forum-attachments` su Supabase (Storage → New bucket → **Public**).
- Impostare su Vercel (Production): `SUPABASE_URL=https://cygykmizdjusppwlpwwv.supabase.co`, `SUPABASE_SERVICE_ROLE_KEY=<service role>`, `VIRUSTOTAL_API_KEY=<key>`. Poi redeploy.

- [ ] **Step 3: Attendere Ready**

Run: `vercel ls 2>&1 | sed -n '7p'` → deploy `● Ready` in Production.

- [ ] **Step 4: Verifica funzionale**

- Da loggato, aprire un nuovo thread allegando un'immagine valida → l'immagine appare nel thread (CLEAN dopo la verifica).
- Caricare il file di test **EICAR** (stringa antivirus standard, innocua) rinominato `.png`: deve essere rifiutato dai magic-bytes (non è un'immagine) **oppure**, se incapsulato in un'immagine valida, risultare INFECTED e non comparire.
- Caricare un file >8 MB → rifiutato. Una 5ª immagine → non selezionabile.
- Utente bannato → upload risponde 403.

---

## Self-review (eseguito)

- **Copertura spec:** storage §1/§2.2 → Task 4 (+ prereq Task 14); modello §3 → Task 1; validazione §5.1 → Task 3+6; scansione §5 → Task 5+6, re-check §5.2 → Task 13; degrado §6 → Task 5 (no key→CLEAN) e Task 6 (storage 503); UI §7 → Task 9/10/11/12/13; permessi/limiti §8 → Task 6 (ban, size, type) + Task 9 (max 4 client) + Task 7/8 (slice 4); next/image §2.2 → Task 2. Nessun requisito scoperto.
- **Placeholder:** nessuno; ogni step ha codice/comandi reali.
- **Coerenza tipi:** `ScanResult`/`scanStatus` valori `PENDING|CLEAN|INFECTED` coerenti tra `lib/virustotal.ts`, schema, API, ImageAttach, AttachmentGrid; `scanBuffer` → `{status, analysisId}` usato in Task 6; `recheckAnalysis(id)` usato in Task 5 (poll) e Task 13; `uploadObject(path,buffer,contentType)`/`deleteObject(path)`/`storageConfigured()` coerenti tra Task 4 e Task 6; `detectImageType`/`reencodeToWebp`/`MAX_BYTES` coerenti tra Task 3 e Task 6; `ImageAttach onChange` e `attachmentIds` coerenti tra Task 9/11/12; `AttachmentGrid attachments` shape coerente con la query Task 13.
