import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: true, tags: true },
  });
  return NextResponse.json(posts);
}


export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title } = await req.json();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post = await prisma.blogPost.create({ data: { title, slug, blocks: [] } });
  return NextResponse.json(post);
}
