import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { DocsSidebar, DocsSidebarMobile } from "@/components/public/docs-sidebar";

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

  const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);
  const firstPage = sections[0]?.pages[0];

  return (
    <main>
      {/* Header */}
      <section className="relative bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16 border-b border-sand/10 overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00D4AA 1px, transparent 1px), linear-gradient(90deg, #00D4AA 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={40}
              height={40}
              className="drop-shadow-lg"
            />
            <p className="text-teal font-mono text-xs tracking-widest uppercase">
              Documentazione
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-3">
            Guide &amp; Tutorial
          </h1>
          <p className="text-sand/60 text-base max-w-xl mb-6">
            {totalPages} guide passo-passo per imparare ad usare pyArchInit: dalla configurazione iniziale alla gestione avanzata dei dati di scavo.
          </p>
          {firstPage && (
            <Link
              href={`/docs/${firstPage.slug}`}
              className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
            >
              Inizia dal tutorial 1 <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </section>

      {sections.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-sand/30">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg">La documentazione e in fase di sviluppo.</p>
          </div>
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex gap-10">
            {/* Left sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                <DocsSidebar sections={sections} />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Mobile nav */}
              <div className="lg:hidden mb-6">
                <DocsSidebarMobile sections={sections} />
              </div>

              {/* Tutorial grid */}
              <div className="space-y-8">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h2 className="text-sm font-mono text-teal uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BookOpen size={14} />
                      {section.title}
                      <span className="text-sand/20 font-normal">
                        ({section.pages.length})
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {section.pages.map((page, idx) => (
                        <Link
                          key={page.id}
                          href={`/docs/${page.slug}`}
                          className="group flex items-start gap-3 bg-code-bg border border-sand/8 hover:border-teal/25 rounded-lg p-4 transition-all hover:bg-code-bg/80"
                        >
                          <span className="text-xs font-mono text-ochre/50 mt-0.5 w-6 text-right shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm text-sand/80 group-hover:text-teal transition-colors font-medium leading-snug">
                              {page.title
                                .replace(/^PyArchInit\s*-\s*/i, "")
                                .replace(/^Tutorial\s*\d+:\s*/i, "")}
                            </h3>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-sand/15 group-hover:text-teal/50 transition-colors ml-auto mt-0.5 shrink-0"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick start CTA */}
              <div className="mt-12 bg-gradient-to-r from-teal/5 to-terracotta/5 border border-sand/8 rounded-card p-6 text-center">
                <p className="text-sand/60 text-sm mb-3">
                  Non sai da dove iniziare?
                </p>
                {firstPage && (
                  <Link
                    href={`/docs/${firstPage.slug}`}
                    className="inline-flex items-center gap-2 text-teal font-mono text-sm hover:underline"
                  >
                    <FileText size={14} />
                    Parti dalla Guida alla Configurazione
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
