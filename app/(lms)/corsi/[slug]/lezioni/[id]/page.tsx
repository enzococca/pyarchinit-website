import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ChevronRight } from "lucide-react";

interface PageProps {
  params: { slug: string; id: string };
}

async function markCompleted(lessonId: string, userId: string) {
  "use server";
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });
  redirect(`/dashboard`);
}

export default async function LessonPlayerPage({ params }: PageProps) {
  const session = await requireAuth();
  const userId = (session.user as any).id as string;

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      module: {
        include: {
          course: { select: { id: true, title: true, slug: true } },
          lessons: { orderBy: { order: "asc" }, select: { id: true, order: true } },
        },
      },
    },
  });

  if (!lesson || lesson.module.course.slug !== params.slug) notFound();

  // Check enrollment (skip for free lessons)
  if (!lesson.isFree) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: lesson.module.course.id },
      },
    });
    if (!enrollment) {
      redirect(`/corsi/${params.slug}`);
    }
  }

  // Check if already completed
  const existingProgress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: params.id } },
  });
  const isCompleted = existingProgress?.completed ?? false;

  // Find next lesson in module
  const lessons = lesson.module.lessons;
  const currentIndex = lessons.findIndex((l) => l.id === params.id);
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : undefined;

  const content = lesson.content as Record<string, any>;

  const markCompletedForUser = markCompleted.bind(null, params.id, userId);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-sand/40 mb-6">
        <Link href="/dashboard" className="hover:text-sand transition">
          Dashboard
        </Link>
        <ChevronRight size={12} />
        <Link href={`/corsi/${params.slug}`} className="hover:text-sand transition">
          {lesson.module.course.title}
        </Link>
        <ChevronRight size={12} />
        <span className="text-sand/60">{lesson.module.title}</span>
      </nav>

      {/* Lesson header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-mono font-bold text-sand">{lesson.title}</h1>
        {isCompleted && (
          <span className="flex items-center gap-1.5 text-xs text-teal bg-teal/10 px-2.5 py-1 rounded-full shrink-0">
            <CheckCircle size={13} />
            Completata
          </span>
        )}
      </div>

      {/* Content */}
      <div className="bg-code-bg rounded-card border border-sand/10 overflow-hidden mb-6">
        {lesson.type === "VIDEO" && (
          <div className="aspect-video">
            {content.url ? (
              <iframe
                src={content.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sand/30 text-sm">
                Nessun video disponibile
              </div>
            )}
          </div>
        )}

        {lesson.type === "TEXT" && (
          <div
            className="prose prose-invert prose-sm max-w-none p-6 text-sand/80"
            dangerouslySetInnerHTML={{ __html: content.html ?? content.text ?? "" }}
          />
        )}

        {lesson.type === "QUIZ" && (
          <div className="p-8 text-center text-sand/50">
            <p className="text-lg font-mono mb-2">Quiz interattivo</p>
            <p className="text-sm">Prossimamente disponibile.</p>
          </div>
        )}

        {lesson.type === "EXERCISE" && (
          <div className="p-8 text-center text-sand/50">
            <p className="text-lg font-mono mb-2">Esercizio pratico</p>
            <p className="text-sm">Prossimamente disponibile.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {!isCompleted ? (
          <form action={markCompletedForUser}>
            <button
              type="submit"
              className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition"
            >
              <CheckCircle size={16} />
              Segna come completata
            </button>
          </form>
        ) : (
          <div />
        )}

        {nextLesson && (
          <Link
            href={`/corsi/${params.slug}/lezioni/${nextLesson.id}`}
            className="flex items-center gap-2 bg-sand/10 text-sand px-4 py-2 rounded-card text-sm font-medium hover:bg-sand/20 transition"
          >
            Prossima lezione
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </main>
  );
}
