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
