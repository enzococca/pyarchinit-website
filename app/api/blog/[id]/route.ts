import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    include: { categories: true, tags: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const data = await req.json();
  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      blocks: data.blocks,
      coverImage: data.coverImage,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json(post);
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
