import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

// GET - list all threads for admin moderation
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const threads = await prisma.forumThread.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      category: true,
      _count: { select: { replies: true } },
    },
  });
  return NextResponse.json(threads);
}

// PATCH - pin/lock/delete a thread or delete a reply

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const { action, threadId, replyId } = await req.json();

  if (action === "pin" && threadId) {
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
    const updated = await prisma.forumThread.update({
      where: { id: threadId },
      data: { pinned: !thread.pinned },
    });
    return NextResponse.json(updated);
  }

  if (action === "lock" && threadId) {
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
    const updated = await prisma.forumThread.update({
      where: { id: threadId },
      data: { locked: !thread.locked },
    });
    return NextResponse.json(updated);
  }

  if (action === "deleteThread" && threadId) {
    await prisma.forumThread.delete({ where: { id: threadId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "deleteReply" && replyId) {
    await prisma.forumReply.delete({ where: { id: replyId } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
}
