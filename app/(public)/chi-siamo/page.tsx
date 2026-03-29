export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { SectionDivider } from "@/components/public/section-divider";
import { GitFork, GraduationCap, Code, Globe } from "lucide-react";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getServerLocale, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Chi siamo - pyArchInit",
  description: "Il team dietro pyArchInit: Luca Mandolesi e Enzo Cocca, fondatori della piattaforma open source per l'archeologia digitale.",
};

const DEFAULT_LUCA_BIO =
  "Laureato in Scienze Archeologiche con indirizzo medievale presso l'Università di Siena. Dal 2005 gestisce lo sviluppo di pyArchInit, il plugin open-source per QGIS dedicato alla gestione dei dati di scavo su piattaforma GIS. Esperto in rilievo GNSS, Structure From Motion, QGIS e modellazione 3D con Blender. Dirige il programma di formazione Flyover Academy.";

const DEFAULT_ENZO_BIO =
  "Specializzato in informatica applicata all'archeologia e alla preistoria. Dottore di ricerca in Scienze e Tecnologie per l'Archeologia e i Beni Culturali. Sviluppa soluzioni software per la documentazione e gestione dei dati archeologici. Attivo in progetti di ricerca in Italia, Africa, Asia, Medio Oriente e Indonesia.";

const DEFAULT_DESCRIPTION =
  "pyArchInit è un progetto open source sviluppato e mantenuto da Luca Mandolesi ed Enzo Cocca. Il progetto combina competenze archeologiche con tecnologie all'avanguardia: GIS, droni, fotogrammetria, modellazione 3D e intelligenza artificiale applicata ai beni culturali.";

const partners = [
  "Ludwig Maximilian Universität München",
  "Università di Salerno",
  "Università di Pisa",
  "Parco Archeologico di Paestum",
  "Progetti archeologici in Libano",
];

async function getSettings(): Promise<{ luca_bio: string; enzo_bio: string; description: string }> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["chisiamo_luca_bio", "chisiamo_enzo_bio", "chisiamo_description"] } },
    });
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = typeof row.value === "string" ? row.value : String(row.value);
    }
    return {
      luca_bio: map["chisiamo_luca_bio"] || DEFAULT_LUCA_BIO,
      enzo_bio: map["chisiamo_enzo_bio"] || DEFAULT_ENZO_BIO,
      description: map["chisiamo_description"] || DEFAULT_DESCRIPTION,
    };
  } catch {
    return { luca_bio: DEFAULT_LUCA_BIO, enzo_bio: DEFAULT_ENZO_BIO, description: DEFAULT_DESCRIPTION };
  }
}

export default async function ChiSiamoPage() {
  const [settings, locale] = await Promise.all([getSettings(), getServerLocale()]);

  const founders = [
    {
      name: "Luca Mandolesi",
      role: t(locale, "chisiamo.luca.role"),
      photo: "/images/team_luca.jpg",
      bio: settings.luca_bio,
      registration: t(locale, "chisiamo.luca.reg"),
      highlights: [
        { icon: Code, text: t(locale, "chisiamo.luca.h1") },
        { icon: GraduationCap, text: t(locale, "chisiamo.luca.h2") },
        { icon: Globe, text: t(locale, "chisiamo.luca.h3") },
      ],
    },
    {
      name: "Enzo Cocca",
      role: t(locale, "chisiamo.enzo.role"),
      photo: "/images/team_enzo.jpg",
      bio: settings.enzo_bio,
      registration: t(locale, "chisiamo.enzo.reg"),
      highlights: [
        { icon: Code, text: t(locale, "chisiamo.enzo.h1") },
        { icon: Globe, text: t(locale, "chisiamo.enzo.h2") },
        { icon: GraduationCap, text: t(locale, "chisiamo.enzo.h3") },
      ],
    },
  ];

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
              {t(locale, "chisiamo.title")}
            </h1>
            <p className="text-sand/60 text-lg max-w-2xl mx-auto">
              {t(locale, "chisiamo.subtitle")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <SectionDivider variant="dark-to-light" />

      {/* Founders */}
      <section className="bg-sand py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-mono text-primary mb-4 text-center">
              {t(locale, "chisiamo.founders")}
            </h2>
            <p className="text-primary/50 text-center max-w-xl mx-auto mb-16">
              {t(locale, "chisiamo.founders.subtitle")}
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
            <p className="text-sand/60 leading-relaxed mb-8 whitespace-pre-line">
              {settings.description}
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
            <h2 className="text-3xl font-mono text-primary mb-12">
              {t(locale, "chisiamo.who_uses")}
            </h2>
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
          <h2 className="text-3xl font-mono text-teal mb-4">
            {t(locale, "chisiamo.join")}
          </h2>
          <p className="text-sand/50 mb-8 max-w-lg mx-auto">
            {t(locale, "chisiamo.join.desc")}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/corsi"
              className="bg-teal text-primary font-mono font-bold px-6 py-3 rounded-full hover:bg-teal/90 transition"
            >
              {t(locale, "chisiamo.explore_courses")}
            </Link>
            <Link
              href="/contatti"
              className="border border-sand/30 text-sand font-mono px-6 py-3 rounded-full hover:border-teal hover:text-teal transition"
            >
              {t(locale, "chisiamo.contact_us")}
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
