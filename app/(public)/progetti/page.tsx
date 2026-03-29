export const dynamic = "force-dynamic";

import Link from "next/link";
import { GitFork, ExternalLink, Boxes, Handshake } from "lucide-react";
import { prisma } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { SectionDivider } from "@/components/public/section-divider";
import type { Metadata } from "next";
import { getServerLocale, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Progetti - pyArchInit",
  description: "Scopri tutti i progetti dell'ecosistema pyArchInit: strumenti open source per l'archeologia digitale.",
};

const statusClass: Record<string, string> = {
  active: "bg-teal/10 text-teal border border-teal/20",
  "in-development": "bg-ochre/10 text-ochre border border-ochre/20",
  archived: "bg-sand/10 text-sand/50 border border-sand/10",
};

// Canonical category order
const CATEGORY_ORDER = [
  "Plugin QGIS",
  "Web App",
  "Pacchetti Python",
  "Pacchetti R",
  "App Mobile",
  "Strumenti",
];

interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  url: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  status: string;
  category: string | null;
}

export default async function ProgettiPage() {
  const locale = await getServerLocale();

  const projects: ProjectRecord[] = await db.project.findMany({
    orderBy: { order: "asc" },
  });

  // Group projects by category
  const grouped: Record<string, ProjectRecord[]> = {};
  const uncategorized: ProjectRecord[] = [];

  for (const project of projects) {
    const cat = project.category?.trim() || "";
    if (!cat) {
      uncategorized.push(project);
    } else {
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(project);
    }
  }

  // Build ordered list of categories to display
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  if (uncategorized.length > 0) {
    orderedCategories.push("__uncategorized__");
    grouped["__uncategorized__"] = uncategorized;
  }

  const hasProjects = projects.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-primary pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 mb-6">
              <Boxes size={32} className="text-teal" />
            </div>
            <h1 className="text-4xl md:text-5xl font-mono text-sand mb-4">
              {t(locale, "progetti.title")}
            </h1>
            <p className="text-sand/60 text-lg max-w-2xl mx-auto">
              {t(locale, "progetti.description")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* Projects grouped by category */}
      <section className="bg-sand py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {!hasProjects ? (
            <ScrollReveal>
              <div className="text-center py-24 text-primary/30">
                <Boxes size={56} className="mx-auto mb-6 opacity-20" />
                <p className="text-xl font-mono">{t(locale, "progetti.empty")}</p>
                <p className="text-sm mt-2">{t(locale, "progetti.empty.desc")}</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-16">
              {orderedCategories.map((cat) => {
                const catProjects = grouped[cat] ?? [];
                const catLabel = cat === "__uncategorized__" ? t(locale, "progetti.other") : cat;
                return (
                  <div key={cat}>
                    <ScrollReveal>
                      <h2 className="text-xl font-mono text-primary mb-8 pb-3 border-b border-primary/10">
                        {catLabel}
                        <span className="ml-3 text-sm font-sans text-primary/30 font-normal">
                          {catProjects.length}{" "}
                          {catProjects.length === 1
                            ? t(locale, "progetti.project")
                            : t(locale, "progetti.projects")}
                        </span>
                      </h2>
                    </ScrollReveal>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catProjects.map((project) => (
                        <ScrollReveal key={project.id}>
                          <div className="bg-white rounded-card shadow-sm border border-primary/5 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            {/* Image */}
                            {project.imageUrl && (
                              <div className="h-48 overflow-hidden bg-primary/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={project.imageUrl}
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-1">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="text-lg font-mono text-primary font-semibold leading-tight">
                                  {project.title}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                                    statusClass[project.status] ?? statusClass["archived"]
                                  }`}
                                >
                                  {t(locale, `progetti.status.${project.status}`) || project.status}
                                </span>
                              </div>

                              <p className="text-primary/60 text-sm leading-relaxed flex-1 mb-4">
                                {project.description}
                              </p>

                              {/* Links */}
                              {(project.url || project.githubUrl) && (
                                <div className="flex items-center gap-3 pt-4 border-t border-primary/5">
                                  {project.url && (
                                    <a
                                      href={project.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-sm text-teal hover:text-teal/80 transition font-medium"
                                    >
                                      <ExternalLink size={14} />
                                      {t(locale, "progetti.website")}
                                    </a>
                                  )}
                                  {project.githubUrl && (
                                    <a
                                      href={project.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-sm text-primary/50 hover:text-primary transition"
                                    >
                                      <GitFork size={14} />
                                      GitHub
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Collaborazioni */}
      <section className="bg-sand py-16 px-4 border-t border-primary/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-8">
              <Handshake size={24} className="text-terracotta" />
              <h2 className="text-xl font-mono text-primary">
                {t(locale, "progetti.collab.title")}
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal>
              <a
                href="https://stratigraph-eccch.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-card shadow-sm border border-primary/5 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-center justify-center shrink-0">
                    <span className="text-terracotta font-mono font-bold text-sm">EU</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-mono text-primary font-semibold group-hover:text-terracotta transition mb-2">
                      StratiGraph
                    </h3>
                    <p className="text-xs font-mono text-terracotta/70 mb-3">
                      Horizon Europe &middot; ECCCH
                    </p>
                    <p className="text-primary/60 text-sm leading-relaxed">
                      {t(locale, "progetti.stratigraph.desc")}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-teal mt-3 group-hover:underline">
                      stratigraph-eccch.eu <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <SectionDivider variant="light-to-dark" />

      {/* CTA */}
      <section className="bg-primary py-20 px-4 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-mono text-teal mb-4">
            {t(locale, "progetti.contribute")}
          </h2>
          <p className="text-sand/50 mb-8 max-w-lg mx-auto">
            {t(locale, "progetti.contribute.desc")}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://github.com/pyarchinit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full hover:bg-teal/90 transition"
            >
              <GitFork size={18} />
              GitHub pyArchInit
            </a>
            <Link
              href="/contatti"
              className="border border-sand/30 text-sand font-mono px-6 py-3 rounded-full hover:border-teal hover:text-teal transition"
            >
              {t(locale, "common.contact_us")}
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
