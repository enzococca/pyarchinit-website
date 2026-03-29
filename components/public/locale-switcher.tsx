"use client";
import { useState, useEffect } from "react";
import { getLocaleFromCookie, setLocaleCookie, Locale } from "@/lib/i18n";

export function LocaleSwitcher() {
  const [locale, setLocale] = useState<Locale>("it");

  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const toggle = () => {
    const newLocale = locale === "it" ? "en" : "it";
    setLocaleCookie(newLocale);
    setLocale(newLocale);
    window.location.reload(); // Simplest approach for Phase 1
  };

  return (
    <button
      onClick={toggle}
      className="text-xs font-mono text-sand/50 hover:text-teal transition px-2 py-1 border border-sand/10 rounded"
    >
      {locale === "it" ? "EN" : "IT"}
    </button>
  );
}
