import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { content, threadId } = await req.json();
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

  return NextResponse.json(reply, { status: 201 });
}
