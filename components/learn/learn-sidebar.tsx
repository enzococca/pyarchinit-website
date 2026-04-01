"use client";

import Link from "next/link";
import { BookOpen, FlaskConical, CheckCircle2, Circle } from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  order: number;
}

interface ModuleItem {
  id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
}

interface CourseItem {
  slug: string;
  title: string;
  modules: ModuleItem[];
}

interface LearnSidebarProps {
  course: CourseItem;
  currentLessonSlug: string | null;
  completedIds: string[];
}

export function LearnSidebar({ course, currentLessonSlug, completedIds }: LearnSidebarProps) {
  const completedSet = new Set(completedIds);

  return (
    <nav className="space-y-5">
      <div className="mb-2">
        <Link
          href={`/impara/${course.slug}`}
          className="text-xs font-mono text-teal/70 hover:text-teal transition-colors uppercase tracking-widest"
        >
          ← {course.title}
        </Link>
      </div>

      {course.modules.map((mod) => (
        <div key={mod.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-teal uppercase tracking-widest">
              {String(mod.order).padStart(2, "0")}. {mod.title}
            </span>
          </div>

          {mod.lessons.length > 0 ? (
            <ul className="space-y-0.5 ml-1 border-l border-sand/10 pl-3">
              {mod.lessons.map((lesson) => {
                const isActive = lesson.slug === currentLessonSlug;
                const isDone = completedSet.has(lesson.id);

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/lezione/${lesson.slug}`}
                      className={`flex items-center gap-2 text-xs py-1.5 pr-2 rounded-r-lg transition-colors ${
                        isActive
                          ? "text-teal font-medium"
                          : "text-sand/50 hover:text-sand"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute -ml-3 w-0.5 h-4 bg-teal rounded-full" />
                      )}
                      <span className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 size={12} className="text-teal/70" />
                        ) : lesson.type === "lab" ? (
                          <FlaskConical
                            size={12}
                            className={isActive ? "text-teal" : "text-ochre/40"}
                          />
                        ) : (
                          <Circle size={12} className="opacity-30" />
                        )}
                      </span>
                      <span className="truncate">{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-sand/20 italic ml-4 pl-3">Nessuna lezione ancora.</p>
          )}
        </div>
      ))}
    </nav>
  );
}
