import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const { title, slug, blocks, status } = await req.json();

  const page = await prisma.page.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(blocks !== undefined && { blocks }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(page);
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await prisma.page.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
