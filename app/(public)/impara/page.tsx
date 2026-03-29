export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Database, Code2, Brain, ArrowRight, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { getServerLocale, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Impara | pyArchInit",
  description:
    "Percorsi interattivi di apprendimento su database, SQL e archeologia digitale. Lezioni, esercizi pratici e laboratori.",
};

const categoryIcon: Record<string, React.ReactNode> = {
  database: <Database size={18} />,
  python: <Code2 size={18} />,
  ai: <Brain size={18} />,
};

const difficultyClass: Record<string, string> = {
  beginner: "bg-teal/10 text-teal",
  intermediate: "bg-ochre/10 text-ochre",
  advanced: "bg-terracotta/10 text-terracotta",
};

export default async function ImparaPage() {
  const [session, locale] = await Promise.all([getSession(), getServerLocale()]);
  const userId = session?.user ? (session.user as any).id as string : null;

  const courses = await prisma.interactiveCourse.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
  });

  // Get user progress if logged in
  let progressMap: Record<string, { completed: number; total: number }> = {};
  if (userId) {
    for (const course of courses) {
      const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const total = lessonIds.length;
      if (total > 0) {
        const completed = await prisma.interactiveLessonProgress.count({
          where: { userId, lessonId: { in: lessonIds }, completed: true },
        });
        progressMap[course.id] = { completed, total };
      }
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16 border-b border-sand/10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00D4AA 1px, transparent 1px), linear-gradient(90deg, #00D4AA 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-teal" />
            <p className="text-teal font-mono text-xs tracking-widest uppercase">
              {t(locale, "impara.badge")}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-3">
            {t(locale, "impara.title")}
          </h1>
          <p className="text-sand/60 text-base max-w-xl mb-6">
            {t(locale, "impara.subtitle")}
          </p>
          {!userId && (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
            >
              {t(locale, "impara.register_free")} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </section>

      {/* Course grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {courses.length === 0 ? (
          <div className="text-center py-24 text-sand/30">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t(locale, "impara.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const moduleCount = course.modules.length;
              const lessonCount = course.modules.reduce(
                (acc, m) => acc + m.lessons.length,
                0
              );
              const prog = progressMap[course.id];
              const progressPercent = prog
                ? Math.round((prog.completed / prog.total) * 100)
                : 0;

              return (
                <article
                  key={course.id}
                  className="bg-code-bg rounded-card border border-sand/10 hover:border-teal/30 transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Course image / placeholder */}
                  <div className="aspect-video bg-primary/50 flex items-center justify-center relative overflow-hidden">
                    {course.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-sand/10">
                        <div className="text-teal/20 scale-150">
                          {categoryIcon[course.category] ?? <BookOpen size={32} />}
                        </div>
                      </div>
                    )}
                    {/* Category badge overlay */}
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1.5 bg-primary/80 backdrop-blur-sm text-teal text-xs font-mono px-2.5 py-1 rounded-full border border-teal/20">
                        {categoryIcon[course.category]}
                        {t(locale, `impara.category.${course.category}`) || course.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Difficulty badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          difficultyClass[course.difficulty] ?? "bg-sand/10 text-sand/50"
                        }`}
                      >
                        {t(locale, `impara.difficulty.${course.difficulty}`) || course.difficulty}
                      </span>
                    </div>

                    <h2 className="font-mono font-bold text-sand text-lg mb-2 leading-snug">
                      {course.title}
                    </h2>
                    <p className="text-sand/50 text-sm leading-relaxed flex-1 mb-4">
                      {course.description.slice(0, 120)}
                      {course.description.length > 120 ? "…" : ""}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-sand/40 mb-4">
                      <span>{moduleCount} {t(locale, "impara.modules")}</span>
                      <span className="text-sand/20">·</span>
                      <span>{lessonCount} {t(locale, "impara.lessons")}</span>
                    </div>

                    {/* Progress bar (logged in only) */}
                    {prog && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-sand/40 mb-1">
                          <span>{t(locale, "impara.progress")}</span>
                          <span className="text-teal font-mono">{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-sand/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/impara/${course.slug}`}
                      className="mt-auto w-full text-center bg-teal/10 hover:bg-teal/20 text-teal font-mono text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-teal/20 hover:border-teal/40 flex items-center justify-center gap-2"
                    >
                      {prog && progressPercent > 0
                        ? t(locale, "impara.continue")
                        : t(locale, "impara.start")}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-12 bg-gradient-to-r from-teal/5 to-terracotta/5 border border-sand/8 rounded-card p-8 text-center">
          <p className="text-sand/40 text-sm font-mono mb-2">
            {t(locale, "impara.coming_soon")}
          </p>
          <p className="text-sand/60 text-sm">
            {t(locale, "impara.coming_soon.desc")}
          </p>
        </div>
      </section>
    </main>
  );
}
