export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

// POST: revoke a user's access to a course
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: { userId?: string; courseSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const { userId, courseSlug } = body;
  if (!userId || !courseSlug) {
    return NextResponse.json({ error: "userId e courseSlug obbligatori" }, { status: 400 });
  }

  try {
    await prisma.coursePayment.update({
      where: { userId_courseSlug: { userId, courseSlug } },
      data: { status: "revoked" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Accesso non trovato" }, { status: 404 });
  }
}
