import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, unknown> = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();
  for (const [key, value] of Object.entries(data)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }
  return NextResponse.json({ ok: true });
}
