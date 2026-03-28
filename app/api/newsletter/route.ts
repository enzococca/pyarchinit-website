import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const [subscribers, total, confirmed, unsubscribed] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({
      where: { confirmed: true, unsubscribedAt: null },
    }),
    prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: { not: null } },
    }),
  ]);

  return NextResponse.json({ subscribers, stats: { total, confirmed, unsubscribed } });
}
