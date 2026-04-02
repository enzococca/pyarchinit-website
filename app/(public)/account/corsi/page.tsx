export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AccountCorsiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/corsi");

  const userId = (session.user as { id?: string }).id!;

  const payments = await prisma.coursePayment.findMany({
    where: { userId, status: "completed" },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          description: true,
          difficulty: true,
          category: true,
          modules: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch progress for each
  const progressData: Record<string, { completed: number; total: number; firstLessonSlug: string | null }> = {};
  for (const payment of payments) {
    const lessonIds = payment.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const total = lessonIds.length;
    let completed = 0;
    if (total > 0) {
      completed = await prisma.interactiveLessonProgress.count({
        where: { userId, lessonId: { in: lessonIds }, completed: true },
      });
    }
    // Find first incomplete lesson
    const firstLesson = await prisma.interactiveLesson.findFirst({
      where: {
        module: { courseId: payment.course.modules[0]?.courseId ?? "" },
      },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
      select: { slug: true },
    });
    progressData[payment.courseSlug] = {
      completed,
      total,
      firstLessonSlug: firstLesson?.slug ?? null,
    };
  }

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

  return (
    <main className="min-h-screen bg-primary py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/account"
            className="text-xs text-sand/30 hover:text-sand/60 transition font-mono"
          >
            ← Account
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <BookOpen size={22} className="text-teal" />
          <div>
            <h1 className="text-2xl font-mono font-bold text-sand">I miei corsi</h1>
            <p className="text-sand/40 text-sm">Tutti i corsi a cui hai accesso</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-code-bg border border-sand/10 rounded-card p-12 text-center">
            <BookOpen size={40} className="mx-auto mb-3 text-sand/20" />
            <p className="text-sand/40 mb-4">Non hai ancora accesso a nessun corso.</p>
            <Link
              href="/impara"
              className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
            >
              Esplora i corsi
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const prog = progressData[payment.courseSlug];
              const pct =
                prog && prog.total > 0
                  ? Math.round((prog.completed / prog.total) * 100)
                  : 0;

              return (
                <div
                  key={payment.id}
                  className="bg-code-bg border border-sand/10 rounded-card p-5 hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            difficultyClass[payment.course.difficulty] ?? "bg-sand/10 text-sand/40"
                          }`}
                        >
                          {difficultyLabel[payment.course.difficulty] ?? payment.course.difficulty}
                        </span>
                        <span className="text-xs text-sand/30 font-mono">{payment.course.category}</span>
                      </div>
                      <h3 className="font-mono font-semibold text-sand">
                        {payment.course.title}
                      </h3>
                      <p className="text-sand/40 text-sm mt-1 line-clamp-2">
                        {payment.course.description}
                      </p>
                    </div>
                    <Link
                      href={prog?.firstLessonSlug ? `/lezione/${prog.firstLessonSlug}` : `/impara/${payment.courseSlug}`}
                      className="shrink-0 flex items-center gap-1.5 bg-teal/10 text-teal hover:bg-teal/20 font-mono text-xs px-3 py-2 rounded-lg transition-colors"
                    >
                      {pct > 0 ? "Continua" : "Inizia"}
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-sand/40">Progresso</span>
                      <span className="text-xs font-mono text-sand/40">
                        {prog ? `${prog.completed}/${prog.total} lezioni` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-sand/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {pct === 100 && (
                      <p className="text-teal text-xs font-mono mt-1">Completato!</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
