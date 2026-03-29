export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { AdminImparaClient } from "./client";

export default async function AdminImparaPage() {
  await requireAdmin();

  const courses = await prisma.interactiveCourse.findMany({
    orderBy: { order: "asc" },
    include: {
      modules: {
        include: {
          lessons: { select: { id: true, type: true } },
        },
      },
    },
  });

  const coursesData = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: c.category,
    difficulty: c.difficulty,
    published: c.published,
    createdAt: c.createdAt.toISOString(),
    moduleCount: c.modules.length,
    lessonCount: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    labCount: c.modules.reduce(
      (acc, m) => acc + m.lessons.filter((l) => l.type === "lab").length,
      0
    ),
  }));

  return <AdminImparaClient courses={coursesData} />;
}
