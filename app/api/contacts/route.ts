import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const { name, email, type, message } = await req.json();
  const contact = await prisma.contact.create({
    data: { name, email, type, message },
  });
  return NextResponse.json(contact);
}

export async function GET() {
  await requireAdmin();
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(contacts);
}
