import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const { status } = await req.json();
  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(contact);
}
