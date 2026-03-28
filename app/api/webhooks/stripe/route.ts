import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

      // Send welcome email
      const [user, course] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.course.findUnique({ where: { id: courseId } }),
      ]);

      if (user?.email && course) {
        const siteUrl = process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";
        sendEmail({
          to: user.email,
          subject: `Benvenuto nel corso: ${course.title}`,
          html: `
            <p style="color:#E8DCC8;margin-bottom:16px;">
              Ciao ${user.name ?? ""}! Il tuo acquisto del corso <strong style="color:#00D4AA;">${course.title}</strong> è stato confermato.
            </p>
            <p style="color:#8B7355;margin-bottom:24px;">
              Puoi iniziare subito a studiare dalla tua dashboard.
            </p>
            <a
              href="${siteUrl}/dashboard"
              style="display:inline-block;background:#00D4AA;color:#0F1729;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;"
            >
              Vai alla dashboard
            </a>
          `,
        }).catch(console.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
