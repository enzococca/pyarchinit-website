import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email richiesta" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.confirmed && !existing.unsubscribedAt) {
      return NextResponse.json({ message: "already_subscribed" });
    }

    // Resubscribe (unsubscribed or not yet confirmed)
    await prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        name: name ?? existing.name,
        confirmed: true,
        confirmToken: null,
        unsubscribedAt: null,
      },
    });

    // Try to send welcome email, but don't fail if SMTP is not configured
    try {
      await sendWelcomeEmail(normalizedEmail, req);
    } catch {
      // SMTP not configured or failed – subscription still succeeds
    }

    return NextResponse.json({ message: "subscribed" });
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email: normalizedEmail,
      name: name ?? null,
      confirmed: true,
      confirmToken: null,
    },
  });

  // Try to send welcome email, but don't fail if SMTP is not configured
  try {
    await sendWelcomeEmail(normalizedEmail, req);
  } catch {
    // SMTP not configured or failed – subscription still succeeds
  }

  return NextResponse.json({ message: "subscribed" }, { status: 201 });
}

async function sendWelcomeEmail(email: string, req: NextRequest) {
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`;

  await sendEmail({
    to: email,
    subject: "Benvenuto nella newsletter pyArchInit",
    html: `
      <p style="color:#E8DCC8;margin-bottom:16px;">
        Grazie per esserti iscritto alla newsletter di <strong>pyArchInit</strong>!
      </p>
      <p style="color:#E8DCC8;margin-bottom:24px;">
        Riceverai aggiornamenti su nuovi corsi, articoli e novità dall'ecosistema pyArchInit.
      </p>
      <a
        href="${baseUrl}"
        style="display:inline-block;background:#00D4AA;color:#0F1729;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;"
      >
        Visita pyArchInit
      </a>
      <p style="color:#8B7355;font-size:12px;margin-top:24px;">
        Se non hai richiesto questa iscrizione, ignora questa email.
      </p>
    `,
  });
}
