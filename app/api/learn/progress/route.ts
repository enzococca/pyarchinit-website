import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ progress: [] });
  }

  const { searchParams } = new URL(req.url);
  const courseSlug = searchParams.get("courseSlug");

  const userId = (session.user as any).id as string;

  if (courseSlug) {
    // Get progress for a specific course
    const course = await prisma.interactiveCourse.findUnique({
      where: { slug: courseSlug },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
    });

    if (!course) return NextResponse.json({ progress: [] });

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    const progress = await prisma.interactiveLessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    return NextResponse.json({ progress });
  }

  // All progress
  const progress = await prisma.interactiveLessonProgress.findMany({
    where: { userId },
  });

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const { lessonId, completed, score, answers } = body;

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId obbligatorio" }, { status: 400 });
  }

  const userId = (session.user as any).id as string;

  const progress = await prisma.interactiveLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: completed ?? false,
      score,
      answers,
      completedAt: completed ? new Date() : null,
    },
    update: {
      completed: completed ?? false,
      score,
      answers,
      completedAt: completed ? new Date() : undefined,
    },
  });

  return NextResponse.json(progress);
}
