import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const reply = await prisma.forumReply.findUnique({ where: { id } });
  if (!reply) {
    return NextResponse.json({ error: "Risposta non trovata" }, { status: 404 });
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  if (reply.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { content } = await req.json();
  const updated = await prisma.forumReply.update({
    where: { id },
    data: { content },
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

  const reply = await prisma.forumReply.findUnique({ where: { id } });
  if (!reply) {
    return NextResponse.json({ error: "Risposta non trovata" }, { status: 404 });
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  if (reply.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.forumReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
