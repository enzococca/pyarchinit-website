"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, getLocaleFromCookie, t as translate } from "@/lib/i18n";

const LocaleContext = createContext<{
  locale: Locale;
  t: (key: string) => string;
}>({
  locale: "it",
  t: (key) => translate("it", key),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("it");

  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, t: (key) => translate(locale, key) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
