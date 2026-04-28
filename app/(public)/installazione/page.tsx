export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Settings,
  Search,
  CheckCircle2,
  Package,
  GitFork,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { getServerLocale, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Installazione · pyArchInit",
  description:
    "Guida completa all'installazione di pyArchInit tramite il plugin QGIS pyArchInit Installer. Bilingue italiano/inglese.",
};

export default async function InstallazionePage() {
  const locale = await getServerLocale();

  const steps = [
    {
      n: 1,
      icon: Download,
      title: t(locale, "install.step1.title"),
      desc: t(locale, "install.step1.desc"),
      tip: t(locale, "install.step1.tip"),
    },
    {
      n: 2,
      icon: Settings,
      title: t(locale, "install.step2.title"),
      desc: t(locale, "install.step2.desc"),
      tip: t(locale, "install.step2.tip"),
    },
    {
      n: 3,
      icon: Search,
      title: t(locale, "install.step3.title"),
      desc: t(locale, "install.step3.desc"),
      tip: t(locale, "install.step3.tip"),
    },
    {
      n: 4,
      icon: Package,
      title: t(locale, "install.step4.title"),
      desc: t(locale, "install.step4.desc"),
      tip: t(locale, "install.step4.tip"),
    },
    {
      n: 5,
      icon: CheckCircle2,
      title: t(locale, "install.step5.title"),
      desc: t(locale, "install.step5.desc"),
      tip: t(locale, "install.step5.tip"),
    },
  ];

  const requirements = [
    t(locale, "install.req.qgis"),
    t(locale, "install.req.python"),
    t(locale, "install.req.os"),
    t(locale, "install.req.net"),
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16 border-b border-sand/10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00D4AA 1px, transparent 1px), linear-gradient(90deg, #00D4AA 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={40}
              height={40}
              className="drop-shadow-lg"
            />
            <p className="text-teal font-mono text-xs tracking-widest uppercase">
              {t(locale, "install.label")}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-3">
            {t(locale, "install.title")}
          </h1>
          <p className="text-sand/60 text-base max-w-2xl mb-6">
            {t(locale, "install.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/pyarchinit/pyarchinit-installer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
            >
              <GitFork size={14} /> {t(locale, "install.cta.github")}
            </a>
            <a
              href="https://qgis.org/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-sand/20 text-sand/70 font-mono text-sm px-5 py-2.5 rounded-full hover:border-teal hover:text-teal transition"
            >
              <ExternalLink size={14} /> {t(locale, "install.cta.qgis")}
            </a>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-10 border-b border-sand/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-mono text-teal uppercase tracking-widest mb-4">
            {t(locale, "install.req.title")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {requirements.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sand/70 text-sm bg-code-bg border border-sand/8 rounded-lg px-4 py-3"
              >
                <CheckCircle2 size={14} className="text-teal mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-mono text-sand mb-2">
            {t(locale, "install.steps.title")}
          </h2>
          <p className="text-sand/50 text-sm mb-10 max-w-2xl">
            {t(locale, "install.steps.subtitle")}
          </p>

          <ol className="space-y-5">
            {steps.map((s) => (
              <li
                key={s.n}
                className="bg-code-bg border border-sand/8 rounded-card p-6 hover:border-teal/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <span className="w-9 h-9 rounded-full bg-teal/10 border border-teal/30 text-teal font-mono font-bold text-sm flex items-center justify-center">
                      {s.n}
                    </span>
                    <s.icon size={16} className="text-ochre/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sand font-mono text-base font-semibold mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sand/65 text-sm leading-relaxed mb-3 whitespace-pre-line">
                      {s.desc}
                    </p>
                    {s.tip && (
                      <div className="flex items-start gap-2 bg-primary/40 border-l-2 border-ochre/40 px-3 py-2 rounded">
                        <AlertCircle
                          size={13}
                          className="text-ochre/70 mt-0.5 shrink-0"
                        />
                        <p className="text-sand/55 text-xs leading-relaxed">
                          {s.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-12 border-t border-sand/5 bg-code-bg/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-mono text-sand mb-6">
            {t(locale, "install.trouble.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-primary/40 border border-sand/8 rounded-lg p-5"
              >
                <h3 className="text-sand text-sm font-mono font-semibold mb-2">
                  {t(locale, `install.trouble.q${i}`)}
                </h3>
                <p className="text-sand/55 text-xs leading-relaxed whitespace-pre-line">
                  {t(locale, `install.trouble.a${i}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="py-14 border-t border-sand/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-mono text-teal mb-3">
            {t(locale, "install.next.title")}
          </h2>
          <p className="text-sand/55 text-sm mb-8 max-w-xl mx-auto">
            {t(locale, "install.next.desc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 bg-teal text-primary font-mono text-sm font-bold px-5 py-2.5 rounded-full hover:bg-teal/90 transition"
            >
              {t(locale, "install.next.docs")} <ArrowRight size={14} />
            </Link>
            <Link
              href="/impara"
              className="inline-flex items-center gap-2 border border-sand/20 text-sand/70 font-mono text-sm px-5 py-2.5 rounded-full hover:border-teal hover:text-teal transition"
            >
              {t(locale, "install.next.courses")}
            </Link>
            <Link
              href="/forum"
              className="inline-flex items-center gap-2 border border-sand/20 text-sand/70 font-mono text-sm px-5 py-2.5 rounded-full hover:border-teal hover:text-teal transition"
            >
              {t(locale, "install.next.forum")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}