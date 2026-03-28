import Link from "next/link";
import { NewsletterForm } from "@/components/public/newsletter-form";

const columns = [
  {
    title: "Navigazione",
    links: [
      { href: "/", label: "Home" },
      { href: "/servizi", label: "Servizi" },
      { href: "/community", label: "Community" },
      { href: "/contatti", label: "Contatti" },
    ],
  },
  {
    title: "Corsi",
    links: [
      { href: "/corsi", label: "Tutti i corsi" },
      { href: "/corsi#base", label: "Livello base" },
      { href: "/corsi#avanzato", label: "Livello avanzato" },
      { href: "/corsi#certificazioni", label: "Certificazioni" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://github.com/pyarchinit", label: "GitHub", external: true },
      { href: "/docs", label: "Documentazione" },
      { href: "/community#contribuire", label: "Come contribuire" },
      { href: "/community#discussioni", label: "Discussioni" },
    ],
  },
  {
    title: "Contatti",
    links: [
      { href: "/contatti", label: "Modulo di contatto" },
      { href: "/contatti#corsi", label: "Info corsi" },
      { href: "/contatti#consulenza", label: "Consulenza" },
      { href: "/contatti#supporto", label: "Supporto tecnico" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-code-bg border-t border-sand/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter row */}
        <div className="mb-10 pb-8 border-b border-sand/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="shrink-0">
              <h3 className="text-xs font-mono text-teal uppercase tracking-widest mb-1">
                Newsletter
              </h3>
              <p className="text-xs text-sand/40">Aggiornamenti su corsi e guide</p>
            </div>
            <div className="flex-1 w-full sm:max-w-sm">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {columns.map((col) => (
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

        <div className="border-t border-sand/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-teal font-mono text-sm font-bold">pyArchInit</span>
          <p className="text-xs text-sand/30 text-center">
            &copy; {new Date().getFullYear()} pyArchInit. Piattaforma open source per l&apos;archeologia digitale.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-sand/30">
              Licenza{" "}
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
