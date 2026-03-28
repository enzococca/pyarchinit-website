import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const userId = (session.user as any).id as string;

  const { lessonId, completed, quizScore } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId è obbligatorio" }, { status: 400 });
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: completed ?? true,
      completedAt: completed !== false ? new Date() : null,
      quizScore: quizScore ?? null,
    },
    update: {
      completed: completed ?? true,
      completedAt: completed !== false ? new Date() : null,
      ...(quizScore !== undefined && { quizScore }),
    },
  });

  return NextResponse.json(progress);
}
