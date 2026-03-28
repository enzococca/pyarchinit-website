import type { Metadata } from "next";
import Link from "next/link";
import { Database, Map, GraduationCap, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Servizi | pyArchInit",
  description:
    "Scopri i servizi professionali di pyArchInit: gestione dati, GIS, formazione e sviluppo software personalizzato per l'archeologia.",
};

const services = [
  {
    icon: Database,
    title: "Gestione Dati Archeologici",
    description:
      "Implementazione e configurazione di database relazionali per la gestione strutturata dei dati di scavo, unità stratigrafiche, reperti e contesti. Migrazione da sistemi legacy e integrazione con flussi di lavoro esistenti.",
  },
  {
    icon: Map,
    title: "GIS e Cartografia",
    description:
      "Servizi di supporto per la gestione dei dati geografici: configurazione di sistemi GIS integrati con pyArchInit, elaborazione di planimetrie, piante di scavo e analisi spaziali dei contesti archeologici.",
  },
  {
    icon: GraduationCap,
    title: "Formazione",
    description:
      "Corsi e workshop su misura per enti, soprintendenze e università. Formazione pratica sull'utilizzo di pyArchInit, dalla documentazione sul campo all'analisi dei dati in laboratorio.",
  },
  {
    icon: Wrench,
    title: "Sviluppo Custom",
    description:
      "Estensioni, plugin e integrazioni personalizzate per adattare pyArchInit alle specifiche esigenze del tuo progetto. Sviluppo di interfacce dedicate e connettori per sistemi terzi.",
  },
];

export default function ServiziPage() {
  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-sm tracking-widest uppercase mb-4">
            Servizi professionali
          </p>
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            Servizi
          </h1>
          <p className="text-sand/60 text-lg max-w-xl">
            Supporto professionale per portare l&apos;archeologia digitale al livello
            successivo, dalla progettazione all&apos;implementazione.
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
                Richiedi un preventivo &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-code-bg border-t border-sand/10 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-mono font-bold text-sand mb-4">
            Hai un progetto in mente?
          </h2>
          <p className="text-sand/60 mb-8">
            Contattaci per discutere le tue esigenze e ricevere un preventivo
            personalizzato.
          </p>
          <Link
            href="/contatti"
            className="inline-flex items-center px-8 py-3 rounded-card bg-teal text-primary font-medium hover:bg-teal/90 transition-colors"
          >
            Contattaci
          </Link>
        </div>
      </section>
    </main>
  );
}
