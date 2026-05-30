# Forum Email Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inviare notifiche email agli utenti che seguono un thread (su nuova risposta) o una categoria (su nuovo thread) del forum, con auto-follow su partecipazione, disiscrizione one-click e interruttore globale nel profilo.

**Architecture:** Due tabelle di sottoscrizione (`ThreadSubscription`, `CategorySubscription`) + colonna `User.forumEmailOptOut`. La logica di selezione destinatari è una funzione pura testabile (`lib/forum-recipients.ts`); l'orchestrazione query+invio sta in `lib/forum-notify.ts`. Le route esistenti `POST /api/forum/replies` e `POST /api/forum/threads` chiamano l'orchestrazione in fire-and-forget. Nuove route per toggle follow, disiscrizione e preferenza globale.

**Tech Stack:** Next.js 14 App Router, Prisma (workflow `db push`, niente migrations), Resend, TypeScript. Nessun framework di test → la logica pura si verifica con uno script `tsx`, il resto con `tsc --noEmit` + verifica manuale.

**Riferimento spec:** `docs/superpowers/specs/2026-05-30-forum-email-notifications-design.md`

**Prerequisito operativo (fuori da questo piano):** dominio verificato su Resend + `EMAIL_FROM` su Vercel. Senza, le email arrivano solo a `enzo.ccc@gmail.com`. Tutte le task sono implementabili e testabili prima, ma la consegna reale agli utenti dipende da questo passo.

**Nota nota bene:** l'ambiente locale punta al DB Supabase di **produzione**. Le modifiche di schema sono additive (sicure). **Mai** eseguire `prisma migrate reset` / `db push --force-reset` / `prisma/seed.ts`.

---

## File Structure

| File | Responsabilità |
|---|---|
| `prisma/schema.prisma` (mod) | 2 nuove tabelle + colonna `forumEmailOptOut` + relazioni inverse |
| `lib/email.ts` (mod) | supporto header opzionali (per `List-Unsubscribe`) |
| `lib/forum-recipients.ts` (new) | funzione **pura** `selectRecipients` (dedup, escludi autore, rispetta opt-out) + tipi |
| `lib/forum-notify.ts` (new) | `ensureThreadSubscription`, `notifyNewReply`, `notifyNewThread`, builder HTML email |
| `app/api/forum/replies/route.ts` (mod) | auto-follow replier + notifica follower del thread |
| `app/api/forum/threads/route.ts` (mod) | auto-follow creatore + notifica follower della categoria |
| `app/api/forum/subscriptions/route.ts` (new) | `POST`/`DELETE` toggle follow (thread/categoria) |
| `app/api/forum/unsubscribe/route.ts` (new) | `GET` disiscrizione one-click via token |
| `app/api/account/preferences/route.ts` (new) | `PATCH` `forumEmailOptOut` |
| `app/(public)/forum/_components/FollowButton.tsx` (new) | bottone client Segui/Non seguire (riusabile thread+categoria) |
| `app/(public)/forum/thread/[slug]/page.tsx` (mod) | stato follow + render FollowButton |
| `app/(public)/forum/[category]/page.tsx` (mod) | stato follow + render FollowButton |
| `app/(public)/account/page.tsx` (mod) | interruttore "Ricevi email dal forum" |
| `app/(public)/account/ForumEmailToggle.tsx` (new) | toggle client per l'opt-out globale |

**Known minor gap (accettato):** i thread creati *prima* di questa feature non hanno una sottoscrizione per il loro autore; quegli autori non riceveranno notifiche finché non premono "Segui". I thread nuovi auto-iscrivono il creatore.

---

## Task 1: Schema — sottoscrizioni + opt-out

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Aggiungere le due nuove tabelle in fondo al blocco forum**

In `prisma/schema.prisma`, subito dopo il `model ForumReply { ... }` (che termina con `@@index([userId])` e `}`), aggiungere:

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

- [ ] **Step 2: Aggiungere la colonna e le relazioni inverse a `User`**

Nel `model User`, aggiungere la colonna dopo `role` e le relazioni in fondo alla lista delle relazioni (dopo `coursePayments CoursePayment[]`):

