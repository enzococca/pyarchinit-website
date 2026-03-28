import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { DocsSidebar, DocsSidebarMobile } from "@/components/public/docs-sidebar";
import { DocsToc } from "@/components/public/docs-toc";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface Props {
  params: { slug: string };
}

/** Slugify a heading text to create a valid HTML id */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Parse h2/h3 tags in HTML content:
 * - extract TOC items
 * - inject id attributes into the heading tags
 */
function processContent(html: string): { content: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const idCount: Record<string, number> = {};

  const content = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const level = parseInt(tag[1]) as 2 | 3;
      // Strip any tags inside the heading to get plain text
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const baseId = slugifyHeading(text) || `heading-${toc.length}`;
      // Handle duplicates
      const count = idCount[baseId] ?? 0;
      idCount[baseId] = count + 1;
      const id = count === 0 ? baseId : `${baseId}-${count}`;

      toc.push({ id, text, level });

      // Remove any existing id attr and inject ours
      const cleanAttrs = attrs.replace(/\s*id="[^"]*"/gi, "");
      return `<${tag}${cleanAttrs} id="${id}">${inner}</${tag}>`;
    }
  );

  return { content, toc };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.docPage.findUnique({
    where: { slug: params.slug },
    include: { section: true },
  });
  if (!page) return {};
  return {
    title: `${page.title} | Documentazione | pyArchInit`,
    description: `${page.section.title} — ${page.title}`,
  };
}

export default async function DocPageDetail({ params }: Props) {
  const page = await prisma.docPage.findUnique({
    where: { slug: params.slug },
    include: { section: true },
  });

  if (!page) notFound();

  // Load all sections for the sidebar and for prev/next
  const sections = await prisma.docSection.findMany({
    orderBy: { order: "asc" },
    include: {
      pages: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, slug: true },
      },
    },
  });

  // Build flat ordered list of all pages
  const allPages = sections.flatMap((s) => s.pages);
  const currentIndex = allPages.findIndex((p) => p.slug === params.slug);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  // Process content: add IDs to headings and extract TOC
  const { content: processedContent, toc } = processContent(page.content);

  return (
    <main>
      {/* Top banner */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-8 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-mono text-teal/60 uppercase tracking-widest mb-1">
            {page.section.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-sand">
            {page.title}
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          {/* Left sidebar — hidden on mobile */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sand/10">
              <DocsSidebar sections={sections} currentSlug={params.slug} />
            </div>
          </aside>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            {/* Mobile sidebar nav */}
            <div className="lg:hidden mb-6">
              <DocsSidebarMobile
                sections={sections}
                currentSlug={params.slug}
                currentTitle={page.title}
              />
            </div>

            {/* Prose content */}
            <article
              className="prose prose-invert max-w-none prose-headings:font-mono prose-headings:text-teal prose-p:text-sand/80 prose-a:text-teal prose-a:no-underline hover:prose-a:underline prose-strong:text-sand prose-code:text-teal prose-pre:bg-code-bg prose-li:text-sand/70 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Updated + GitHub */}
            <div className="mt-12 pt-6 border-t border-sand/10 flex items-center justify-between text-xs text-sand/30">
              <span>
                Aggiornato il{" "}
                {new Date(page.updatedAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <a
                href="https://github.com/pyarchinit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sand transition-colors"
              >
                Modifica su GitHub
              </a>
            </div>

            {/* Prev / Next navigation */}
            {(prevPage || nextPage) && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPage ? (
                  <Link
                    href={`/docs/${prevPage.slug}`}
                    className="flex items-center gap-3 bg-code-bg border border-sand/10 hover:border-teal/30 rounded-card px-4 py-3 transition-colors group"
                  >
                    <ArrowLeft
                      size={16}
                      className="text-sand/40 group-hover:text-teal transition-colors shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-sand/30 mb-0.5">Precedente</p>
                      <p className="text-sm text-sand/70 group-hover:text-sand transition-colors truncate">
                        {prevPage.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextPage && (
                  <Link
                    href={`/docs/${nextPage.slug}`}
                    className="flex items-center justify-end gap-3 bg-code-bg border border-sand/10 hover:border-teal/30 rounded-card px-4 py-3 transition-colors group sm:col-start-2"
                  >
                    <div className="min-w-0 text-right">
                      <p className="text-xs text-sand/30 mb-0.5">Successivo</p>
                      <p className="text-sm text-sand/70 group-hover:text-sand transition-colors truncate">
                        {nextPage.title}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-sand/40 group-hover:text-teal transition-colors shrink-0"
                    />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right TOC sidebar — hidden on mobile and tablet */}
          <aside className="hidden xl:block w-52 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <DocsToc items={toc} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
