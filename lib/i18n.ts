export type Locale = "it" | "en";

const translations: Record<Locale, Record<string, string>> = {
  it: {
    // Navbar
    "nav.chi_siamo": "Chi siamo",
    "nav.progetti": "Progetti",
    "nav.corsi": "Corsi",
    "nav.docs": "Documentazione",
    "nav.impara": "Impara",
    "nav.video": "Video",
    "nav.servizi": "Servizi",
    "nav.community": "Community",
    "nav.forum": "Forum",
    "nav.contatti": "Contatti",
    "nav.inizia": "Inizia",
    // Homepage
    "home.hero.subtitle": "Open Source · Archeologia Digitale",
    "home.hero.title1": "Piattaforma Open Source per",
    "home.hero.title2": "l'Archeologia Digitale",
    "home.hero.description":
      "Progetto nato nel 2005 per creare un plugin Python per QGIS per la gestione dei dati archeologici su piattaforma GIS.",
    "home.hero.cta_corsi": "Esplora i corsi",
    "home.hero.cta_docs": "Documentazione",
    "home.hero.cta_community": "Contribuisci",
    "home.cosa.title": "Cosa è pyArchInit?",
    "home.cosa.description":
      "pyArchInit è un plugin Python per QGIS (GIS open-source) che consente l'integrazione di dati alfanumerici, spaziali e multimediali in un'unica piattaforma pensata per la documentazione archeologica.",
    "home.perchi.title": "Per chi è pyArchInit?",
    "home.newsletter.title": "Resta aggiornato",
    "home.newsletter.description":
      "Iscriviti alla newsletter per ricevere novità su corsi, aggiornamenti e guide.",
    "home.cta.title": "Pronto a iniziare?",
    "home.cta.description":
      "Unisciti alla community di archeologi e sviluppatori che usano pyArchInit.",
    // Footer
    "footer.newsletter": "Newsletter",
    "footer.newsletter.desc": "Aggiornamenti su corsi e guide",
    "footer.copyright": "Piattaforma open source per l'archeologia digitale.",
    // Common
    "common.search": "Cerca...",
    "common.search.placeholder": "Cerca documentazione, corsi, video...",
  },
  en: {
    "nav.chi_siamo": "About",
    "nav.progetti": "Projects",
    "nav.corsi": "Courses",
    "nav.docs": "Documentation",
    "nav.impara": "Learn",
    "nav.video": "Videos",
    "nav.servizi": "Services",
    "nav.community": "Community",
    "nav.forum": "Forum",
    "nav.contatti": "Contact",
    "nav.inizia": "Start",
    "home.hero.subtitle": "Open Source · Digital Archaeology",
    "home.hero.title1": "Open Source Platform for",
    "home.hero.title2": "Digital Archaeology",
    "home.hero.description":
      "A project born in 2005 to create a Python plugin for QGIS for managing archaeological data on a GIS platform.",
    "home.hero.cta_corsi": "Explore courses",
    "home.hero.cta_docs": "Documentation",
    "home.hero.cta_community": "Contribute",
    "home.cosa.title": "What is pyArchInit?",
    "home.cosa.description":
      "pyArchInit is a Python plugin for QGIS (open-source GIS) that enables the integration of alphanumeric, spatial and multimedia data in a single platform for archaeological documentation.",
    "home.perchi.title": "Who is pyArchInit for?",
    "home.newsletter.title": "Stay updated",
    "home.newsletter.description":
      "Subscribe to the newsletter for news about courses, updates and guides.",
    "home.cta.title": "Ready to start?",
    "home.cta.description":
      "Join the community of archaeologists and developers using pyArchInit.",
    "footer.newsletter": "Newsletter",
    "footer.newsletter.desc": "Course and guide updates",
    "footer.copyright": "Open source platform for digital archaeology.",
    "common.search": "Search...",
    "common.search.placeholder": "Search documentation, courses, videos...",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations["it"]?.[key] ?? key;
}

export function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return "it";
  const match = document.cookie.match(/locale=(it|en)/);
  return (match?.[1] as Locale) || "it";
}

export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${365 * 24 * 60 * 60}`;
}
