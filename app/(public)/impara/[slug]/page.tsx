export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FlaskConical, ArrowRight, Database, Code2, Brain } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { LearnSidebar } from "@/components/learn/learn-sidebar";

interface Props {
  params: { slug: string };
}

const categoryIcon: Record<string, React.ReactNode> = {
  database: <Database size={16} />,
  python: <Code2 size={16} />,
  ai: <Brain size={16} />,
};

const difficultyLabel: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzato",
};

const difficultyClass: Record<string, string> = {
  beginner: "bg-teal/10 text-teal",
  intermediate: "bg-ochre/10 text-ochre",
  advanced: "bg-terracotta/10 text-terracotta",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: params.slug },
  });
  if (!course) return {};
  return {
    title: `${course.title} | Impara | pyArchInit`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getSession();
  const userId = session?.user ? (session.user as any).id as string : null;

  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: params.slug, published: true },
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

  if (!course) notFound();

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const totalLessons = lessonIds.length;

  // Get user progress
  let completedIds = new Set<string>();
  if (userId && lessonIds.length > 0) {
    const progress = await prisma.interactiveLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, completed: true },
      select: { lessonId: true },
    });
    completedIds = new Set(progress.map((p) => p.lessonId));
  }

  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // First lesson for "Start" button
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-8 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-mono text-sand/40 mb-3">
            <Link href="/impara" className="hover:text-teal transition-colors">
              Impara
            </Link>
            <span>/</span>
            <span className="text-sand/60">{course.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="flex items-center gap-1.5 text-teal text-xs font-mono">
              {categoryIcon[course.category]}
              {course.category}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                difficultyClass[course.difficulty] ?? "bg-sand/10 text-sand/50"
              }`}
            >
              {difficultyLabel[course.difficulty] ?? course.difficulty}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-sand mb-2">
            {course.title}
          </h1>
          <p className="text-sand/50 text-sm max-w-2xl">{course.description}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          {/* Left sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sand/10">
              <LearnSidebar
                course={course}
                currentLessonSlug={null}
                completedIds={Array.from(completedIds)}
              />
            </div>
          </aside>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            {/* Progress (if logged in) */}
            {userId && (
              <div className="bg-code-bg border border-sand/10 rounded-card p-5 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-sand/60 font-mono">Il tuo progresso</span>
                  <span className="text-teal font-mono text-sm font-bold">
                    {completedCount}/{totalLessons} lezioni
                  </span>
                </div>
                <div className="h-2 bg-sand/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {progressPercent === 100 && (
                  <p className="text-teal text-xs font-mono mt-2">
                    Corso completato!
                  </p>
                )}
              </div>
            )}

            {/* Welcome card */}
            <div className="bg-gradient-to-br from-teal/5 to-code-bg border border-teal/15 rounded-card p-8 mb-8">
              <h2 className="font-mono font-bold text-sand text-xl mb-3">
                Benvenuto nel corso
              </h2>
              <p className="text-sand/60 leading-relaxed mb-6">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-sand/40 font-mono mb-6">
                <span>{course.modules.length} moduli</span>
                <span>{totalLessons} lezioni totali</span>
                <span>
                  {course.modules.reduce(
                    (acc, m) => acc + m.lessons.filter((l) => l.type === "lab").length,
                    0
                  )}{" "}
                  laboratori pratici
                </span>
              </div>
              {firstLesson && (
                <Link
                  href={`/impara/${course.slug}/${firstLesson.slug}`}
                  className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
                >
                  {completedCount > 0 ? "Continua da dove eri rimasto" : "Inizia la prima lezione"}
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {/* Module overview */}
            <div className="space-y-4">
              <h3 className="font-mono text-sand/60 text-xs uppercase tracking-widest">
                Struttura del corso
              </h3>
              {course.modules.map((mod, mi) => (
                <div
                  key={mod.id}
                  className="bg-code-bg border border-sand/10 rounded-card overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-sand/8 flex items-center gap-3">
                    <span className="text-xs font-mono text-teal/50 w-6 text-right">
                      {String(mi + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-mono font-semibold text-sand text-sm">
                      {mod.title}
                    </h4>
                    <span className="ml-auto text-xs text-sand/30">
                      {mod.lessons.length} lezioni
                    </span>
                  </div>
                  <ul className="divide-y divide-sand/5">
                    {mod.lessons.map((lesson) => {
                      const isDone = completedIds.has(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/impara/${course.slug}/${lesson.slug}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-sand/5 transition-colors group"
                          >
                            <span className="shrink-0">
                              {isDone ? (
                                <span className="w-5 h-5 rounded-full bg-teal/20 text-teal flex items-center justify-center text-xs">
                                  ✓
                                </span>
                              ) : lesson.type === "lab" ? (
                                <FlaskConical
                                  size={14}
                                  className="text-ochre/50 group-hover:text-ochre transition-colors"
                                />
                              ) : (
                                <BookOpen
                                  size={14}
                                  className="text-sand/20 group-hover:text-sand/50 transition-colors"
                                />
                              )}
                            </span>
                            <span
                              className={`text-sm flex-1 transition-colors ${
                                isDone
                                  ? "text-teal/70"
                                  : "text-sand/60 group-hover:text-sand"
                              }`}
                            >
                              {lesson.title}
                            </span>
                            {lesson.type === "lab" && (
                              <span className="text-xs text-ochre/50 font-mono bg-ochre/5 px-2 py-0.5 rounded-full">
                                lab
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
