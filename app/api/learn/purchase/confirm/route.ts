export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";
const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

async function capturePayPalOrder(orderId: string): Promise<boolean> {
  const token = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await res.json()) as { status?: string };
  return data.status === "COMPLETED";
}

async function verifyStripeSession(sessionId: string): Promise<{
  success: boolean;
  courseSlug?: string;
  userId?: string;
}> {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
  if (!STRIPE_SECRET_KEY) return { success: false };

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    }
  );

  const data = (await res.json()) as {
    payment_status?: string;
    metadata?: { courseSlug?: string; userId?: string };
  };

  if (data.payment_status !== "paid") return { success: false };
  return {
    success: true,
    courseSlug: data.metadata?.courseSlug,
    userId: data.metadata?.userId,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const courseSlug = searchParams.get("courseSlug");
  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const errorRedirect = NextResponse.redirect(
    `${origin}/impara/${courseSlug ?? ""}?payment_error=1`
  );

  try {
    if (provider === "paypal") {
      const paymentId = searchParams.get("paymentId");
      const token = searchParams.get("token"); // PayPal order token

      if (!paymentId || !token || !courseSlug) return errorRedirect;

      const payment = await prisma.coursePayment.findUnique({
        where: { id: paymentId },
      });
      if (!payment || payment.status === "completed") {
        return NextResponse.redirect(`${origin}/impara/${courseSlug}`);
      }

      // Capture the order using the PayPal order ID (stored as providerId or token)
      const orderId = payment.providerId ?? token;
      const captured = await capturePayPalOrder(orderId);

      if (!captured) return errorRedirect;

      await prisma.coursePayment.update({
        where: { id: paymentId },
        data: { status: "completed", providerId: orderId },
      });

      return NextResponse.redirect(`${origin}/impara/${courseSlug}?payment_success=1`);
    }

    if (provider === "stripe") {
      const sessionId = searchParams.get("session_id");
      if (!sessionId || !courseSlug) return errorRedirect;

      const result = await verifyStripeSession(sessionId);
      if (!result.success || !result.userId) return errorRedirect;

      await prisma.coursePayment.upsert({
        where: {
          userId_courseSlug: {
            userId: result.userId,
            courseSlug: courseSlug,
          },
        },
        create: {
          userId: result.userId,
          courseSlug: courseSlug,
          amount: 0, // amount is not in session without expanded data
          currency: "EUR",
          provider: "stripe",
          providerId: sessionId,
          status: "completed",
        },
        update: { status: "completed", providerId: sessionId },
      });

      return NextResponse.redirect(`${origin}/impara/${courseSlug}?payment_success=1`);
    }

    return errorRedirect;
  } catch (e: unknown) {
    console.error("[purchase/confirm] error:", e);
    return errorRedirect;
  }
}
