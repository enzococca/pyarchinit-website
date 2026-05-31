import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { ensureThreadSubscription, notifyNewReply } from "@/lib/forum-notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { content, threadId, attachmentIds } = await req.json();
  if (!content || !threadId) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
  }
  if (thread.locked) {
    return NextResponse.json({ error: "Thread bloccato" }, { status: 403 });
  }

  const userId = (session.user as { id: string }).id;

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
  if (me?.banned) {
    return NextResponse.json(
      { error: "Sei stato escluso dal forum e non puoi pubblicare." },
      { status: 403 }
    );
  }

  const reply = await prisma.forumReply.create({
    data: { content, threadId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Bump thread updatedAt
  await prisma.forumThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  // Auto-follow: chi risponde inizia a seguire il thread
  await ensureThreadSubscription(userId, threadId).catch(console.error);

  if (Array.isArray(attachmentIds) && attachmentIds.length > 0) {
    await prisma.forumAttachment.updateMany({
      where: { id: { in: attachmentIds.slice(0, 4) }, uploaderId: userId, threadId: null, replyId: null },
      data: { replyId: reply.id },
    });
  }

  // Notifica (in background) tutti i follower del thread tranne l'autore della risposta
  notifyNewReply({
    threadId,
    threadTitle: thread.title,
    threadSlug: thread.slug,
    replyContent: content,
    replyAuthorId: userId,
    replyAuthorName: reply.user.name ?? reply.user.email ?? "Qualcuno",
  }).catch(console.error);

  return NextResponse.json(reply, { status: 201 });
}
