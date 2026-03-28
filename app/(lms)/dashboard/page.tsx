import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getCourseProgress } from "@/lib/lms";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = (session.user as any).id as string;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { select: { id: true }, orderBy: { order: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await getCourseProgress(userId, enrollment.courseId);
      // Find first lesson of first module
      const firstLesson = enrollment.course.modules[0]?.lessons[0];
      return { enrollment, progress, firstLesson };
    })
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-bold text-sand">La mia area di apprendimento</h1>
        <p className="text-sand/50 mt-1">
          Benvenuto, {session.user?.name ?? session.user?.email}
        </p>
      </div>

      {enrollmentsWithProgress.length === 0 ? (
        <div className="text-center py-20 text-sand/40">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="mb-4">Non sei iscritto a nessun corso.</p>
          <Link
            href="/corsi"
            className="inline-flex items-center px-4 py-2 rounded-card text-sm font-medium bg-teal text-primary hover:bg-teal/90 transition"
          >
            Scopri i corsi
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollmentsWithProgress.map(({ enrollment, progress, firstLesson }) => {
            const course = enrollment.course;
            const href = firstLesson
              ? `/corsi/${course.slug}/lezioni/${firstLesson.id}`
              : `/corsi/${course.slug}`;

            return (
              <Link
                key={enrollment.id}
                href={href}
                className="group bg-code-bg rounded-card border border-sand/10 overflow-hidden hover:border-teal/30 transition"
              >
                {/* Cover image */}
                <div className="relative aspect-video bg-primary/50">
                  {course.coverImage ? (
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={32} className="text-sand/10" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="text-sm font-medium text-sand group-hover:text-teal transition mb-3 line-clamp-2">
                    {course.title}
                  </h2>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="h-1.5 bg-sand/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-sand/40">
                    {progress.completed}/{progress.total} lezioni &mdash; {progress.percentage}%
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
