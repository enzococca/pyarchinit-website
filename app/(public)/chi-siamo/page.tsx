export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { SectionDivider } from "@/components/public/section-divider";
import { GitFork, GraduationCap, Code, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi siamo - pyArchInit",
  description: "Il team dietro pyArchInit: Luca Mandolesi e Enzo Cocca, fondatori della piattaforma open source per l'archeologia digitale.",
};

const founders = [
  {
    name: "Luca Mandolesi",
    role: "Fondatore di pyArchInit / Direttore ICT",
    photo: "/images/team_luca.jpg",
    bio: "Laureato in Scienze Archeologiche con indirizzo medievale presso l'Università di Siena. Dal 2005 gestisce lo sviluppo di pyArchInit, il plugin open-source per QGIS dedicato alla gestione dei dati di scavo su piattaforma GIS. Esperto in rilievo GNSS, Structure From Motion, QGIS e modellazione 3D con Blender. Co-fondatore di GFOSS.it e ArcheoFOSS. Dirige il programma di formazione Flyover Academy.",
    registration: "Iscritto all'elenco dei professionisti dei beni culturali, Fascia I n.5059",
    highlights: [
      { icon: Code, text: "Creatore di pyArchInit (2005)" },
      { icon: GraduationCap, text: "Direttore Flyover Academy" },
      { icon: Globe, text: "Co-fondatore GFOSS.it e ArcheoFOSS" },
    ],
  },
  {
    name: "Enzo Cocca",
    role: "Fondatore di pyArchInit / Sviluppo e Innovazione",
    photo: "/images/team_enzo.jpg",
    bio: "Specializzato in informatica applicata all'archeologia e alla preistoria. Dottore di ricerca in Scienze e Tecnologie per l'Archeologia e i Beni Culturali. Sviluppa soluzioni software per la documentazione e gestione dei dati archeologici. Attivo in progetti di ricerca in Italia, Africa, Asia, Medio Oriente e Indonesia.",
    registration: "Iscritto all'elenco dei professionisti dei beni culturali, Fascia I n.4045",
    highlights: [
      { icon: Code, text: "Lead Developer pyArchInit" },
      { icon: Globe, text: "Ricerca in 4 continenti" },
      { icon: GraduationCap, text: "PhD Scienze e Tecnologie per l'Archeologia" },
    ],
  },
];

const partners = [
  "Ludwig Maximilian Universität München",
  "Università di Salerno",
  "Università di Pisa",
  "Parco Archeologico di Paestum",
  "Progetti archeologici in Libano",
];

export default function ChiSiamoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero_scavo.jpg"
          alt="Scavo archeologico con pyArchInit"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/70 to-primary/90" />
        <div className="relative z-10 text-center px-4 py-20">
          <ScrollReveal>
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={80}
              height={80}
              className="mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-4xl md:text-5xl font-mono text-sand mb-4">
              Chi <span className="text-teal">siamo</span>
            </h1>
            <p className="text-sand/60 text-lg max-w-2xl mx-auto">
              pyArchInit nasce nel 2005 dall&apos;idea di creare un plugin Python per QGIS
              dedicato alla gestione dei dati archeologici. Oggi è la piattaforma open source
              di riferimento per l&apos;archeologia digitale in Italia.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* Founders */}
      <section className="bg-sand py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-mono text-primary mb-4 text-center">I Fondatori</h2>
            <p className="text-primary/50 text-center max-w-xl mx-auto mb-16">
              Archeologi e sviluppatori, uniti dalla passione per l&apos;open source
              e l&apos;innovazione nel campo dei beni culturali.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-12">
            {founders.map((person) => (
              <ScrollReveal key={person.name}>
                <div className="bg-white rounded-card shadow-lg overflow-hidden">
                  {/* Photo + name header */}
                  <div className="relative bg-primary p-8 flex items-center gap-6">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden ring-3 ring-teal/30 shrink-0">
                      <Image
                        src={person.photo}
                        alt={person.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-mono text-teal mb-1">{person.name}</h3>
                      <p className="text-sand/60 text-sm">{person.role}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <p className="text-primary/70 text-sm leading-relaxed mb-6">
                      {person.bio}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-3 mb-6">
                      {person.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <h.icon size={16} className="text-teal shrink-0" />
                          <span className="text-primary/60 text-sm">{h.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Registration */}
                    <p className="text-primary/40 text-xs italic border-t border-primary/10 pt-4">
                      {person.registration}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider variant="light-to-dark" />

      {/* pyArchInit Links */}
      <section className="bg-primary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={80}
              height={80}
              className="mx-auto mb-8"
            />
            <h2 className="text-3xl font-mono text-teal mb-6">pyArchInit</h2>
            <p className="text-sand/60 leading-relaxed mb-8">
              pyArchInit è un progetto open source sviluppato e mantenuto da Luca Mandolesi ed Enzo Cocca.
              Il progetto combina competenze archeologiche con tecnologie all&apos;avanguardia: GIS, droni,
              fotogrammetria, modellazione 3D e intelligenza artificiale applicata ai beni culturali.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://github.com/pyarchinit"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-sand/20 text-sand/60 font-mono text-sm px-5 py-2.5 rounded-full hover:border-teal hover:text-teal transition flex items-center gap-2"
              >
                <GitFork size={14} /> GitHub
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* Partners */}
      <section className="bg-sand py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-mono text-primary mb-12">Chi usa pyArchInit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((name) => (
                <div
                  key={name}
                  className="bg-white rounded-card px-6 py-4 shadow-sm text-primary/70 text-sm"
                >
                  {name}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="light-to-dark" />

      {/* CTA */}
      <section className="bg-primary py-20 px-4 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-mono text-teal mb-4">Unisciti a noi</h2>
          <p className="text-sand/50 mb-8 max-w-lg mx-auto">
            pyArchInit è open source. Contribuisci al codice, segui i corsi
            o contattaci per una consulenza.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/corsi"
              className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full hover:bg-teal/90 transition"
            >
              Esplora i Corsi
            </Link>
            <Link
              href="/contatti"
              className="border border-sand/30 text-sand font-mono px-6 py-3 rounded-full hover:border-teal hover:text-teal transition"
            >
              Contattaci
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
