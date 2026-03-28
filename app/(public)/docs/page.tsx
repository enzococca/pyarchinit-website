import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
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

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-xs tracking-widest uppercase mb-3">
            Open Source
          </p>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-3">
            Documentazione
          </h1>
          <p className="text-sand/60 text-base max-w-xl">
            Guide, tutorial e riferimento tecnico completo per pyArchInit.
          </p>
        </div>
      </section>

      {sections.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-sand/30">
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
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-10">
            {/* Left sidebar — hidden on mobile */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sand/10">
                <DocsSidebar sections={sections} />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Mobile nav */}
              <div className="lg:hidden mb-6">
                <DocsSidebarMobile sections={sections} />
              </div>

              {/* Welcome panel */}
              <div className="bg-code-bg rounded-card border border-sand/10 p-8 sm:p-12">
                <div className="max-w-2xl">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-6">
                    <BookOpen size={24} className="text-teal" />
                  </div>
                  <h2 className="text-2xl font-mono font-bold text-sand mb-4">
                    Benvenuto nella documentazione
                  </h2>
                  <p className="text-sand/60 mb-6 leading-relaxed">
                    Questa documentazione copre tutto ciò che devi sapere su
                    pyArchInit: dall&apos;installazione alle guide avanzate,
                    passando per tutorial passo-passo.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    <div className="bg-primary/50 rounded-lg p-3 border border-sand/10">
                      <p className="text-2xl font-mono font-bold text-teal">
                        {sections.length}
                      </p>
                      <p className="text-xs text-sand/50 mt-1">Sezioni</p>
                    </div>
                    <div className="bg-primary/50 rounded-lg p-3 border border-sand/10">
                      <p className="text-2xl font-mono font-bold text-teal">
                        {totalPages}
                      </p>
                      <p className="text-xs text-sand/50 mt-1">Pagine</p>
                    </div>
                  </div>

                  <p className="text-sm text-sand/40 mb-4">
                    Sezioni disponibili:
                  </p>
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <h3 className="text-xs font-mono text-teal uppercase tracking-widest mb-2">
                          {section.title}
                        </h3>
                        {section.pages.length > 0 ? (
                          <ul className="space-y-1 ml-3 border-l border-sand/10 pl-3">
                            {section.pages.map((page) => (
                              <li key={page.id}>
                                <a
                                  href={`/docs/${page.slug}`}
                                  className="text-sm text-sand/50 hover:text-teal transition-colors"
                                >
                                  {page.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-sand/20 italic ml-3 pl-3">
                            Nessuna pagina ancora.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
