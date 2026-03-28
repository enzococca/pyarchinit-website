import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { randomUUID } from "crypto";

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
    const confirmToken = randomUUID();
    await prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        name: name ?? existing.name,
        confirmed: false,
        confirmToken,
        unsubscribedAt: null,
      },
    });

    await sendConfirmationEmail(normalizedEmail, confirmToken, req);
    return NextResponse.json({ message: "confirmation_sent" });
  }

  const confirmToken = randomUUID();
  await prisma.newsletterSubscriber.create({
    data: {
      email: normalizedEmail,
      name: name ?? null,
      confirmToken,
    },
  });

  await sendConfirmationEmail(normalizedEmail, confirmToken, req);
  return NextResponse.json({ message: "confirmation_sent" }, { status: 201 });
}

async function sendConfirmationEmail(
  email: string,
  token: string,
  req: NextRequest
) {
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`;

  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Conferma iscrizione alla newsletter pyArchInit",
    html: `
      <p style="color:#E8DCC8;margin-bottom:16px;">
        Grazie per esserti iscritto alla newsletter di <strong>pyArchInit</strong>!
      </p>
      <p style="color:#E8DCC8;margin-bottom:24px;">
        Clicca il pulsante qui sotto per confermare la tua iscrizione:
      </p>
      <a
        href="${confirmUrl}"
        style="display:inline-block;background:#00D4AA;color:#0F1729;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;"
      >
        Conferma iscrizione
      </a>
      <p style="color:#8B7355;font-size:12px;margin-top:24px;">
        Se non hai richiesto questa iscrizione, ignora questa email.
      </p>
    `,
  });
}
