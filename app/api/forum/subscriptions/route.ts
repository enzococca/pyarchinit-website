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
