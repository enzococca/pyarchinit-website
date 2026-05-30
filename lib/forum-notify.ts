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
