// Temporary debug - will remove
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasPaypalId: !!process.env.PAYPAL_CLIENT_ID,
    hasPaypalSecret: !!process.env.PAYPAL_CLIENT_SECRET,
    paypalMode: process.env.PAYPAL_MODE || "NOT_SET",
    paypalIdPrefix: process.env.PAYPAL_CLIENT_ID?.substring(0, 10) || "EMPTY",
  });
}
