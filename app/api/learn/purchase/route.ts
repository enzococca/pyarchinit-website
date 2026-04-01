export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

// ── PayPal helpers ──────────────────────────────────────────────────────────

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
  if (!data.access_token) {
    throw new Error("PayPal authentication failed");
  }
  return data.access_token;
}

async function createPayPalOrder(
  amount: number,
  currency: string,
  courseSlug: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approvalUrl: string }> {
  const token = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: `Corso: ${courseSlug}`,
          custom_id: courseSlug,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "pyArchInit",
        user_action: "PAY_NOW",
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
    message?: string;
  };

  if (!data.id) {
    throw new Error(`PayPal order creation failed: ${data.message ?? JSON.stringify(data)}`);
  }

  const approvalLink = data.links?.find((l) => l.rel === "approve");
  if (!approvalLink) {
    throw new Error("PayPal approval URL not found in response");
  }

  return { id: data.id, approvalUrl: approvalLink.href };
}

// ── Stripe helpers ──────────────────────────────────────────────────────────

async function createStripeSession(
  amount: number,
  currency: string,
  courseSlug: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
  if (!STRIPE_SECRET_KEY) throw new Error("Stripe not configured");

  const body = new URLSearchParams({
    "payment_method_types[]": "card",
    "line_items[0][price_data][currency]": currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": `Corso: ${courseSlug}`,
    "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "metadata[courseSlug]": courseSlug,
    "metadata[userId]": userId,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as { url?: string; error?: { message: string } };
  if (!data.url) {
    throw new Error(`Stripe session failed: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data.url;
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "ID utente mancante" }, { status: 401 });
  }

  let body: { courseSlug?: string; provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const { courseSlug, provider } = body;

  if (!courseSlug || !provider) {
    return NextResponse.json(
      { error: "courseSlug e provider sono obbligatori" },
      { status: 400 }
    );
  }

  if (!["paypal", "stripe", "free"].includes(provider)) {
    return NextResponse.json(
      { error: "Provider non supportato" },
      { status: 400 }
    );
  }

  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: courseSlug, published: true },
    select: { price: true, title: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Corso non trovato" }, { status: 404 });
  }

  // Check if already purchased
  const existing = await prisma.coursePayment.findUnique({
    where: { userId_courseSlug: { userId, courseSlug } },
  });
  if (existing?.status === "completed") {
    return NextResponse.json({ redirect: `/impara/${courseSlug}` });
  }

  // Free course — create completed payment directly
  if (course.price === 0) {
    await prisma.coursePayment.upsert({
      where: { userId_courseSlug: { userId, courseSlug } },
      create: {
        userId,
        courseSlug,
        amount: 0,
        currency: "EUR",
        provider: "free",
        status: "completed",
      },
      update: { status: "completed" },
    });
    return NextResponse.json({ redirect: `/impara/${courseSlug}` });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    if (provider === "paypal") {
      // Create pending payment record first to store state
      const pending = await prisma.coursePayment.upsert({
        where: { userId_courseSlug: { userId, courseSlug } },
        create: {
          userId,
          courseSlug,
          amount: course.price,
          currency: "EUR",
          provider: "paypal",
          status: "pending",
        },
        update: { status: "pending", provider: "paypal" },
      });

      const returnUrl = `${origin}/api/learn/purchase/confirm?provider=paypal&paymentId=${pending.id}&courseSlug=${courseSlug}`;
      const cancelUrl = `${origin}/impara/${courseSlug}?cancelled=1`;

      const { id: orderId, approvalUrl } = await createPayPalOrder(
        course.price,
        "EUR",
        courseSlug,
        returnUrl,
        cancelUrl
      );

      // Store PayPal order ID
      await prisma.coursePayment.update({
        where: { id: pending.id },
        data: { providerId: orderId },
      });

      return NextResponse.json({ redirectUrl: approvalUrl });
    }

    if (provider === "stripe") {
      const successUrl = `${origin}/api/learn/purchase/confirm?provider=stripe&courseSlug=${courseSlug}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/impara/${courseSlug}?cancelled=1`;

      const stripeUrl = await createStripeSession(
        course.price,
        "EUR",
        courseSlug,
        userId,
        successUrl,
        cancelUrl
      );

      return NextResponse.json({ redirectUrl: stripeUrl });
    }

    return NextResponse.json({ error: "Provider non valido" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[purchase] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
