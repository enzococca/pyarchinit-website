import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const { subject, content } = await req.json();

  const campaign = await prisma.newsletterCampaign.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(content !== undefined && { content }),
    },
  });

  return NextResponse.json(campaign);
}
