export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogOut, BookOpen, User, Calendar, Tag } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const userId = (session.user as { id?: string }).id!;

  const [user, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    prisma.coursePayment.findMany({
      where: { userId, status: "completed" },
      include: {
        course: {
          select: { title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  // Fetch progress for each course
  const courseProgressMap: Record<string, { completed: number; total: number }> = {};
  for (const payment of payments) {
    const courseSlug = payment.courseSlug;
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
    if (!course) continue;
    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const total = lessonIds.length;
    let completed = 0;
    if (total > 0) {
      completed = await prisma.interactiveLessonProgress.count({
        where: { userId, lessonId: { in: lessonIds }, completed: true },
      });
    }
    courseProgressMap[courseSlug] = { completed, total };
  }

  return (
    <main className="min-h-screen bg-primary py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-mono font-bold text-sand">Il mio account</h1>
            <p className="text-sand/40 text-sm mt-1">Gestisci il tuo profilo e i tuoi corsi</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-sand/50 border border-sand/15 rounded-card hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </form>
        </div>

        {/* Profile card */}
        <div className="bg-code-bg border border-sand/10 rounded-card p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold font-mono">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-mono font-bold text-sand text-lg">{user.name || "—"}</h2>
              <p className="text-sand/50 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-sand/10">
            <div className="flex items-center gap-2 text-xs text-sand/40">
              <User size={13} />
              <span>
                Ruolo:{" "}
                <span className="text-sand/60 font-mono">
                  {user.role === "ADMIN" ? "Amministratore" : "Studente"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-sand/40">
              <Calendar size={13} />
              <span>
                Iscritto il:{" "}
                <span className="text-sand/60">
                  {new Date(user.createdAt).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-code-bg border border-sand/10 rounded-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono font-semibold text-sand flex items-center gap-2">
              <BookOpen size={16} className="text-teal" />
              I miei corsi ({payments.length})
            </h3>
            <Link
              href="/account/corsi"
              className="text-xs text-teal hover:text-teal/80 transition font-mono"
            >
              Vedi tutti →
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-sand/30">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nessun corso attivo</p>
              <Link
                href="/impara"
                className="inline-block mt-3 text-teal text-xs hover:text-teal/80 transition"
              >
                Esplora i corsi →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.slice(0, 3).map((payment) => {
                const prog = courseProgressMap[payment.courseSlug];
                const pct =
                  prog && prog.total > 0
                    ? Math.round((prog.completed / prog.total) * 100)
                    : 0;
                return (
                  <div key={payment.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Link
                        href={`/impara/${payment.courseSlug}`}
                        className="text-sm font-mono text-sand/80 hover:text-teal transition-colors"
                      >
                        {payment.course.title}
                      </Link>
                      <span className="text-xs font-mono text-sand/40">
                        {prog ? `${prog.completed}/${prog.total}` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-sand/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Code activation */}
        <div className="bg-code-bg border border-sand/10 rounded-card p-6">
          <h3 className="font-mono font-semibold text-sand flex items-center gap-2 mb-3">
            <Tag size={16} className="text-ochre" />
            Attiva un codice corso
          </h3>
          <p className="text-sand/40 text-sm mb-4">
            Hai ricevuto un codice di accesso? Inseriscilo qui per sbloccare il corso.
          </p>
          <Link
            href="/impara"
            className="text-xs text-teal hover:text-teal/80 transition font-mono"
          >
            Vai ai corsi per attivare un codice →
          </Link>
        </div>
      </div>
    </main>
  );
}
