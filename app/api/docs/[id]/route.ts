import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const { title, content } = await req.json();

  if (!title && content === undefined) {
    return NextResponse.json({ error: "title o content sono obbligatori" }, { status: 400 });
  }

  // Fetch current page to save a version before updating
  const current = await prisma.docPage.findUnique({
    where: { id: params.id },
  });

  if (!current) {
    return NextResponse.json({ error: "Pagina non trovata" }, { status: 404 });
  }

  // Save current content as a version
  if (current.content) {
    await prisma.docVersion.create({
      data: {
        pageId: params.id,
        content: current.content,
      },
    });
  }

  const page = await prisma.docPage.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
    },
  });

  return NextResponse.json(page);
}
