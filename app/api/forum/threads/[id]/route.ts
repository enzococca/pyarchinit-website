import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const thread = await prisma.forumThread.findUnique({
    where: { slug: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      category: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
  }

  // Increment view count asynchronously
  prisma.forumThread.update({
    where: { id: thread.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json(thread);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id } });
  if (!thread) {
    return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  if (thread.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const data = await req.json();
  const updated = await prisma.forumThread.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      pinned: data.pinned,
      locked: data.locked,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id } });
  if (!thread) {
    return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  if (thread.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.forumThread.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
