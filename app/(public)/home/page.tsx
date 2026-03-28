import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Users, Building2, Code2 } from "lucide-react";
import { SectionDivider } from "@/components/public/section-divider";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { AnimatedCounter } from "@/components/public/animated-counter";
import { NewsletterForm } from "@/components/public/newsletter-form";

export const metadata: Metadata = {
  title: "pyArchInit - Piattaforma Open Source per l'Archeologia Digitale",
  description:
    "Piattaforma open source per la gestione dei dati archeologici. Corsi, documentazione e strumenti per l'archeologia digitale.",
};

const perChiCards = [
  {
    icon: Users,
    title: "Archeologi",
    description:
      "Strumenti professionali per la documentazione e gestione dei dati di scavo. Dall'acquisizione sul campo all'analisi e pubblicazione.",
    href: "/corsi",
    linkLabel: "Scopri i corsi",
  },
  {
    icon: Building2,
    title: "Enti e Istituzioni",
    description:
      "Soluzioni scalabili per soprintendenze, musei e università che necessitano di gestire grandi archivi di dati archeologici.",
    href: "/servizi",
    linkLabel: "Vedi i servizi",
  },
  {
    icon: Code2,
    title: "Sviluppatori",
    description:
      "Codice open source, API documentate e una community attiva. Contribuisci al progetto e integra pyArchInit nelle tue applicazioni.",
    href: "/community",
    linkLabel: "Unisciti alla community",
  },
];

const counters = [
  { target: 10, suffix: "+ anni", label: "di sviluppo attivo" },
  { target: 50, suffix: "+ contributori", label: "in tutto il mondo" },
  { target: 200, suffix: "+ scavi", label: "documentati con pyArchInit" },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        {/* Hero background photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero_scavo.jpg"
            alt="Scavo archeologico"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/92 via-primary/75 to-[#0a1020]/85" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <ScrollReveal>
            <div className="max-w-3xl">
              {/* Logo */}
              <div className="mb-6">
                <Image
                  src="/images/logo_pyarchinit_official.png"
                  alt="pyArchInit"
                  width={64}
                  height={64}
                  className="drop-shadow-lg"
                />
              </div>
              <p className="text-teal font-mono text-sm tracking-widest uppercase mb-6">
                Open Source &middot; Archeologia Digitale
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-sand leading-tight mb-6">
                Piattaforma Open Source per{" "}
                <span className="text-teal">l&apos;Archeologia Digitale</span>
              </h1>
              <p className="text-lg text-sand/70 mb-10 leading-relaxed max-w-xl">
                Progetto nato nel 2005 per creare un plugin Python per QGIS per la gestione
                dei dati archeologici su piattaforma GIS. Integrazione di dati alfanumerici,
                cartografici e multimediali.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/corsi"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
                >
                  Esplora i corsi
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card border border-sand/20 text-sand hover:border-sand/40 hover:text-sand transition-colors"
                >
                  Documentazione
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card border border-teal/20 text-teal hover:border-teal/40 transition-colors"
                >
                  Contribuisci
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Divider */}
      <SectionDivider variant="dark-to-light" />

      {/* Cosa è pyArchInit */}
      <section className="bg-sand py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-primary mb-6">
                Cosa è pyArchInit?
              </h2>
              <p className="text-primary/70 text-lg leading-relaxed">
                pyArchInit è un plugin Python per QGIS (GIS open-source) che consente
                l&apos;integrazione di dati alfanumerici, spaziali e multimediali in
                un&apos;unica piattaforma pensata per la documentazione archeologica
                (unità stratigrafiche, reperti, strutture, siti) e la loro
                rappresentazione GIS.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {counters.map(({ target, suffix, label }) => (
              <ScrollReveal key={label}>
                <div className="bg-white/40 rounded-card p-8 border border-primary/10">
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-primary mb-2">
                    <AnimatedCounter target={target} suffix={suffix} />
                  </div>
                  <p className="text-primary/60 text-sm">{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <SectionDivider variant="light-to-dark" />

      {/* Chi usa pyArchInit */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-teal font-mono text-xs tracking-widest uppercase mb-3">
                Usato da
              </p>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-sand mb-3">
                Chi usa pyArchInit?
              </h2>
              <p className="text-sand/40 text-sm max-w-lg mx-auto">
                Università, enti pubblici e progetti di ricerca in Italia e nel mondo.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {[
                "Ludwig Maximilian Universität München",
                "Università di Salerno",
                "Università di Pisa",
                "Parco Archeologico di Paestum",
                "Progetti in Italia e Libano",
              ].map((name) => (
                <div
                  key={name}
                  className="px-5 py-3 rounded-card bg-code-bg border border-sand/10 text-sand/60 text-sm font-mono hover:border-teal/30 hover:text-sand/80 transition-colors text-center"
                >
                  {name}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Per Chi */}
      <section className="bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-4">
                Per chi è pyArchInit?
              </h2>
              <p className="text-sand/50 max-w-xl mx-auto">
                Una piattaforma progettata per soddisfare le esigenze di tutti gli attori
                del mondo dell&apos;archeologia digitale.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {perChiCards.map(({ icon: Icon, title, description, href, linkLabel }) => (
              <ScrollReveal key={title}>
                <div className="bg-code-bg rounded-card p-8 border border-sand/10 hover:border-teal/30 transition-colors h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-6">
                    <Icon size={24} className="text-teal" />
                  </div>
                  <h3 className="text-xl font-mono font-bold text-sand mb-3">{title}</h3>
                  <p className="text-sand/60 text-sm leading-relaxed flex-1 mb-6">
                    {description}
                  </p>
                  <Link
                    href={href}
                    className="text-teal text-sm font-medium hover:text-teal/80 transition-colors inline-flex items-center gap-1"
                  >
                    {linkLabel} &rarr;
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <SectionDivider variant="dark-to-light" />

      {/* Newsletter */}
      <section className="bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-4">
                Resta aggiornato
              </h2>
              <p className="text-sand/50 mb-8 text-lg">
                Iscriviti alla newsletter per ricevere novità su corsi, aggiornamenti e guide.
              </p>
              <div className="max-w-md mx-auto">
                <NewsletterForm />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Divider */}
      <SectionDivider variant="dark-to-light" />

      {/* CTA Finale */}
      <section className="bg-gradient-to-br from-sand to-primary py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-4">
                Pronto a iniziare?
              </h2>
              <p className="text-sand/60 mb-10 text-lg">
                Unisciti alla community di archeologi e sviluppatori che usano pyArchInit per
                portare la gestione dei dati archeologici nel XXI secolo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/corsi"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
                >
                  Scopri i corsi
                </Link>
                <Link
                  href="/contatti"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-card border border-sand/30 text-sand hover:border-sand/60 transition-colors"
                >
                  Contattaci
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
