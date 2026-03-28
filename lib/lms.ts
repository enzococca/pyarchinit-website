import { prisma } from "./db";

export async function getCourseProgress(userId: string, courseId: string) {
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });
  if (totalLessons === 0) return { percentage: 0, completed: 0, total: 0 };

  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true, lesson: { module: { courseId } } },
  });

  return {
    percentage: Math.round((completedLessons / totalLessons) * 100),
    completed: completedLessons,
    total: totalLessons,
  };
}
