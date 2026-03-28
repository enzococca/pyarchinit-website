import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.forumCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      threads: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          user: { select: { name: true } },
        },
      },
      _count: {
        select: { threads: true },
      },
    },
  });
  return NextResponse.json(categories);
}
