import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { BookOpen, Clock, Video, FileText, HelpCircle, Code2, type LucideIcon } from "lucide-react";
import { CourseEnrollButton } from "./enroll-button";

interface PageProps {
  params: { slug: string };
}

const levelLabel: Record<string, string> = {
  BASE: "Base",
  INTERMEDIO: "Intermedio",
  AVANZATO: "Avanzato",
};

const levelClass: Record<string, string> = {
  BASE: "bg-teal/10 text-teal",
  INTERMEDIO: "bg-ochre/10 text-ochre",
  AVANZATO: "bg-terracotta/10 text-terracotta",
};

const lessonTypeIcon: Record<string, LucideIcon> = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  EXERCISE: Code2,
};

const lessonTypeLabel: Record<string, string> = {
  VIDEO: "Video",
  TEXT: "Testo",
  QUIZ: "Quiz",
  EXERCISE: "Esercizio",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true },
  });
  if (!course) return {};
  return {
    title: `${course.title} | pyArchInit`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  const lessonCount = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const totalMinutes = course.modules.reduce(
    (acc, m) =>
      acc + m.lessons.reduce((a, l) => a + (l.duration ?? 0), 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero */}
          {course.coverImage ? (
            <div className="relative aspect-video rounded-card overflow-hidden mb-8">
              <Image
                src={course.coverImage}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>
          ) : (
            <div className="aspect-video bg-code-bg rounded-card flex items-center justify-center mb-8 border border-sand/10">
              <BookOpen size={48} className="text-sand/10" />
            </div>
          )}

          {/* Title & badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${levelClass[course.level] ?? "bg-sand/10 text-sand/50"}`}
            >
              {levelLabel[course.level] ?? course.level}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sand/5 text-sand/40 border border-sand/10">
              {course.category}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-4">
            {course.title}
          </h1>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-sand/50 mb-8">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} />
              {lessonCount} lezioni
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {hours > 0 ? `${hours}h ` : ""}
                {mins > 0 ? `${mins}min` : ""}
              </span>
            )}
          </div>

          {/* Description */}
          {course.description && (
            <div className="mb-10">
              <h2 className="text-lg font-mono font-semibold text-sand mb-3">
                Descrizione
              </h2>
              <p className="text-sand/70 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          )}

          {/* Programma */}
          {course.modules.length > 0 && (
            <div>
              <h2 className="text-lg font-mono font-semibold text-sand mb-4">
                Programma
              </h2>
              <div className="space-y-3">
                {course.modules.map((mod, mi) => (
                  <details
                    key={mod.id}
                    className="bg-code-bg rounded-card border border-sand/10 overflow-hidden group"
                    open={mi === 0}
                  >
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition list-none">
                      <span className="font-medium text-sand text-sm">
                        <span className="text-sand/30 font-mono text-xs mr-2">
                          {String(mi + 1).padStart(2, "0")}
                        </span>
                        {mod.title || "Modulo senza titolo"}
                      </span>
                      <span className="text-xs text-sand/30">
                        {mod.lessons.length} lezioni
                      </span>
                    </summary>
                    <ul className="border-t border-sand/10 divide-y divide-sand/5">
                      {mod.lessons.map((lesson, li) => {
                        const Icon = lessonTypeIcon[lesson.type] ?? BookOpen;
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm"
                          >
                            <span className="text-sand/30 font-mono text-xs w-5 shrink-0">
                              {String(li + 1).padStart(2, "0")}
                            </span>
                            <Icon size={13} className="text-sand/30 shrink-0" />
                            <span className="text-sand/70 flex-1">
                              {lesson.title || "Lezione senza titolo"}
                            </span>
                            <span className="text-xs text-sand/30">
                              {lessonTypeLabel[lesson.type]}
                            </span>
                            {lesson.duration && lesson.duration > 0 && (
                              <span className="text-xs text-sand/30">
                                {lesson.duration}min
                              </span>
                            )}
                            {lesson.isFree && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-teal/10 text-teal">
                                Free
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-code-bg rounded-card border border-sand/10 p-6">
            <div className="text-3xl font-mono font-bold text-sand mb-6">
              {course.price === 0
                ? "Gratuito"
                : `€${course.price.toFixed(2)}`}
            </div>
            <CourseEnrollButton courseId={course.id} price={course.price} />
            <ul className="mt-6 space-y-2 text-sm text-sand/50">
              <li className="flex items-center gap-2">
                <BookOpen size={14} />
                {lessonCount} lezioni
              </li>
              {totalMinutes > 0 && (
                <li className="flex items-center gap-2">
                  <Clock size={14} />
                  {hours > 0 ? `${hours}h ` : ""}
                  {mins > 0 ? `${mins}min` : ""}
                </li>
              )}
              <li className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${levelClass[course.level] ?? ""}`}
                >
                  {levelLabel[course.level] ?? course.level}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
