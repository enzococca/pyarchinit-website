import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

interface RawPageView {
  path: string;
  referrer: string | null;
  country: string | null;
  createdAt: Date;
}

export async function GET() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [todayCount, allViews, recent] = await Promise.all([
    db.pageView.count({
      where: { createdAt: { gte: startOfToday } },
    }) as Promise<number>,
    db.pageView.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { path: true, referrer: true, country: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }) as Promise<RawPageView[]>,
    db.pageView.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }) as Promise<Record<string, unknown>[]>,
  ]);

  // Build last 7 days array
  const last7days: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = allViews.filter(
      (v: RawPageView) => v.createdAt.toISOString().slice(0, 10) === dateStr
    ).length;
    last7days.push({ date: dateStr, count });
  }

  // Top pages
  const pageCounts = allViews.reduce<Record<string, number>>((acc: Record<string, number>, v: RawPageView) => {
    acc[v.path] = (acc[v.path] ?? 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top referrers
  const referrerCounts = allViews.reduce<Record<string, number>>((acc: Record<string, number>, v: RawPageView) => {
    const ref = v.referrer ?? "(direct)";
    acc[ref] = (acc[ref] ?? 0) + 1;
    return acc;
  }, {});
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // Top countries
  const countryCounts = allViews.reduce<Record<string, number>>((acc: Record<string, number>, v: RawPageView) => {
    const c = v.country ?? "Unknown";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  return NextResponse.json({
    today: todayCount,
    last7days,
    topPages,
    topReferrers,
    topCountries,
    recent,
  });
}
