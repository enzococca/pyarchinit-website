import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(pages);
}


export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title, slug } = await req.json();

  if (!title || !slug) {
    return NextResponse.json({ error: "title e slug sono obbligatori" }, { status: 400 });
  }

  const page = await prisma.page.create({
    data: { title, slug },
  });

  return NextResponse.json(page, { status: 201 });
}
