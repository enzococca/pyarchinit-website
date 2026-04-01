import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const courses = await prisma.interactiveCourse.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, slug: true, type: true, order: true },
          },
        },
      },
    },
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { title, slug, description, category, difficulty, imageUrl } = body;

  if (!title || !slug || !description || !category) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const course = await prisma.interactiveCourse.create({
    data: {
      title,
      slug,
      description,
      category,
      difficulty: difficulty ?? "beginner",
      imageUrl,
    },
  });

  return NextResponse.json(course, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { id, published, price } = body;

  if (!id) {
    return NextResponse.json({ error: "id obbligatorio" }, { status: 400 });
  }

  const updateData: { published?: boolean; price?: number } = {};
  if (published !== undefined) updateData.published = published;
  if (price !== undefined) updateData.price = Math.max(0, Number(price));

  const course = await prisma.interactiveCourse.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(course);
}
