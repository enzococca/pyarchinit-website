import Link from "next/link";
import { BookOpen, FileText, ChevronDown } from "lucide-react";

interface DocPage {
  id: string;
  title: string;
  slug: string;
}

interface DocSection {
  id: string;
  title: string;
  pages: DocPage[];
}

interface DocsSidebarProps {
  sections: DocSection[];
  currentSlug?: string;
}

export function DocsSidebar({ sections, currentSlug }: DocsSidebarProps) {
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={13} className="text-teal/60 shrink-0" />
            <h3 className="text-xs font-mono text-teal uppercase tracking-widest">
              {section.title}
            </h3>
          </div>
          {section.pages.length > 0 ? (
            <ul className="space-y-0.5 ml-4 border-l border-sand/10 pl-3">
              {section.pages.map((page) => {
                const isActive = page.slug === currentSlug;
                return (
                  <li key={page.id}>
                    <Link
                      href={`/docs/${page.slug}`}
                      className={`flex items-center gap-2 text-sm py-1.5 transition-colors rounded-r-lg pr-2 ${
                        isActive
                          ? "text-teal font-medium"
                          : "text-sand/50 hover:text-sand"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute -ml-3 w-0.5 h-5 bg-teal rounded-full" />
                      )}
                      <FileText size={12} className="shrink-0 opacity-60" />
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-sand/20 italic ml-4 pl-3">
              Nessuna pagina ancora.
            </p>
          )}
        </div>
      ))}
    </nav>
  );
}

// Mobile dropdown version
interface DocsSidebarMobileProps extends DocsSidebarProps {
  currentTitle?: string;
}

export function DocsSidebarMobile({
  sections,
  currentSlug,
  currentTitle,
}: DocsSidebarMobileProps) {
  return (
    <details className="group bg-code-bg border border-sand/10 rounded-card">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none text-sm text-sand/70 hover:text-sand transition-colors">
        <span className="flex items-center gap-2">
          <BookOpen size={15} className="text-teal" />
          {currentTitle ?? "Documentazione"}
        </span>
        <ChevronDown
          size={16}
          className="transition-transform group-open:rotate-180 text-sand/40"
        />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-sand/10">
        <DocsSidebar sections={sections} currentSlug={currentSlug} />
      </div>
    </details>
  );
}
