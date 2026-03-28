import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const data = await req.json();

  const project = await db.project.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      url: data.url ?? null,
      githubUrl: data.githubUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      status: data.status,
      order: data.order,
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await db.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
