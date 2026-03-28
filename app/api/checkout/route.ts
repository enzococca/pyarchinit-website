import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20" as any,
  });
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userId = (session.user as any).id as string;

  const formData = await req.formData();
  const courseId = formData.get("courseId") as string;

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check for existing enrollment
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Free course: enroll directly
  if (!course.price || course.price === 0) {
    await prisma.enrollment.create({
      data: { userId, courseId },
    });

    // Send welcome email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const siteUrl = process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";
      sendEmail({
        to: user.email,
        subject: `Benvenuto nel corso: ${course.title}`,
        html: `
          <p style="color:#E8DCC8;margin-bottom:16px;">
            Ciao ${user.name ?? ""}! La tua iscrizione al corso <strong style="color:#00D4AA;">${course.title}</strong> è stata completata.
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

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Paid course: create Stripe checkout session
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: course.title,
            ...(course.coverImage && { images: [course.coverImage] }),
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { userId, courseId },
    success_url: `${origin}/dashboard?enrolled=${courseId}`,
    cancel_url: `${origin}/corsi/${course.slug}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
