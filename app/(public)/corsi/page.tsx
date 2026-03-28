import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { syncFlyoverCourses } from "@/lib/flyover-sync";
import { BookOpen, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Corsi | pyArchInit",
  description: "Corsi di formazione su Python, GIS, QGIS e archeologia digitale.",
};

const CATEGORIES = ["Tutti", "Python", "GIS", "QGIS", "pyArchInit", "Scavo", "Archeologia", "Drone", "Restauro", "Architettura"];

// Throttled sync: at most once per hour per server instance
const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour
let lastSync = 0;

async function maybeSyncCourses() {
  const now = Date.now();
  if (now - lastSync > SYNC_INTERVAL) {
    lastSync = now;
    await syncFlyoverCourses().catch(console.error);
  }
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

interface PageProps {
  searchParams: { cat?: string };
}

export default async function CorsiPage({ searchParams }: PageProps) {
  // Trigger Flyover sync throttled to once per hour
  await maybeSyncCourses();

  const activeCategory = searchParams.cat ?? "Tutti";

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(activeCategory !== "Tutti" && { category: activeCategory }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      modules: {
        include: {
          lessons: { select: { id: true, duration: true } },
        },
      },
    },
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-mono font-bold text-sand mb-3">Corsi</h1>
        <p className="text-sand/50 text-lg">
          Formazione pratica su Python, GIS, QGIS e archeologia digitale.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "Tutti" ? "/corsi" : `/corsi?cat=${cat}`}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              activeCategory === cat
                ? "bg-teal text-primary font-medium"
                : "bg-code-bg text-sand/60 hover:text-sand border border-sand/10 hover:border-sand/20"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 text-sand/30">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nessun corso disponibile in questa categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
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
              <article
                key={course.id}
                className="bg-code-bg rounded-card border border-sand/10 hover:border-teal/30 transition-colors overflow-hidden flex flex-col"
              >
                {course.coverImage ? (
                  <div className="relative aspect-video">
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-primary/50 flex items-center justify-center">
                    <BookOpen size={32} className="text-sand/10" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${levelClass[course.level] ?? "bg-sand/10 text-sand/50"}`}
                    >
                      {levelLabel[course.level] ?? course.level}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sand/5 text-sand/40">
                      {course.category}
                    </span>
                    {course.slug.startsWith("flyover-") && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-ochre/15 text-ochre border border-ochre/20 flex items-center gap-1">
                        <ExternalLink size={10} />
                        Flyover Academy
                      </span>
                    )}
                  </div>
                  <h2 className="font-mono font-bold text-sand text-lg mb-2 leading-snug flex-1">
                    <Link
                      href={`/corsi/${course.slug}`}
                      className="hover:text-teal transition-colors"
                    >
                      {course.title}
                    </Link>
                  </h2>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-sand/10 text-xs text-sand/40">
                    <span>{lessonCount} lezioni</span>
                    {totalMinutes > 0 && (
                      <span>
                        {hours > 0 ? `${hours}h ` : ""}
                        {mins > 0 ? `${mins}min` : ""}
                      </span>
                    )}
                    <span className="ml-auto font-mono text-sand text-sm font-semibold">
                      {course.price === 0
                        ? "Gratuito"
                        : `€${course.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
