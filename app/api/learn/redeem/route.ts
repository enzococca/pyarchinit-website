export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const HEX_CODE_REGEX = /^[A-Fa-f0-9]{12}$/;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Sessione non valida" }, { status: 401 });
  }

  let code: string;
  try {
    const body = await req.json();
    code = (body.code as string)?.trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  if (!code || !HEX_CODE_REGEX.test(code)) {
    return NextResponse.json({ error: "Codice non valido. Deve essere un codice hex di 12 caratteri." }, { status: 400 });
  }

  const courseCode = await prisma.courseCode.findUnique({ where: { code } });

  if (!courseCode) {
    return NextResponse.json({ error: "Codice non trovato" }, { status: 404 });
  }

  if (courseCode.usedBy) {
    return NextResponse.json({ error: "Questo codice è già stato utilizzato" }, { status: 409 });
  }

  // Check if user already has access
  const existing = await prisma.coursePayment.findUnique({
    where: { userId_courseSlug: { userId, courseSlug: courseCode.courseSlug } },
  });
  if (existing) {
    return NextResponse.json({ error: "Hai già accesso a questo corso" }, { status: 409 });
  }

  // Mark code as used and create payment atomically
  await prisma.$transaction([
    prisma.courseCode.update({
      where: { code },
      data: { usedBy: userId, usedAt: new Date() },
    }),
    prisma.coursePayment.create({
      data: {
        userId,
        courseSlug: courseCode.courseSlug,
        amount: 0,
        currency: "EUR",
        provider: "code",
        providerId: code,
        status: "completed",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, courseSlug: courseCode.courseSlug });
}
