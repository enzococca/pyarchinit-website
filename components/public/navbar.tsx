"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Menu } from "lucide-react";
import { SmartSearchTrigger } from "@/components/public/smart-search";
import { useSearch } from "@/components/public/search-provider";
import { useLocale } from "@/components/public/locale-provider";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { UserMenu } from "@/components/public/user-menu";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openSearch } = useSearch();
  const { t } = useLocale();

  const navLinks = [
    { href: "/chi-siamo", label: t("nav.chi_siamo") },
    { href: "/progetti", label: t("nav.progetti") },
    { href: "/corsi", label: t("nav.corsi") },
    { href: "/impara", label: t("nav.impara") },
    { href: "/docs", label: t("nav.docs") },
    { href: "/installazione", label: t("nav.installazione") },
    { href: "/video", label: t("nav.video") },
    { href: "/servizi", label: t("nav.servizi") },
    { href: "/community", label: t("nav.community") },
    { href: "/forum", label: t("nav.forum") },
    { href: "/contatti", label: t("nav.contatti") },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-primary/80 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4 xl:gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/images/logo_pyarchinit_official.png" alt="pyArchInit" width={32} height={32} />
              <span className="text-teal font-mono font-bold text-lg">pyArchInit</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center justify-center gap-x-4 2xl:gap-x-5 flex-1 min-w-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-sand/70 hover:text-sand transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + login + locale switcher + hamburger */}
            <div className="flex items-center gap-3 shrink-0">
              <SmartSearchTrigger onClick={openSearch} />
              <LocaleSwitcher />
              <UserMenu />
              <Link
                href="/corsi"
                className="hidden 2xl:inline-flex items-center px-4 py-2 rounded-card text-sm font-medium bg-teal text-primary hover:bg-teal/90 transition-colors"
              >
                {t("nav.inizia")}
              </Link>
              <button
                className="xl:hidden p-2 text-sand/70 hover:text-sand transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Apri menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-primary flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-sand/10">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setMobileOpen(false)}
            >
              <Image src="/images/logo_pyarchinit_official.png" alt="pyArchInit" width={32} height={32} />
              <span className="text-teal font-mono font-bold text-lg">pyArchInit</span>
            </Link>
            <button
              className="p-2 text-sand/70 hover:text-sand transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Chiudi menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col items-center justify-center flex-1 gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl font-mono text-sand/80 hover:text-teal transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/corsi"
              className="mt-4 px-8 py-3 rounded-card text-base font-medium bg-teal text-primary hover:bg-teal/90 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.inizia")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
