import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { Locale, t } from "@/lib/i18n";

interface CmsPage {
  slug: string;
  title: string;
}

interface FooterProps {
  cmsPages?: CmsPage[];
  locale?: Locale;
}

export function Footer({ cmsPages = [], locale = "it" }: FooterProps) {
  const staticColumns = [
    {
      title: t(locale, "footer.nav"),
      links: [
        { href: "/", label: t(locale, "footer.nav.home") },
        { href: "/servizi", label: t(locale, "footer.nav.servizi") },
        { href: "/community", label: t(locale, "footer.nav.community") },
        { href: "/contatti", label: t(locale, "footer.nav.contatti") },
      ],
    },
    {
      title: t(locale, "footer.corsi"),
      links: [
        { href: "/corsi", label: t(locale, "footer.corsi.tutti") },
        { href: "/corsi#base", label: t(locale, "footer.corsi.base") },
        { href: "/corsi#avanzato", label: t(locale, "footer.corsi.avanzato") },
        { href: "/corsi#certificazioni", label: t(locale, "footer.corsi.certificazioni") },
      ],
    },
    {
      title: t(locale, "footer.community"),
      links: [
        { href: "https://github.com/pyarchinit", label: t(locale, "footer.community.github"), external: true },
        { href: "/docs", label: t(locale, "footer.community.docs") },
        { href: "/community#contribuire", label: t(locale, "footer.community.contribuire") },
        { href: "/community#discussioni", label: t(locale, "footer.community.discussioni") },
      ],
    },
    {
      title: t(locale, "footer.contatti"),
      links: [
        { href: "/contatti", label: t(locale, "footer.contatti.modulo") },
        { href: "/contatti#corsi", label: t(locale, "footer.contatti.corsi") },
        { href: "/contatti#consulenza", label: t(locale, "footer.contatti.consulenza") },
        { href: "/contatti#supporto", label: t(locale, "footer.contatti.supporto") },
      ],
    },
  ];

  return (
    <footer className="bg-code-bg border-t border-sand/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter row */}
        <div className="mb-10 pb-8 border-b border-sand/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="shrink-0">
              <h3 className="text-xs font-mono text-teal uppercase tracking-widest mb-1">
                {t(locale, "footer.newsletter")}
              </h3>
              <p className="text-xs text-sand/40">{t(locale, "footer.newsletter.desc")}</p>
            </div>
            <div className="flex-1 w-full sm:max-w-sm">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {staticColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-mono text-teal uppercase tracking-widest mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sand/50 hover:text-sand transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-sand/50 hover:text-sand transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CMS pages section — only shown if there are published pages */}
        {cmsPages.length > 0 && (
          <div className="mb-10 pb-8 border-b border-sand/10">
            <h3 className="text-xs font-mono text-teal uppercase tracking-widest mb-4">
              {t(locale, "footer.pages")}
            </h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {cmsPages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/${page.slug}`}
                    className="text-sm text-sand/50 hover:text-sand transition-colors"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-sand/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo_pyarchinit_official.png" alt="pyArchInit" width={24} height={24} />
            <span className="text-teal font-mono text-sm font-bold">pyArchInit</span>
          </Link>
          <p className="text-xs text-sand/30 text-center">
            &copy; {new Date().getFullYear()} pyArchInit. {t(locale, "footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-sand/30">
              {t(locale, "footer.license")}{" "}
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sand transition-colors"
              >
                GPL-3.0
              </a>
            </p>
            <Link
              href="/admin/login"
              className="text-xs text-sand/20 hover:text-sand/50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
