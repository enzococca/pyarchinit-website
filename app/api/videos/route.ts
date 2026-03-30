import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(req: NextRequest) {
  const publishedParam = req.nextUrl.searchParams.get("published");
  const where = publishedParam === "true" ? { published: true } : {};

  const videos = await db.video.findMany({
    where,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();

  const video = await db.video.create({
    data: {
      title: data.title,
      youtubeId: data.youtubeId,
      category: data.category,
      description: data.description ?? null,
      order: data.order ?? 0,
      published: data.published ?? true,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
