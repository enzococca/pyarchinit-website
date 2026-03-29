import type { Metadata } from "next";
import Link from "next/link";
import { Database, Map, GraduationCap, Wrench } from "lucide-react";
import { getServerLocale, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servizi | pyArchInit",
  description:
    "Scopri i servizi professionali di pyArchInit: gestione dati, GIS, formazione e sviluppo software personalizzato per l'archeologia.",
};

export default async function ServiziPage() {
  const locale = await getServerLocale();

  const services = [
    {
      icon: Database,
      title: t(locale, "servizi.gestione.title"),
      description: t(locale, "servizi.gestione.desc"),
    },
    {
      icon: Map,
      title: t(locale, "servizi.gis.title"),
      description: t(locale, "servizi.gis.desc"),
    },
    {
      icon: GraduationCap,
      title: t(locale, "servizi.formazione.title"),
      description: t(locale, "servizi.formazione.desc"),
    },
    {
      icon: Wrench,
      title: t(locale, "servizi.custom.title"),
      description: t(locale, "servizi.custom.desc"),
    },
  ];

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-sm tracking-widest uppercase mb-4">
            {t(locale, "servizi.subtitle")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            {t(locale, "servizi.title")}
          </h1>
          <p className="text-sand/60 text-lg max-w-xl">
            {t(locale, "servizi.description")}
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-code-bg rounded-card p-8 border border-sand/10 hover:border-teal/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-6">
                <Icon size={24} className="text-teal" />
              </div>
              <h2 className="text-xl font-mono font-bold text-sand mb-3">{title}</h2>
              <p className="text-sand/60 text-sm leading-relaxed mb-6">{description}</p>
              <Link
                href="/contatti"
                className="inline-flex items-center text-sm text-teal hover:text-teal/80 transition-colors font-medium"
              >
                {t(locale, "servizi.richiedi")} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-code-bg border-t border-sand/10 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-mono font-bold text-sand mb-4">
            {t(locale, "servizi.cta.title")}
          </h2>
          <p className="text-sand/60 mb-8">
            {t(locale, "servizi.cta.description")}
          </p>
          <Link
            href="/contatti"
            className="inline-flex items-center px-8 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
          >
            {t(locale, "servizi.cta.button")}
          </Link>
        </div>
      </section>
    </main>
  );
}
