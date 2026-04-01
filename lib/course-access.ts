import { prisma } from "@/lib/db";

/**
 * Returns true if the user has access to the given course.
 * Free courses (price === 0) are always accessible.
 * Paid courses require a completed CoursePayment record.
 */
export async function hasCoursePaid(
  userId: string,
  courseSlug: string
): Promise<boolean> {
  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: courseSlug },
    select: { price: true },
  });

  // Course not found or free
  if (!course || course.price === 0) return true;

  const payment = await prisma.coursePayment.findUnique({
    where: { userId_courseSlug: { userId, courseSlug } },
    select: { status: true },
  });

  return payment?.status === "completed";
}
