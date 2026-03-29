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
    "home.cosa.detail":
      "pyArchInit è un plugin Python per QGIS (GIS open-source) che consente l'integrazione di dati alfanumerici, spaziali e multimediali in un'unica piattaforma pensata per la documentazione archeologica (unità stratigrafiche, reperti, strutture, siti) e la loro rappresentazione GIS.",
    "home.perchi.title": "Per chi è pyArchInit?",
    "home.perchi.subtitle": "Una piattaforma progettata per soddisfare le esigenze di tutti gli attori del mondo dell'archeologia digitale.",
    "home.usato.label": "Usato da",
    "home.usato.title": "Chi usa pyArchInit?",
    "home.usato.desc": "Università, enti pubblici e progetti di ricerca in Italia e nel mondo.",
    "home.newsletter.title": "Resta aggiornato",
    "home.newsletter.description":
      "Iscriviti alla newsletter per ricevere novità su corsi, aggiornamenti e guide.",
    "home.cta.title": "Pronto a iniziare?",
    "home.cta.description":
      "Unisciti alla community di archeologi e sviluppatori che usano pyArchInit.",
    "home.cta.description_full":
      "Unisciti alla community di archeologi e sviluppatori che usano pyArchInit per portare la gestione dei dati archeologici nel XXI secolo.",
    "home.cta.corsi": "Scopri i corsi",
    "home.cta.contatti": "Contattaci",
    // Per chi cards
    "home.perchi.archeologi.title": "Archeologi",
    "home.perchi.archeologi.desc":
      "Strumenti professionali per la documentazione e gestione dei dati di scavo. Dall'acquisizione sul campo all'analisi e pubblicazione.",
    "home.perchi.archeologi.link": "Scopri i corsi",
    "home.perchi.enti.title": "Enti e Istituzioni",
    "home.perchi.enti.desc":
      "Soluzioni scalabili per soprintendenze, musei e università che necessitano di gestire grandi archivi di dati archeologici.",
    "home.perchi.enti.link": "Vedi i servizi",
    "home.perchi.sviluppatori.title": "Sviluppatori",
    "home.perchi.sviluppatori.desc":
      "Codice open source, API documentate e una community attiva. Contribuisci al progetto e integra pyArchInit nelle tue applicazioni.",
    "home.perchi.sviluppatori.link": "Unisciti alla community",
    // Counters
    "home.counter.anni": "+ anni",
    "home.counter.anni.label": "di sviluppo attivo",
    "home.counter.contributori": "+ contributori",
    "home.counter.contributori.label": "in tutto il mondo",
    "home.counter.scavi": "+ scavi",
    "home.counter.scavi.label": "documentati con pyArchInit",
    // Footer
    "footer.newsletter": "Newsletter",
    "footer.newsletter.desc": "Aggiornamenti su corsi e guide",
    "footer.copyright": "Piattaforma open source per l'archeologia digitale.",
    "footer.nav": "Navigazione",
    "footer.corsi": "Corsi",
    "footer.community": "Community",
    "footer.contatti": "Contatti",
    "footer.pages": "Pagine",
    "footer.license": "Licenza",
    // Footer links
    "footer.nav.home": "Home",
    "footer.nav.servizi": "Servizi",
    "footer.nav.community": "Community",
    "footer.nav.contatti": "Contatti",
    "footer.corsi.tutti": "Tutti i corsi",
    "footer.corsi.base": "Livello base",
    "footer.corsi.avanzato": "Livello avanzato",
    "footer.corsi.certificazioni": "Certificazioni",
    "footer.community.github": "GitHub",
    "footer.community.docs": "Documentazione",
    "footer.community.contribuire": "Come contribuire",
    "footer.community.discussioni": "Discussioni",
    "footer.contatti.modulo": "Modulo di contatto",
    "footer.contatti.corsi": "Info corsi",
    "footer.contatti.consulenza": "Consulenza",
    "footer.contatti.supporto": "Supporto tecnico",
    // Chi siamo
    "chisiamo.title": "Chi siamo",
    "chisiamo.founders": "I Fondatori",
    // Servizi
    "servizi.title": "Servizi",
    "servizi.subtitle": "Servizi professionali",
    "servizi.description":
      "Supporto professionale per portare l'archeologia digitale al livello successivo, dalla progettazione all'implementazione.",
    "servizi.cta.title": "Hai un progetto in mente?",
    "servizi.cta.description":
      "Contattaci per discutere le tue esigenze e ricevere un preventivo personalizzato.",
    "servizi.cta.button": "Contattaci",
    "servizi.richiedi": "Richiedi un preventivo",
    "servizi.gestione.title": "Gestione Dati Archeologici",
    "servizi.gestione.desc":
      "Implementazione e configurazione di database relazionali per la gestione strutturata dei dati di scavo, unità stratigrafiche, reperti e contesti. Migrazione da sistemi legacy e integrazione con flussi di lavoro esistenti.",
    "servizi.gis.title": "GIS e Cartografia",
    "servizi.gis.desc":
      "Servizi di supporto per la gestione dei dati geografici: configurazione di sistemi GIS integrati con pyArchInit, elaborazione di planimetrie, piante di scavo e analisi spaziali dei contesti archeologici.",
    "servizi.formazione.title": "Formazione",
    "servizi.formazione.desc":
      "Corsi e workshop su misura per enti, soprintendenze e università. Formazione pratica sull'utilizzo di pyArchInit, dalla documentazione sul campo all'analisi dei dati in laboratorio.",
    "servizi.custom.title": "Sviluppo Custom",
    "servizi.custom.desc":
      "Estensioni, plugin e integrazioni personalizzate per adattare pyArchInit alle specifiche esigenze del tuo progetto. Sviluppo di interfacce dedicate e connettori per sistemi terzi.",
    // Contatti
    "contatti.title": "Contatti",
    "contatti.nome": "Nome",
    "contatti.email": "Email",
    "contatti.tipo": "Tipo di richiesta",
    "contatti.messaggio": "Messaggio",
    "contatti.invia": "Invia messaggio",
    "contatti.success": "Messaggio inviato!",
    // Projects
    "progetti.title": "Ecosistema pyArchInit",
    "progetti.description":
      "Una suite di strumenti open source per la gestione, analisi e documentazione dei dati archeologici.",
    // Learn
    "impara.title": "Impara",
    "impara.description": "Corsi interattivi con esercitazioni guidate",
    // Docs
    "docs.title": "Documentazione",
    // Video
    "video.title": "Video Tutorial",
    // Forum
    "forum.title": "Forum",
    // Community
    "community.title": "Community",
    "community.subtitle": "Open Source",
    "community.description":
      "pyArchInit è un progetto open source portato avanti da una community internazionale di archeologi e sviluppatori.",
    "community.cta.title": "Inizia a contribuire oggi",
    "community.cta.description":
      "Non serve essere uno sviluppatore esperto. Puoi contribuire con segnalazioni, traduzioni, documentazione o test.",
    "community.cta.docs": "Documentazione",
    "community.sorgente.title": "Codice sorgente",
    "community.sorgente.desc":
      "Il codice di pyArchInit è completamente open source e disponibile su GitHub. Esplora il repository, segnala bug e proponi nuove funzionalità.",
    "community.sorgente.link": "Vai su GitHub",
    "community.docs.title": "Documentazione",
    "community.docs.desc":
      "Documentazione tecnica completa: guida all'installazione, API reference, tutorial e casi d'uso reali. Aggiornata ad ogni release.",
    "community.docs.link": "Leggi la documentazione",
    "community.contribuire.title": "Come contribuire",
    "community.contribuire.desc":
      "Vuoi contribuire al progetto? Leggi la guida per contributor: dalla segnalazione di bug alla scrittura di documentazione, ogni contributo è benvenuto.",
    "community.contribuire.link": "Guida per contributor",
    "community.forum.title": "Forum",
    "community.forum.desc":
      "Forum della community per domande, idee e confronto tra utenti. Connettiti con archeologi e sviluppatori da tutto il mondo.",
    "community.forum.link": "Vai al Forum",
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
    "home.cosa.detail":
      "pyArchInit is a Python plugin for QGIS (open-source GIS) that enables the integration of alphanumeric, spatial and multimedia data in a single platform for archaeological documentation (stratigraphic units, finds, structures, sites) and their GIS representation.",
    "home.perchi.title": "Who is pyArchInit for?",
    "home.perchi.subtitle": "A platform designed to meet the needs of all stakeholders in the digital archaeology world.",
    "home.usato.label": "Used by",
    "home.usato.title": "Who uses pyArchInit?",
    "home.usato.desc": "Universities, public institutions and research projects in Italy and worldwide.",
    "home.newsletter.title": "Stay updated",
    "home.newsletter.description":
      "Subscribe to the newsletter for news about courses, updates and guides.",
    "home.cta.title": "Ready to start?",
    "home.cta.description":
      "Join the community of archaeologists and developers using pyArchInit.",
    "home.cta.description_full":
      "Join the community of archaeologists and developers using pyArchInit to bring archaeological data management into the 21st century.",
    "home.cta.corsi": "Explore courses",
    "home.cta.contatti": "Contact us",
    // Per chi cards
    "home.perchi.archeologi.title": "Archaeologists",
    "home.perchi.archeologi.desc":
      "Professional tools for excavation data documentation and management. From field acquisition to analysis and publication.",
    "home.perchi.archeologi.link": "Explore courses",
    "home.perchi.enti.title": "Institutions & Organizations",
    "home.perchi.enti.desc":
      "Scalable solutions for heritage agencies, museums and universities that need to manage large archaeological data archives.",
    "home.perchi.enti.link": "View services",
    "home.perchi.sviluppatori.title": "Developers",
    "home.perchi.sviluppatori.desc":
      "Open source code, documented APIs and an active community. Contribute to the project and integrate pyArchInit into your applications.",
    "home.perchi.sviluppatori.link": "Join the community",
    // Counters
    "home.counter.anni": "+ years",
    "home.counter.anni.label": "of active development",
    "home.counter.contributori": "+ contributors",
    "home.counter.contributori.label": "worldwide",
    "home.counter.scavi": "+ excavations",
    "home.counter.scavi.label": "documented with pyArchInit",
    // Footer
    "footer.newsletter": "Newsletter",
    "footer.newsletter.desc": "Course and guide updates",
    "footer.copyright": "Open source platform for digital archaeology.",
    "footer.nav": "Navigation",
    "footer.corsi": "Courses",
    "footer.community": "Community",
    "footer.contatti": "Contact",
    "footer.pages": "Pages",
    "footer.license": "License",
    // Footer links
    "footer.nav.home": "Home",
    "footer.nav.servizi": "Services",
    "footer.nav.community": "Community",
    "footer.nav.contatti": "Contact",
    "footer.corsi.tutti": "All courses",
    "footer.corsi.base": "Beginner level",
    "footer.corsi.avanzato": "Advanced level",
    "footer.corsi.certificazioni": "Certifications",
    "footer.community.github": "GitHub",
    "footer.community.docs": "Documentation",
    "footer.community.contribuire": "How to contribute",
    "footer.community.discussioni": "Discussions",
    "footer.contatti.modulo": "Contact form",
    "footer.contatti.corsi": "Course info",
    "footer.contatti.consulenza": "Consulting",
    "footer.contatti.supporto": "Technical support",
    // Chi siamo
    "chisiamo.title": "About us",
    "chisiamo.founders": "The Founders",
    // Servizi
    "servizi.title": "Services",
    "servizi.subtitle": "Professional services",
    "servizi.description":
      "Professional support to take digital archaeology to the next level, from design to implementation.",
    "servizi.cta.title": "Have a project in mind?",
    "servizi.cta.description":
      "Contact us to discuss your needs and receive a personalized quote.",
    "servizi.cta.button": "Contact us",
    "servizi.richiedi": "Request a quote",
    "servizi.gestione.title": "Archaeological Data Management",
    "servizi.gestione.desc":
      "Implementation and configuration of relational databases for structured management of excavation data, stratigraphic units, finds and contexts. Migration from legacy systems and integration with existing workflows.",
    "servizi.gis.title": "GIS & Cartography",
    "servizi.gis.desc":
      "Support services for geographic data management: configuration of GIS systems integrated with pyArchInit, processing of floor plans, excavation drawings and spatial analysis of archaeological contexts.",
    "servizi.formazione.title": "Training",
    "servizi.formazione.desc":
      "Custom courses and workshops for institutions, heritage agencies and universities. Hands-on training on using pyArchInit, from field documentation to laboratory data analysis.",
    "servizi.custom.title": "Custom Development",
    "servizi.custom.desc":
      "Custom extensions, plugins and integrations to adapt pyArchInit to your project's specific needs. Development of dedicated interfaces and connectors for third-party systems.",
    // Contatti
    "contatti.title": "Contact",
    "contatti.nome": "Name",
    "contatti.email": "Email",
    "contatti.tipo": "Request type",
    "contatti.messaggio": "Message",
    "contatti.invia": "Send message",
    "contatti.success": "Message sent!",
    // Projects
    "progetti.title": "pyArchInit Ecosystem",
    "progetti.description":
      "A suite of open source tools for managing, analyzing, and documenting archaeological data.",
    // Learn
    "impara.title": "Learn",
    "impara.description": "Interactive courses with guided exercises",
    // Docs
    "docs.title": "Documentation",
    // Video
    "video.title": "Video Tutorials",
    // Forum
    "forum.title": "Forum",
    // Community
    "community.title": "Community",
    "community.subtitle": "Open Source",
    "community.description":
      "pyArchInit is an open source project driven by an international community of archaeologists and developers.",
    "community.cta.title": "Start contributing today",
    "community.cta.description":
      "You don't need to be an expert developer. You can contribute with reports, translations, documentation or testing.",
    "community.cta.docs": "Documentation",
    "community.sorgente.title": "Source code",
    "community.sorgente.desc":
      "The pyArchInit code is fully open source and available on GitHub. Explore the repository, report bugs and propose new features.",
    "community.sorgente.link": "Go to GitHub",
    "community.docs.title": "Documentation",
    "community.docs.desc":
      "Complete technical documentation: installation guide, API reference, tutorials and real use cases. Updated with every release.",
    "community.docs.link": "Read the documentation",
    "community.contribuire.title": "How to contribute",
    "community.contribuire.desc":
      "Want to contribute to the project? Read the contributor guide: from bug reporting to writing documentation, every contribution is welcome.",
    "community.contribuire.link": "Contributor guide",
    "community.forum.title": "Forum",
    "community.forum.desc":
      "Community forum for questions, ideas and discussion between users. Connect with archaeologists and developers from around the world.",
    "community.forum.link": "Go to Forum",
    // Common
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

export async function getServerLocale(): Promise<Locale> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return (cookieStore.get("locale")?.value as Locale) || "it";
  } catch {
    return "it";
  }
}
