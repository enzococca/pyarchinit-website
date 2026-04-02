export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

// GET /api/learn/codes?courseSlug=xxx  — list codes for a course (admin only)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseSlug = searchParams.get("courseSlug");
  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug mancante" }, { status: 400 });
  }

  const codes = await prisma.courseCode.findMany({
    where: { courseSlug },
    orderBy: { createdAt: "desc" },
  });

  // Fetch user names for used codes
  const usedByIds = codes.filter((c) => c.usedBy).map((c) => c.usedBy as string);
  const users =
    usedByIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: usedByIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json(
    codes.map((c) => ({
      id: c.id,
      code: c.code,
      courseSlug: c.courseSlug,
      duration: (c as any).duration || "forever",
      available: !c.usedBy,
      usedAt: c.usedAt?.toISOString() ?? null,
      usedBy: c.usedBy ? (userMap[c.usedBy] ?? { id: c.usedBy, name: null, email: null }) : null,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

// POST /api/learn/codes  — generate N codes for a course (admin only)
// Body: { courseSlug: string, count: number }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  let courseSlug: string;
  let count: number;
  let duration: string;
  try {
    const body = await req.json();
    courseSlug = body.courseSlug as string;
    count = Math.min(Math.max(parseInt(body.count as string) || 1, 1), 100);
    duration = body.duration || "forever"; // "1day", "1week", "1month", "forever"
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug mancante" }, { status: 400 });
  }

  if (!["1day", "1week", "1month", "forever"].includes(duration)) {
    return NextResponse.json({ error: "Durata non valida" }, { status: 400 });
  }

  // Verify course exists
  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: courseSlug },
    select: { slug: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Corso non trovato" }, { status: 404 });
  }

  // Generate unique hex codes
  const codes: string[] = [];
  while (codes.length < count) {
    const code = randomBytes(6).toString("hex").toUpperCase();
    if (!codes.includes(code)) codes.push(code);
  }

  const created = await prisma.courseCode.createMany({
    data: codes.map((code) => ({ code, courseSlug, duration })),
    skipDuplicates: true,
  });

  const durationLabel: Record<string, string> = {
    "1day": "1 giorno", "1week": "1 settimana", "1month": "1 mese", "forever": "per sempre"
  };

  return NextResponse.json({ ok: true, created: created.count, codes, duration: durationLabel[duration] || duration });
}
