import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Documentazione | pyArchInit",
  description:
    "Documentazione tecnica di pyArchInit: guide di installazione, API reference, tutorial e molto altro.",
};

export default async function DocsPage() {
  const sections = await prisma.docSection.findMany({
    orderBy: { order: "asc" },
    include: {
      pages: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, slug: true },
      },
    },
  });

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-sm tracking-widest uppercase mb-4">
            Open Source
          </p>
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            Documentazione
          </h1>
          <p className="text-sand/60 text-lg max-w-xl">
            Guide, tutorial e riferimento tecnico completo per pyArchInit.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {sections.length === 0 ? (
          <div className="text-center py-24 text-sand/30">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg">La documentazione è in fase di sviluppo.</p>
            <p className="text-sm mt-2">
              Nel frattempo, consulta il{" "}
              <a
                href="https://github.com/pyarchinit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:text-teal/80 transition-colors"
              >
                repository GitHub
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-code-bg rounded-card border border-sand/10 hover:border-teal/20 transition-colors p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-teal" />
                  </div>
                  <h2 className="font-mono font-bold text-sand">{section.title}</h2>
                </div>

                {section.pages.length > 0 ? (
                  <ul className="space-y-2">
                    {section.pages.map((page) => (
                      <li key={page.id}>
                        <Link
                          href={`/docs/${page.slug}`}
                          className="flex items-center gap-2 text-sm text-sand/60 hover:text-teal transition-colors py-1"
                        >
                          <FileText size={14} className="text-ochre/40 shrink-0" />
                          {page.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-sand/30 italic">Nessuna pagina ancora.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
