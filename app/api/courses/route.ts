import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { title } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "title è obbligatorio" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description: "",
      price: 0,
      level: "BASE",
      category: "Python",
      status: "DRAFT",
    },
  });

  return NextResponse.json(course, { status: 201 });
}
