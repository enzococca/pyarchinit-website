import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();

    const referrer = req.headers.get("referer") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const country = req.headers.get("x-vercel-ip-country") ?? null;
    const city = req.headers.get("x-vercel-ip-city") ?? null;

    await db.pageView.create({
      data: {
        path: path ?? "/",
        referrer,
        userAgent,
        country,
        city,
      },
    });
  } catch {
    // Silently fail — analytics should never break the site
  }

  return new NextResponse(null, { status: 204 });
}
