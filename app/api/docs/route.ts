import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const sections = await prisma.docSection.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: {
        orderBy: { order: "asc" },
        include: {
          pages: { orderBy: { order: "asc" } },
        },
      },
      pages: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(sections);
}


export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { type, title, sectionId } = body;

  if (!title) {
    return NextResponse.json({ error: "title è obbligatorio" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (type === "section") {
    const maxOrder = await prisma.docSection.aggregate({
      _max: { order: true },
      where: { parentId: null },
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    const section = await prisma.docSection.create({
      data: { title, slug: `${slug}-${Date.now()}`, order },
    });
    return NextResponse.json(section, { status: 201 });
  }

  if (type === "page") {
    if (!sectionId) {
      return NextResponse.json({ error: "sectionId è obbligatorio per le pagine" }, { status: 400 });
    }

    const maxOrder = await prisma.docPage.aggregate({
      _max: { order: true },
      where: { sectionId },
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    const page = await prisma.docPage.create({
      data: {
        title,
        slug: `${slug}-${Date.now()}`,
        content: "",
        order,
        sectionId,
      },
    });
    return NextResponse.json(page, { status: 201 });
  }

  return NextResponse.json({ error: "type deve essere 'section' o 'page'" }, { status: 400 });
}
