import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { name, email, type, message } = await req.json();
  const contact = await prisma.contact.create({
    data: { name, email, type, message },
  });

  // Notify admin
  if (process.env.ADMIN_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Nuovo messaggio di contatto da ${name}`,
      html: `
        <p style="color:#E8DCC8;margin-bottom:8px;">
          <strong style="color:#00D4AA;">Da:</strong> ${name} &lt;${email}&gt;
        </p>
        <p style="color:#E8DCC8;margin-bottom:8px;">
          <strong style="color:#00D4AA;">Tipo:</strong> ${type}
        </p>
        <p style="color:#E8DCC8;margin-bottom:16px;">
          <strong style="color:#00D4AA;">Messaggio:</strong>
        </p>
        <blockquote style="border-left:3px solid #00D4AA;padding-left:16px;color:#8B7355;font-style:italic;">
          ${message.replace(/\n/g, "<br/>")}
        </blockquote>
        <p style="margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL ?? 'https://pyarchinit.org'}/admin/contatti" style="color:#00D4AA;">
            Vedi nel pannello admin →
          </a>
        </p>
      `,
    }).catch(console.error);
  }

  return NextResponse.json(contact);
}

export async function GET() {
  await requireAdmin();
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(contacts);
}
