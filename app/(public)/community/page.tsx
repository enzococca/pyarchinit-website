import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, GitPullRequest, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Community | pyArchInit",
  description:
    "Unisciti alla community di pyArchInit: sviluppatori, archeologi e ricercatori che collaborano per l'archeologia digitale open source.",
};

function GithubIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface CardData {
  iconEl: React.ReactNode;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  external: boolean;
}

const communityCards: CardData[] = [
  {
    iconEl: <GithubIcon size={24} className="text-teal" />,
    title: "Codice sorgente",
    description:
      "Il codice di pyArchInit è completamente open source e disponibile su GitHub. Esplora il repository, segnala bug e proponi nuove funzionalità.",
    linkLabel: "Vai su GitHub",
    href: "https://github.com/pyarchinit",
    external: true,
  },
  {
    iconEl: <BookOpen size={24} className="text-teal" />,
    title: "Documentazione",
    description:
      "Documentazione tecnica completa: guida all'installazione, API reference, tutorial e casi d'uso reali. Aggiornata ad ogni release.",
    linkLabel: "Leggi la documentazione",
    href: "/docs",
    external: false,
  },
  {
    iconEl: <GitPullRequest size={24} className="text-teal" />,
    title: "Come contribuire",
    description:
      "Vuoi contribuire al progetto? Leggi la guida per contributor: dalla segnalazione di bug alla scrittura di documentazione, ogni contributo è benvenuto.",
    linkLabel: "Guida per contributor",
    href: "https://github.com/pyarchinit/contributing",
    external: true,
  },
  {
    iconEl: <MessageSquare size={24} className="text-teal" />,
    title: "Forum",
    description:
      "Forum della community per domande, idee e confronto tra utenti. Connettiti con archeologi e sviluppatori da tutto il mondo.",
    linkLabel: "Vai al Forum",
    href: "/forum",
    external: false,
  },
];

export default function CommunityPage() {
  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-sm tracking-widest uppercase mb-4">
            Open Source
          </p>
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            Community
          </h1>
          <p className="text-sand/60 text-lg max-w-xl">
            pyArchInit è un progetto open source portato avanti da una community
            internazionale di archeologi e sviluppatori.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {communityCards.map(({ iconEl, title, description, linkLabel, href, external }) => (
            <div
              key={title}
              className="bg-code-bg rounded-card p-8 border border-sand/10 hover:border-teal/20 transition-colors flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-6">
                {iconEl}
              </div>
              <h2 className="text-xl font-mono font-bold text-sand mb-3">{title}</h2>
              <p className="text-sand/60 text-sm leading-relaxed flex-1 mb-6">
                {description}
              </p>
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-teal hover:text-teal/80 transition-colors font-medium"
                >
                  {linkLabel} &rarr;
                </a>
              ) : (
                <Link
                  href={href}
                  className="inline-flex items-center text-sm text-teal hover:text-teal/80 transition-colors font-medium"
                >
                  {linkLabel} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-code-bg border-t border-sand/10 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-mono font-bold text-sand mb-4">
            Inizia a contribuire oggi
          </h2>
          <p className="text-sand/60 mb-8">
            Non serve essere uno sviluppatore esperto. Puoi contribuire con segnalazioni,
            traduzioni, documentazione o test.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/pyarchinit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
            >
              <GithubIcon size={18} />
              GitHub
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center px-6 py-3 rounded-card border border-sand/20 text-sand hover:border-sand/40 transition-colors"
            >
              Documentazione
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
