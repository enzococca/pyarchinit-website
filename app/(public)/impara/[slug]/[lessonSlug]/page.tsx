export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { LearnSidebar } from "@/components/learn/learn-sidebar";
import { InteractiveContent } from "@/components/learn/interactive-content";
import { LessonProgressButton } from "@/components/learn/lesson-progress-button";
import { hasCoursePaid } from "@/lib/course-access";

interface Props {
  params: { slug: string; lessonSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = await prisma.interactiveLesson.findUnique({
    where: { slug: params.lessonSlug },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return {};
  return {
    title: `${lesson.title} | ${lesson.module.course.title} | pyArchInit`,
    description: `Lezione interattiva: ${lesson.title}`,
  };
}

export default async function LessonPage({ params }: Props) {
  const session = await getSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;

  // Load lesson with module and course
  const lesson = await prisma.interactiveLesson.findUnique({
    where: { slug: params.lessonSlug },
    include: {
      module: {
        include: {
          course: {
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
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.course.slug !== params.slug) notFound();
  if (!lesson.module.course.published) notFound();

  const course = lesson.module.course;

  // Access check — redirect to course page with paywall if no access
  const isPaid = course.price > 0;
  if (isPaid) {
    if (!userId) {
      redirect(`/impara/${course.slug}`);
    }
    const access = await hasCoursePaid(userId, course.slug);
    if (!access) {
      redirect(`/impara/${course.slug}`);
    }
  }

  // Build flat lesson list for prev/next
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.slug === params.lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // User progress
  const lessonIds = allLessons.map((l) => l.id);
  let completedIds = new Set<string>();
  let isCurrentCompleted = false;

  if (userId && lessonIds.length > 0) {
    const progress = await prisma.interactiveLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, completed: true },
      select: { lessonId: true },
    });
    completedIds = new Set(progress.map((p) => p.lessonId));
    isCurrentCompleted = completedIds.has(lesson.id);
  }

  return (
    <main>
      {/* Top breadcrumb */}
      <div className="bg-primary/50 border-b border-sand/10 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-mono text-sand/40">
          <Link href="/impara" className="hover:text-teal transition-colors">
            Impara
          </Link>
          <span>/</span>
          <Link href={`/impara/${course.slug}`} className="hover:text-teal transition-colors">
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-sand/60 truncate max-w-xs">{lesson.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Left sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sand/10">
              <LearnSidebar
                course={course}
                currentLessonSlug={params.lessonSlug}
                completedIds={Array.from(completedIds)}
              />
            </div>
          </aside>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            {/* Lesson header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                {lesson.type === "lab" && (
                  <span className="text-xs text-ochre font-mono bg-ochre/10 px-2 py-0.5 rounded-full">
                    Laboratorio
                  </span>
                )}
                {lesson.type === "lesson" && (
                  <span className="text-xs text-teal font-mono bg-teal/10 px-2 py-0.5 rounded-full">
                    Lezione
                  </span>
                )}
                <span className="text-xs text-sand/30 font-mono">
                  {currentIndex + 1} / {allLessons.length}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-sand">
                {lesson.title}
              </h1>
            </div>

            {/* Interactive content */}
            <InteractiveContent html={lesson.content} />

            {/* Progress + navigation */}
            <div className="mt-12 pt-6 border-t border-sand/10 space-y-6">
              {/* Mark complete button */}
              <LessonProgressButton
                lessonId={lesson.id}
                isCompleted={isCurrentCompleted}
                isLoggedIn={!!userId}
              />

              {/* Prev / Next */}
              {(prevLesson || nextLesson) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prevLesson ? (
                    <Link
                      href={`/impara/${course.slug}/${prevLesson.slug}`}
                      className="flex items-center gap-3 bg-code-bg border border-sand/10 hover:border-teal/30 rounded-card px-4 py-3 transition-colors group"
                    >
                      <ArrowLeft
                        size={16}
                        className="text-sand/40 group-hover:text-teal transition-colors shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-sand/30 mb-0.5">Precedente</p>
                        <p className="text-sm text-sand/70 group-hover:text-sand transition-colors truncate">
                          {prevLesson.title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextLesson && (
                    <Link
                      href={`/impara/${course.slug}/${nextLesson.slug}`}
                      className="flex items-center justify-end gap-3 bg-code-bg border border-sand/10 hover:border-teal/30 rounded-card px-4 py-3 transition-colors group sm:col-start-2"
                    >
                      <div className="min-w-0 text-right">
                        <p className="text-xs text-sand/30 mb-0.5">Successivo</p>
                        <p className="text-sm text-sand/70 group-hover:text-sand transition-colors truncate">
                          {nextLesson.title}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-sand/40 group-hover:text-teal transition-colors shrink-0"
                      />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
