import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  await requireAdmin();

  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const { subject, content } = await req.json();
  if (!subject) {
    return NextResponse.json({ error: "Oggetto richiesto" }, { status: 400 });
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: { subject, content: content ?? "" },
  });

  return NextResponse.json(campaign, { status: 201 });
}
