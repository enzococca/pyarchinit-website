import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const folder = req.nextUrl.searchParams.get("folder") || undefined;
  const media = await prisma.media.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}
