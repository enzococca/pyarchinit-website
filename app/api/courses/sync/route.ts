import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { syncFlyoverCourses } from "@/lib/flyover-sync";

// Manual sync trigger (admin only)
export async function POST() {
  await requireAdmin();
  const result = await syncFlyoverCourses();
  return NextResponse.json(result);
}

// Auto-sync on GET (can be called by cron)
export async function GET() {
  const result = await syncFlyoverCourses();
  return NextResponse.json(result);
}
