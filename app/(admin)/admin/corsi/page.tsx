"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Users } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  slug: string;
  level: "BASE" | "INTERMEDIO" | "AVANZATO";
  category: string;
  status: "DRAFT" | "PUBLISHED";
  price: number;
  _count: { enrollments: number };
}

const levelLabel: Record<Course["level"], string> = {
  BASE: "Base",
  INTERMEDIO: "Intermedio",
  AVANZATO: "Avanzato",
};

const levelClass: Record<Course["level"], string> = {
  BASE: "bg-teal/10 text-teal",
  INTERMEDIO: "bg-ochre/10 text-ochre",
  AVANZATO: "bg-terracotta/10 text-terracotta",
};

export default function AdminCorsiPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [creating, setCreating] = useState(false);

  const loadCourses = useCallback(async () => {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const createCourse = async () => {
    const title = prompt("Titolo del corso:");
    if (!title) return;

    setCreating(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      const course = await res.json();
      router.push(`/admin/corsi/${course.id}`);
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Corsi</h1>
        <button
          onClick={createCourse}
          disabled={creating}
          className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creazione..." : "Nuovo corso"}
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun corso ancora. Crea il primo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-4 bg-code-bg rounded-card px-4 py-3 border border-ochre/10 hover:border-ochre/20 transition"
            >
              <BookOpen size={16} className="text-ochre/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/corsi/${course.id}`}
                  className="text-sand hover:text-teal transition text-sm font-medium"
                >
                  {course.title}
                </Link>
                <p className="text-xs text-sand/40 truncate">/corsi/{course.slug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${levelClass[course.level]}`}
              >
                {levelLabel[course.level]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sand/5 text-sand/50 shrink-0">
                {course.category}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  course.status === "PUBLISHED"
                    ? "bg-teal/10 text-teal"
                    : "bg-ochre/10 text-ochre"
                }`}
              >
                {course.status === "PUBLISHED" ? "Pubblicato" : "Bozza"}
              </span>
              <span className="flex items-center gap-1 text-xs text-sand/40 shrink-0">
                <Users size={12} />
                {course._count.enrollments}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
