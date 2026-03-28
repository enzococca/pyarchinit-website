import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, courseId } = session.metadata ?? {};

    if (userId && courseId) {
      // Upsert enrollment (idempotent)
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: {
          userId,
          courseId,
          paymentId: session.payment_intent as string | undefined,
        },
        update: {
          paymentId: session.payment_intent as string | undefined,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
