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
    // Force hard navigation to bypass Next.js cache
    window.location.href = window.location.pathname + "?lang=" + newLocale + "&t=" + Date.now();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs font-mono text-sand/60 hover:text-teal transition px-2.5 py-1.5 border border-sand/15 rounded-lg hover:border-teal/30"
      title={locale === "it" ? "Switch to English" : "Passa all'italiano"}
    >
      <span className={locale === "it" ? "text-teal font-bold" : "text-sand/40"}>IT</span>
      <span className="text-sand/20">/</span>
      <span className={locale === "en" ? "text-teal font-bold" : "text-sand/40"}>EN</span>
    </button>
  );
}
