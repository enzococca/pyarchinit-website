import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await requireAdmin();

  const { campaignId } = await req.json();
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId richiesto" }, { status: 400 });
  }

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 });
  }

  if (campaign.status === "SENT") {
    return NextResponse.json({ error: "Campagna già inviata" }, { status: 400 });
  }

  // Mark as sending
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true, unsubscribedAt: null },
  });

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";

  let sent = 0;
  for (const subscriber of subscribers) {
    try {
      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
      await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html: `
          ${campaign.content}
          <hr style="border:none;border-top:1px solid #2A2E3E;margin:32px 0;" />
          <p style="color:#8B7355;font-size:11px;text-align:center;">
            Hai ricevuto questa email perché sei iscritto alla newsletter di pyArchInit.<br/>
            <a href="${unsubscribeUrl}" style="color:#8B7355;">Disiscriviti</a>
          </p>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${subscriber.email}:`, err);
    }
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { status: "SENT", sentAt: new Date() },
  });

  return NextResponse.json({ sent, total: subscribers.length });
}
