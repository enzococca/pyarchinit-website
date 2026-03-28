import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const courseFilter = searchParams.get("course");

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(courseFilter
        ? { enrollments: { some: { courseId: courseFilter } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      enrollments: {
        select: {
          id: true,
          courseId: true,
          status: true,
          createdAt: true,
          course: { select: { id: true, title: true } },
        },
      },
      lessonProgress: {
        where: { completed: true },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    createdAt: student.createdAt,
    enrollments: student.enrollments,
    completedLessons: student.lessonProgress.length,
  }));

  return NextResponse.json(result);
}


export async function POST(req: NextRequest) {
  await requireAdmin();

  const { userId, courseId } = await req.json();

  if (!userId || !courseId) {
    return NextResponse.json(
      { error: "userId e courseId sono obbligatori" },
      { status: 400 }
    );
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
