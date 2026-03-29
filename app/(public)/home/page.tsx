export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Users, Building2, Code2 } from "lucide-react";
import { SectionDivider } from "@/components/public/section-divider";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { AnimatedCounter } from "@/components/public/animated-counter";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { HomeSearchBar } from "@/components/public/home-search-bar";
import { getServerLocale, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "pyArchInit - Piattaforma Open Source per l'Archeologia Digitale",
  description:
    "Piattaforma open source per la gestione dei dati archeologici. Corsi, documentazione e strumenti per l'archeologia digitale.",
};

export default async function HomePage() {
  const locale = await getServerLocale();

  const perChiCards = [
    {
      icon: Users,
      title: t(locale, "home.perchi.archeologi.title"),
      description: t(locale, "home.perchi.archeologi.desc"),
      href: "/corsi",
      linkLabel: t(locale, "home.perchi.archeologi.link"),
    },
    {
      icon: Building2,
      title: t(locale, "home.perchi.enti.title"),
      description: t(locale, "home.perchi.enti.desc"),
      href: "/servizi",
      linkLabel: t(locale, "home.perchi.enti.link"),
    },
    {
      icon: Code2,
      title: t(locale, "home.perchi.sviluppatori.title"),
      description: t(locale, "home.perchi.sviluppatori.desc"),
      href: "/community",
      linkLabel: t(locale, "home.perchi.sviluppatori.link"),
    },
  ];

  const counters = [
    {
      target: 10,
      suffix: t(locale, "home.counter.anni"),
      label: t(locale, "home.counter.anni.label"),
    },
    {
      target: 50,
      suffix: t(locale, "home.counter.contributori"),
      label: t(locale, "home.counter.contributori.label"),
    },
    {
      target: 200,
      suffix: t(locale, "home.counter.scavi"),
      label: t(locale, "home.counter.scavi.label"),
    },
  ];

  const usedByNames =
    locale === "en"
      ? [
          "Ludwig Maximilian Universität München",
          "University of Salerno",
          "University of Pisa",
          "Paestum Archaeological Park",
          "Projects in Italy and Lebanon",
        ]
      : [
          "Ludwig Maximilian Universität München",
          "Università di Salerno",
          "Università di Pisa",
          "Parco Archeologico di Paestum",
          "Progetti in Italia e Libano",
        ];

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
                {t(locale, "home.hero.subtitle")}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-sand leading-tight mb-6">
                {t(locale, "home.hero.title1")}{" "}
                <span className="text-teal">{t(locale, "home.hero.title2")}</span>
              </h1>
              <p className="text-lg text-sand/70 mb-10 leading-relaxed max-w-xl">
                {t(locale, "home.hero.description")}
                {locale === "it" && (
                  <> Integrazione di dati alfanumerici, cartografici e multimediali.</>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/corsi"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
                >
                  {t(locale, "home.hero.cta_corsi")}
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card border border-sand/20 text-sand hover:border-sand/40 hover:text-sand transition-colors"
                >
                  {t(locale, "home.hero.cta_docs")}
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-card border border-teal/20 text-teal hover:border-teal/40 transition-colors"
                >
                  {t(locale, "home.hero.cta_community")}
                </Link>
              </div>

              {/* Smart search bar */}
              <div className="mt-8">
                <HomeSearchBar />
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
                {t(locale, "home.cosa.title")}
              </h2>
              <p className="text-primary/70 text-lg leading-relaxed">
                {t(locale, "home.cosa.detail")}
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
                {t(locale, "home.usato.label")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-sand mb-3">
                {t(locale, "home.usato.title")}
              </h2>
              <p className="text-sand/40 text-sm max-w-lg mx-auto">
                {t(locale, "home.usato.desc")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {usedByNames.map((name) => (
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
                {t(locale, "home.perchi.title")}
              </h2>
              <p className="text-sand/50 max-w-xl mx-auto">
                {t(locale, "home.perchi.subtitle")}
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
                {t(locale, "home.newsletter.title")}
              </h2>
              <p className="text-sand/50 mb-8 text-lg">
                {t(locale, "home.newsletter.description")}
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
                {t(locale, "home.cta.title")}
              </h2>
              <p className="text-sand/60 mb-10 text-lg">
                {t(locale, "home.cta.description_full")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/corsi"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
                >
                  {t(locale, "home.cta.corsi")}
                </Link>
                <Link
                  href="/contatti"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-card border border-sand/30 text-sand hover:border-sand/60 transition-colors"
                >
                  {t(locale, "home.cta.contatti")}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