```prisma
  forumEmailOptOut Boolean @default(false)
```
```prisma
  threadSubscriptions   ThreadSubscription[]
  categorySubscriptions CategorySubscription[]
```

- [ ] **Step 3: Aggiungere la relazione inversa a `ForumThread` e `ForumCategory`**

In `model ForumThread`, dopo `replies ForumReply[]`:
```prisma
  subscriptions ThreadSubscription[]
```

In `model ForumCategory`, dopo `threads ForumThread[]`:
```prisma
  subscriptions CategorySubscription[]
```

- [ ] **Step 4: Applicare lo schema al DB (additivo) e rigenerare il client**

Run:
```bash
npx prisma db push && npx prisma generate
```
Expected: `🚀  Your database is now in sync with your Prisma schema.` e `Generated Prisma Client`.

- [ ] **Step 5: Verificare che le tabelle esistano (count = 0)**

Run:
```bash
npx tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); Promise.all([p.threadSubscription.count(),p.categorySubscription.count()]).then(([t,c])=>{console.log('threadSubs',t,'categorySubs',c);return p.\$disconnect();})"
```
Expected: `threadSubs 0 categorySubs 0`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(forum): schema sottoscrizioni thread/categoria + forumEmailOptOut"
```

---

## Task 2: `lib/email.ts` — header opzionali (List-Unsubscribe)

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 1: Aggiungere `headers` a `EmailOptions` e passarlo a Resend**

Sostituire l'interfaccia e la funzione `sendEmail` con:

```ts
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail({ to, subject, html, replyTo, headers }: EmailOptions) {
  if (!resend) {
    console.log(`[Email skipped - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return;
  }

  const from = process.env.EMAIL_FROM || "pyArchInit <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject,
    ...(replyTo ? { replyTo } : {}),
    ...(headers ? { headers } : {}),
    html: wrapInTemplate(subject, html),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore relativo a `lib/email.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "feat(email): supporto header opzionali (List-Unsubscribe)"
```

---

## Task 3: `lib/forum-recipients.ts` — selezione destinatari (pura)

**Files:**
- Create: `lib/forum-recipients.ts`

- [ ] **Step 1: Scrivere il modulo puro**

```ts
// Logica pura per scegliere i destinatari di una notifica del forum.
// Nessuna dipendenza (testabile in isolamento).

export interface SubscriberRow {
  userId: string;
  unsubscribeToken: string;
  user: { email: string | null; forumEmailOptOut: boolean } | null;
}

export interface NotifyRecipient {
  userId: string;
  email: string;
  unsubscribeToken: string;
}

/**
 * Da una lista di sottoscrizioni produce i destinatari finali:
 * - esclude l'autore del post (excludeUserId)
 * - esclude chi ha disattivato le email del forum (forumEmailOptOut)
 * - esclude righe senza email
 * - deduplica per userId
 */
export function selectRecipients(
  rows: SubscriberRow[],
  excludeUserId: string
): NotifyRecipient[] {
  const seen = new Set<string>();
  const out: NotifyRecipient[] = [];
  for (const row of rows) {
    if (row.userId === excludeUserId) continue;
    if (!row.user || !row.user.email) continue;
    if (row.user.forumEmailOptOut) continue;
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    out.push({
      userId: row.userId,
      email: row.user.email,
      unsubscribeToken: row.unsubscribeToken,
    });
  }
  return out;
}
```

- [ ] **Step 2: Scrivere lo script di verifica (al posto di un test runner)**

Create `scripts/_verify-forum-recipients.mts`:

```ts
import { selectRecipients, type SubscriberRow } from "../lib/forum-recipients";

const rows: SubscriberRow[] = [
  { userId: "author", unsubscribeToken: "t1", user: { email: "a@x.it", forumEmailOptOut: false } },
  { userId: "u2", unsubscribeToken: "t2", user: { email: "b@x.it", forumEmailOptOut: false } },
  { userId: "u3", unsubscribeToken: "t3", user: { email: "c@x.it", forumEmailOptOut: true } },  // opt-out
  { userId: "u4", unsubscribeToken: "t4", user: { email: null, forumEmailOptOut: false } },       // no email
  { userId: "u2", unsubscribeToken: "t2b", user: { email: "b@x.it", forumEmailOptOut: false } },  // duplicato
];

const got = selectRecipients(rows, "author");
const emails = got.map((r) => r.email).sort();

const expected = ["b@x.it"];
const ok = JSON.stringify(emails) === JSON.stringify(expected);
console.log("recipients:", emails, ok ? "✓ PASS" : "✗ FAIL — atteso " + JSON.stringify(expected));
if (!ok) process.exit(1);
```

- [ ] **Step 3: Eseguire la verifica e controllare che PASSI**

Run: `npx tsx scripts/_verify-forum-recipients.mts`
Expected: `recipients: [ 'b@x.it' ] ✓ PASS`

(Verifica: l'autore è escluso, l'opt-out escluso, l'email mancante esclusa, il duplicato deduplicato.)

- [ ] **Step 4: Rimuovere lo script temporaneo e fare commit**

```bash
rm scripts/_verify-forum-recipients.mts
git add lib/forum-recipients.ts
git commit -m "feat(forum): selezione destinatari notifiche (funzione pura) + verifica"
```

---

## Task 4: `lib/forum-notify.ts` — orchestrazione query + invio

**Files:**
- Create: `lib/forum-notify.ts`

- [ ] **Step 1: Scrivere il modulo di orchestrazione**

```ts
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { selectRecipients, type SubscriberRow } from "@/lib/forum-recipients";

function siteUrl(): string {
  return process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function preview(text: string, max = 200): string {
  const t = text.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

// Crea (se non esiste) la sottoscrizione di un utente a un thread. Idempotente.
export async function ensureThreadSubscription(userId: string, threadId: string): Promise<void> {
  await prisma.threadSubscription.upsert({
    where: { userId_threadId: { userId, threadId } },
    update: {},
    create: { userId, threadId },
  });
}

function notificationHtml(args: {
  intro: string;
  title: string;
  body: string;
  url: string;
  unsubUrl: string;
  unsubLabel: string;
}): string {
  return `
    <p style="color:#E8DCC8;margin-bottom:8px;">${args.intro}</p>
    <blockquote style="border-left:3px solid #00D4AA;padding-left:16px;color:#8B7355;font-style:italic;margin:16px 0;">
      <strong style="color:#E8DCC8;">${escapeHtml(args.title)}</strong><br/>
      ${escapeHtml(args.body)}
    </blockquote>
    <a href="${args.url}" style="display:inline-block;background:#00D4AA;color:#0F1729;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
      Vedi nel forum
    </a>
    <p style="margin-top:24px;color:#8B7355;font-size:12px;">
      <a href="${args.unsubUrl}" style="color:#8B7355;">${args.unsubLabel}</a>
    </p>
  `;
}

// Notifica i follower del thread di una nuova risposta (escluso l'autore della risposta).
export async function notifyNewReply(args: {
  threadId: string;
  threadTitle: string;
  threadSlug: string;
  replyContent: string;
  replyAuthorId: string;
  replyAuthorName: string;
}): Promise<void> {
  const rows: SubscriberRow[] = await prisma.threadSubscription.findMany({
    where: { threadId: args.threadId },
    select: {
      userId: true,
      unsubscribeToken: true,
      user: { select: { email: true, forumEmailOptOut: true } },
    },
  });

  const recipients = selectRecipients(rows, args.replyAuthorId);
  const url = `${siteUrl()}/forum/thread/${args.threadSlug}`;

  for (const r of recipients) {
    const unsubUrl = `${siteUrl()}/api/forum/unsubscribe?token=${r.unsubscribeToken}`;
    sendEmail({
      to: r.email,
      subject: `Nuova risposta: ${args.threadTitle}`,
      headers: { "List-Unsubscribe": `<${unsubUrl}>` },
      html: notificationHtml({
        intro: `<strong style="color:#00D4AA;">${escapeHtml(args.replyAuthorName)}</strong> ha risposto a una discussione che segui:`,
        title: args.threadTitle,
        body: preview(args.replyContent),
        url,
        unsubUrl,
        unsubLabel: "Smetti di seguire questa discussione",
      }),
    }).catch(console.error);
  }
}

// Notifica i follower della categoria di un nuovo thread (escluso il creatore).
export async function notifyNewThread(args: {
  categoryId: string;
  threadTitle: string;
  threadSlug: string;
  threadContent: string;
  authorId: string;
  authorName: string;
}): Promise<void> {
  const rows: SubscriberRow[] = await prisma.categorySubscription.findMany({
    where: { categoryId: args.categoryId },
    select: {
      userId: true,
      unsubscribeToken: true,
      user: { select: { email: true, forumEmailOptOut: true } },
    },
  });

  const recipients = selectRecipients(rows, args.authorId);
  const url = `${siteUrl()}/forum/thread/${args.threadSlug}`;

  for (const r of recipients) {
    const unsubUrl = `${siteUrl()}/api/forum/unsubscribe?token=${r.unsubscribeToken}`;
    sendEmail({
      to: r.email,
      subject: `Nuova discussione: ${args.threadTitle}`,
      headers: { "List-Unsubscribe": `<${unsubUrl}>` },
      html: notificationHtml({
        intro: `<strong style="color:#00D4AA;">${escapeHtml(args.authorName)}</strong> ha aperto una nuova discussione in una categoria che segui:`,
        title: args.threadTitle,
        body: preview(args.threadContent),
        url,
        unsubUrl,
        unsubLabel: "Smetti di seguire questa categoria",
      }),
    }).catch(console.error);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore in `lib/forum-notify.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/forum-notify.ts
git commit -m "feat(forum): orchestrazione notifiche (auto-follow + invio email)"
```

---

## Task 5: Wire — `POST /api/forum/replies`

**Files:**
- Modify: `app/api/forum/replies/route.ts`

- [ ] **Step 1: Sostituire il blocco "Notify thread author" con auto-follow + notifica follower**

Aggiungere in cima all'import esistente di `sendEmail` (riga 4) la riga:
```ts
import { ensureThreadSubscription, notifyNewReply } from "@/lib/forum-notify";
```
(Si può rimuovere l'import `sendEmail` da questo file: non viene più usato direttamente.)

Sostituire tutto il blocco da `// Notify thread author if different from reply author` fino alla `}` che lo chiude (righe 41–71 nella versione attuale) con:

```ts
  // Auto-follow: chi risponde inizia a seguire il thread
  await ensureThreadSubscription(userId, threadId).catch(console.error);

  // Notifica (in background) tutti i follower del thread tranne l'autore della risposta
  notifyNewReply({
    threadId,
    threadTitle: thread.title,
    threadSlug: thread.slug,
    replyContent: content,
    replyAuthorId: userId,
    replyAuthorName: reply.user.name ?? reply.user.email ?? "Qualcuno",
  }).catch(console.error);
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore. (Se `sendEmail` risulta importato ma non usato non è un errore: `ignoreBuildErrors` è attivo, ma per pulizia rimuoverlo.)

- [ ] **Step 3: Verifica manuale**

Con dev server (`npm run dev`) e due utenti, oppure in produzione dopo il deploy: rispondere a un thread seguito da un altro utente e confermare l'arrivo dell'email (durante i test pre-dominio, l'email arriva solo a `enzo.ccc@gmail.com`).

- [ ] **Step 4: Commit**

```bash
git add app/api/forum/replies/route.ts
git commit -m "feat(forum): risposte → auto-follow + notifica follower del thread"
```

---

## Task 6: Wire — `POST /api/forum/threads`

**Files:**
- Modify: `app/api/forum/threads/route.ts`

- [ ] **Step 1: Importare l'orchestrazione**

Dopo gli import esistenti (dopo riga 3) aggiungere:
```ts
import { ensureThreadSubscription, notifyNewThread } from "@/lib/forum-notify";
```

- [ ] **Step 2: Dopo la creazione del thread, auto-follow + notifica categoria**

Subito dopo il blocco `const thread = await prisma.forumThread.create({ ... });` e prima di `return NextResponse.json(thread, { status: 201 });`, inserire:

```ts
  // Auto-follow: il creatore segue il proprio thread (per le risposte future)
  await ensureThreadSubscription(userId, thread.id).catch(console.error);

  // Notifica (in background) i follower della categoria, tranne il creatore
  notifyNewThread({
    categoryId,
    threadTitle: thread.title,
    threadSlug: thread.slug,
    threadContent: content,
    authorId: userId,
    authorName: (session.user as { name?: string | null }).name ?? "Qualcuno",
  }).catch(console.error);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 4: Commit**

```bash
git add app/api/forum/threads/route.ts
git commit -m "feat(forum): nuovo thread → auto-follow creatore + notifica follower categoria"
```

---

## Task 7: API — `POST/DELETE /api/forum/subscriptions`

**Files:**
- Create: `app/api/forum/subscriptions/route.ts`

- [ ] **Step 1: Scrivere la route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

type Body = { type?: "thread" | "category"; id?: string };

async function getUserId() {
  const session = await getSession();
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { type, id }: Body = await req.json();
  if (!type || !id) return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });

  if (type === "thread") {
    await prisma.threadSubscription.upsert({
      where: { userId_threadId: { userId, threadId: id } },
      update: {},
      create: { userId, threadId: id },
    });
  } else {
    await prisma.categorySubscription.upsert({
      where: { userId_categoryId: { userId, categoryId: id } },
      update: {},
      create: { userId, categoryId: id },
    });
  }
  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { type, id }: Body = await req.json();
  if (!type || !id) return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });

  if (type === "thread") {
    await prisma.threadSubscription.deleteMany({ where: { userId, threadId: id } });
  } else {
    await prisma.categorySubscription.deleteMany({ where: { userId, categoryId: id } });
  }
  return NextResponse.json({ following: false });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add app/api/forum/subscriptions/route.ts
git commit -m "feat(forum): API toggle follow (thread/categoria)"
```

---

## Task 8: API — `GET /api/forum/unsubscribe`

**Files:**
- Create: `app/api/forum/unsubscribe/route.ts`

- [ ] **Step 1: Scrivere la route con pagina HTML di conferma**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function page(message: string): NextResponse {
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>pyArchInit — Disiscrizione</title></head>
<body style="margin:0;background:#0F1729;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:520px;margin:80px auto;padding:32px;background:#1A1E2E;border-radius:12px;text-align:center;">
    <h1 style="color:#00D4AA;font-size:20px;margin:0 0 16px;">pyArchInit</h1>
    <p style="color:#E8DCC8;font-size:15px;line-height:1.6;">${message}</p>
    <a href="${process.env.NEXTAUTH_URL ?? "https://pyarchinit.org"}/forum" style="display:inline-block;margin-top:24px;color:#00D4AA;text-decoration:none;">← Torna al forum</a>
  </div>
</body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return page("Link non valido.");

  const thread = await prisma.threadSubscription.findUnique({ where: { unsubscribeToken: token } });
  if (thread) {
    await prisma.threadSubscription.delete({ where: { id: thread.id } });
    return page("Non seguirai più questa discussione. Non riceverai altre email a riguardo.");
  }

  const category = await prisma.categorySubscription.findUnique({ where: { unsubscribeToken: token } });
  if (category) {
    await prisma.categorySubscription.delete({ where: { id: category.id } });
    return page("Non seguirai più questa categoria. Non riceverai altre email a riguardo.");
  }

  return page("Questa sottoscrizione non esiste più (forse ti eri già disiscritto).");
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add app/api/forum/unsubscribe/route.ts
git commit -m "feat(forum): disiscrizione one-click via token"
```

---

## Task 9: API — `PATCH /api/account/preferences`

**Files:**
- Create: `app/api/account/preferences/route.ts`

- [ ] **Step 1: Scrivere la route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { forumEmailOptOut } = await req.json();
  if (typeof forumEmailOptOut !== "boolean") {
    return NextResponse.json({ error: "Valore non valido" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { forumEmailOptOut } });
  return NextResponse.json({ forumEmailOptOut });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add app/api/account/preferences/route.ts
git commit -m "feat(account): API toggle forumEmailOptOut"
```

---

## Task 10: UI — `FollowButton` + integrazione pagina thread

**Files:**
- Create: `app/(public)/forum/_components/FollowButton.tsx`
- Modify: `app/(public)/forum/thread/[slug]/page.tsx`

- [ ] **Step 1: Creare il componente client riusabile**

```tsx
"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface Props {
  type: "thread" | "category";
  id: string;
  initialFollowing: boolean;
}

export function FollowButton({ type, id, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/forum/subscriptions", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setFollowing(Boolean(data.following));
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-mono rounded-full px-3 py-1.5 transition disabled:opacity-50 ${
        following
          ? "bg-teal/10 text-teal border border-teal/40"
          : "text-sand/60 border border-sand/20 hover:border-teal/50 hover:text-teal"
      }`}
    >
      {following ? <BellOff size={13} /> : <Bell size={13} />}
      {following ? "Non seguire" : "Segui"}
    </button>
  );
}
```

- [ ] **Step 2: Integrare nella pagina thread**

In `app/(public)/forum/thread/[slug]/page.tsx`:

(a) aggiungere l'import dopo `import { ReplyForm } from "./ReplyForm";`:
```tsx
import { FollowButton } from "../../_components/FollowButton";
```

(b) dopo `const isLoggedIn = !!session?.user;` (riga 48) aggiungere il calcolo dello stato di follow:
```tsx
  let following = false;
  if (isLoggedIn) {
    const sub = await prisma.threadSubscription.findUnique({
      where: {
        userId_threadId: {
          userId: (session!.user as { id: string }).id,
          threadId: thread.id,
        },
      },
      select: { id: true },
    });
    following = !!sub;
  }
```

(c) nel blocco header, sostituire il `<div className="flex items-center gap-4 text-xs text-sand/40"> ... </div>` (la riga delle meta: autore/data/views/risposte) avvolgendolo in un contenitore con il bottone. Sostituire quel `<div>…</div>` con:
```tsx
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-sand/40">
              <span>{thread.user.name ?? thread.user.email}</span>
              <span>{new Date(thread.createdAt).toLocaleDateString("it-IT")}</span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {thread.views}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {thread.replies.length}
              </span>
            </div>
            {isLoggedIn && (
              <FollowButton type="thread" id={thread.id} initialFollowing={following} />
            )}
          </div>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 4: Verifica manuale**

`npm run dev` → aprire un thread da loggato: il bottone mostra "Segui"; al click diventa "Non seguire" e ricaricando la pagina lo stato persiste.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/forum/_components/FollowButton.tsx" "app/(public)/forum/thread/[slug]/page.tsx"
git commit -m "feat(forum): bottone Segui/Non seguire nella pagina thread"
```

---

## Task 11: UI — follow categoria

**Files:**
- Modify: `app/(public)/forum/[category]/page.tsx`

- [ ] **Step 1: Importare sessione e FollowButton**

Aggiungere agli import in cima:
```tsx
import { getSession } from "@/lib/auth-utils";
import { FollowButton } from "../_components/FollowButton";
```

- [ ] **Step 2: Calcolare lo stato di follow della categoria**

Dopo `if (!category) notFound();` (riga 30) aggiungere:
```tsx
  const session = await getSession();
  const isLoggedIn = !!session?.user;
  let following = false;
  if (isLoggedIn) {
    const sub = await prisma.categorySubscription.findUnique({
      where: {
        userId_categoryId: {
          userId: (session!.user as { id: string }).id,
          categoryId: category.id,
        },
      },
      select: { id: true },
    });
    following = !!sub;
  }
```

- [ ] **Step 3: Mostrare il bottone nell'header della categoria**

Sostituire il blocco titolo categoria (il `<div className="flex items-center gap-3 mb-2"> ... </div>` con il pallino e l'`<h1>`) con una versione che affianca il bottone:
```tsx
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand">
                {category.name}
              </h1>
            </div>
            {isLoggedIn && (
              <FollowButton type="category" id={category.id} initialFollowing={following} />
            )}
          </div>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/forum/[category]/page.tsx"
git commit -m "feat(forum): bottone Segui categoria"
```

---

## Task 12: UI — interruttore email forum nel profilo

**Files:**
- Create: `app/(public)/account/ForumEmailToggle.tsx`
- Modify: `app/(public)/account/page.tsx`

- [ ] **Step 1: Creare il toggle client**

```tsx
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

export function ForumEmailToggle({ initial }: { initial: boolean }) {
  // initial = forumEmailOptOut. enabled = riceve email = !optOut
  const [enabled, setEnabled] = useState(!initial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = !enabled;
    const res = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forumEmailOptOut: !next }),
    });
    if (res.ok) setEnabled(next);
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="flex items-center justify-between w-full text-left disabled:opacity-50"
    >
      <span className="flex items-center gap-2 text-sm text-sand/70">
        <Bell size={15} className="text-teal" />
        Ricevi email dal forum
      </span>
      <span
        className={`relative inline-block w-10 h-5 rounded-full transition ${enabled ? "bg-teal" : "bg-sand/20"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Integrare nella pagina account**

In `app/(public)/account/page.tsx`:

(a) aggiungere l'import in cima (dopo gli altri import):
```tsx
import { ForumEmailToggle } from "./ForumEmailToggle";
```

(b) nella `select` della query `prisma.user.findUnique` aggiungere `forumEmailOptOut: true`:
```tsx
      select: { id: true, name: true, email: true, createdAt: true, role: true, forumEmailOptOut: true },
```

(c) prima della chiusura `</div>` del container `max-w-2xl` (subito dopo il blocco "Code activation"), aggiungere una nuova card:
```tsx
        {/* Notifiche */}
        <div className="bg-code-bg border border-sand/10 rounded-card p-6 mt-6">
          <h3 className="font-mono font-semibold text-sand mb-4">Notifiche</h3>
          <ForumEmailToggle initial={user.forumEmailOptOut} />
          <p className="text-xs text-sand/40 mt-3">
            Quando è attivo, ricevi un'email per le nuove risposte alle discussioni che segui
            e per i nuovi thread nelle categorie che segui.
          </p>
        </div>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 4: Verifica manuale**

`npm run dev` → `/account`: l'interruttore riflette lo stato; spegnendolo e ricaricando rimane spento (persistito su DB).

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/account/ForumEmailToggle.tsx" "app/(public)/account/page.tsx"
git commit -m "feat(account): interruttore Ricevi email dal forum"
```

---

## Task 13: Deploy e verifica finale

- [ ] **Step 1: Push (auto-deploy Vercel)**

```bash
git push origin master
```

- [ ] **Step 2: Attendere il deploy Ready**

Run: `vercel ls 2>&1 | sed -n '7p'`
Expected: deploy più recente `● Ready` in Production.

- [ ] **Step 3: Verifica funzionale (pre-dominio: email solo a enzo.ccc@gmail.com)**

- Da loggato, seguire una categoria → creare un thread con un secondo account in quella categoria → verificare l'email.
- Seguire un thread → far rispondere un secondo account → verificare l'email.
- Cliccare il link "Smetti di seguire" nell'email → vedere la pagina di conferma; il bottone in pagina torna su "Segui".
- In `/account` spegnere "Ricevi email dal forum" → non arrivano più notifiche.

- [ ] **Step 4 (operativo, separato): dominio Resend**

Verificare il dominio su resend.com/domains, impostare `EMAIL_FROM="pyArchInit <noreply@pyarchinit.org>"` su Vercel (Production) e redeploy. Solo dopo questo passo le email raggiungono utenti diversi dal titolare dell'account.

---

## Self-review (eseguito)

- **Copertura spec:** §3 modello dati → Task 1; §4 follow → Task 5/6/10/11; §5 trigger → Task 5/6; §6 email → Task 4; §7 invio → Task 4; §8 API → Task 7/8/9; §9 UI → Task 10/11/12; §2 prerequisiti → Task 13. Nessun requisito scoperto.
- **Placeholder:** nessuno (rimosso il finto segnaposto in Task 1 Step 3; ogni step contiene codice/comandi reali).
- **Coerenza tipi:** `selectRecipients(rows, excludeUserId)` e `SubscriberRow` coincidono tra Task 3 e Task 4; `userId_threadId` / `userId_categoryId` (compound unique Prisma) usati coerentemente in Task 1/4/7/10/11; `{ following: boolean }` coerente tra Task 7 e Task 10.
