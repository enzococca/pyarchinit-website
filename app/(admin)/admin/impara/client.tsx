"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, RefreshCw, ExternalLink, Eye, EyeOff } from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  published: boolean;
  createdAt: string;
  moduleCount: number;
  lessonCount: number;
  labCount: number;
}

interface AdminImparaClientProps {
  courses: CourseData[];
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

export function AdminImparaClient({ courses: initialCourses }: AdminImparaClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  const handleTogglePublish = async (course: CourseData) => {
    setTogglingId(course.id);
    try {
      const res = await fetch("/api/learn/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: course.id, published: !course.published }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, published: !c.published } : c))
        );
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const res = await fetch("/api/learn/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceDir: "/tmp/course_db" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Errore durante l'importazione");
      } else {
        setImportResult(
          `Importato: "${data.course.title}" — ${data.modules} moduli, ${data.lessons} lezioni`
        );
        router.refresh();
      }
    } catch (e: any) {
      setImportError(e.message ?? "Errore di rete");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookMarked size={22} className="text-teal" />
            <h1 className="text-2xl font-mono font-bold text-sand">Impara</h1>
          </div>
          <p className="text-sand/40 text-sm">Gestione corsi interattivi</p>
        </div>
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-2 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 hover:border-teal/40 font-mono text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={importing ? "animate-spin" : ""} />
          {importing ? "Importando..." : "Importa da /tmp/course_db"}
        </button>
      </div>

      {/* Import feedback */}
      {importResult && (
        <div className="mb-6 bg-teal/10 border border-teal/20 text-teal rounded-lg px-4 py-3 text-sm font-mono">
          ✓ {importResult}
        </div>
      )}
      {importError && (
        <div className="mb-6 bg-terracotta/10 border border-terracotta/20 text-terracotta rounded-lg px-4 py-3 text-sm font-mono">
          ✗ {importError}
        </div>
      )}

      {/* Courses table */}
      {courses.length === 0 ? (
        <div className="text-center py-16 text-sand/30 bg-code-bg rounded-card border border-sand/10">
          <BookMarked size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nessun corso ancora. Usa il pulsante "Importa" per iniziare.</p>
        </div>
      ) : (
        <div className="bg-code-bg border border-sand/10 rounded-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand/10">
                <th className="text-left px-5 py-3 text-xs font-mono text-teal/60 uppercase tracking-widest">
                  Titolo
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-teal/60 uppercase tracking-widest hidden md:table-cell">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-teal/60 uppercase tracking-widest hidden lg:table-cell">
                  Lezioni
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-teal/60 uppercase tracking-widest">
                  Stato
                </th>
                <th className="text-right px-5 py-3 text-xs font-mono text-teal/60 uppercase tracking-widest">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/5">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-sand/3 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-mono text-sand">{course.title}</p>
                      <p className="text-xs text-sand/30 mt-0.5">{course.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        difficultyClass[course.difficulty] ?? "bg-sand/10 text-sand/50"
                      }`}
                    >
                      {course.category} / {difficultyLabel[course.difficulty] ?? course.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-xs text-sand/40 font-mono">
                      {course.moduleCount} moduli · {course.lessonCount} lezioni · {course.labCount} lab
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        course.published
                          ? "bg-teal/10 text-teal"
                          : "bg-sand/10 text-sand/40"
                      }`}
                    >
                      {course.published ? "Pubblicato" : "Bozza"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/impara/${course.slug}`}
                        target="_blank"
                        className="p-1.5 text-sand/30 hover:text-sand transition-colors"
                        title="Visualizza"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(course)}
                        disabled={togglingId === course.id}
                        className={`p-1.5 transition-colors ${
                          course.published
                            ? "text-teal hover:text-teal/60"
                            : "text-sand/30 hover:text-sand"
                        } disabled:opacity-50`}
                        title={course.published ? "Togli dalla pubblicazione" : "Pubblica"}
                      >
                        {course.published ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import instructions */}
      <div className="mt-8 bg-code-bg border border-sand/10 rounded-card p-5">
        <h3 className="font-mono text-sand/60 text-xs uppercase tracking-widest mb-3">
          Istruzioni per l&apos;importazione
        </h3>
        <p className="text-sand/40 text-sm mb-3">
          Per importare il corso "Database e SQL", scarica il materiale dal repository GitHub e
          mettilo in <code className="text-teal font-mono text-xs bg-teal/10 px-1.5 py-0.5 rounded">/tmp/course_db/</code>:
        </p>
        <pre className="bg-primary/50 rounded-lg p-3 text-xs font-mono text-sand/60 overflow-x-auto">{`mkdir -p /tmp/course_db/lezioni /tmp/course_db/laboratori
# Copia i file .md nelle rispettive cartelle
# poi clicca "Importa da /tmp/course_db"`}</pre>
      </div>
    </div>
  );
}
