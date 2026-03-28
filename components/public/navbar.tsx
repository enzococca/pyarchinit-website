"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";

const navLinks = [
  { href: "/corsi", label: "Corsi" },
  { href: "/docs", label: "Documentazione" },
  { href: "/servizi", label: "Servizi" },
  { href: "/community", label: "Community" },
  { href: "/forum", label: "Forum" },
  { href: "/blog", label: "Blog" },
  { href: "/contatti", label: "Contatti" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-primary/80 border-b border-sand/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-teal font-mono text-xl font-bold tracking-tight">
              pyArchInit
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-sand/70 hover:text-sand transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + hamburger */}
            <div className="flex items-center gap-3">
              <Link
                href="/corsi"
                className="hidden md:inline-flex items-center px-4 py-2 rounded-card text-sm font-medium bg-teal text-primary hover:bg-teal/90 transition-colors"
              >
                Inizia
              </Link>
              <button
                className="md:hidden p-2 text-sand/70 hover:text-sand transition-colors"
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
              className="text-teal font-mono text-xl font-bold"
              onClick={() => setMobileOpen(false)}
            >
              pyArchInit
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
              Inizia
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
