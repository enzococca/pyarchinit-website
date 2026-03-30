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

  const video = await db.video.update({
    where: { id: params.id },
    data: {
      title: data.title,
      youtubeId: data.youtubeId,
      category: data.category,
      description: data.description ?? null,
      order: data.order,
      published: data.published,
    },
  });

  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await db.video.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
