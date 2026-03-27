# pyArchInit Website -- Design Spec

**Data:** 2026-03-27
**Stato:** Approvato

---

## 1. Obiettivo

Ricostruire da zero il sito pyarchinit.org come piattaforma moderna che serve tre pubblici: archeologi (corsi e documentazione), enti/istituzioni (servizi e consulenza), sviluppatori (community open source). Enfasi su corsi, documentazione e coding. Include una landing page animata interattiva e un mini-LMS integrato.

## 2. Stack Tecnologico

| Componente       | Tecnologia                                    |
| ---------------- | --------------------------------------------- |
| Framework        | Next.js 14 (App Router)                       |
| Database         | PostgreSQL                                    |
| ORM              | Prisma                                        |
| Auth             | NextAuth.js (credenziali admin, magic link/OAuth studenti) |
| Media            | Upload su disco VPS + ottimizzazione con Sharp |
| Video            | Bunny.net Stream (CDN, adaptive bitrate)      |
| Pagamenti        | Stripe + PayPal                               |
| Drag-and-drop    | @dnd-kit                                      |
| Rich text editor | Tiptap (headless)                             |
| Deploy           | Docker Compose (Next.js + PostgreSQL + Nginx) |
| Lingua           | Italiano                                      |

## 3. Architettura

Monorepo Next.js con route groups:

```
pyarchinit-website/
├── app/
│   ├── (public)/          # Sito pubblico
│   │   ├── page.tsx       # Homepage
│   │   ├── corsi/         # Catalogo + dettaglio corsi
│   │   ├── docs/          # Documentazione
│   │   ├── servizi/       # Consulenza per enti
│   │   ├── community/     # Open source, GitHub
│   │   ├── blog/          # News e articoli
│   │   └── contatti/      # Form contatti
│   ├── (landing)/         # Landing page animata (Canvas 2D)
│   ├── (lms)/             # Area studente (corsi, lezioni, progressi)
│   ├── (admin)/           # CMS admin panel
│   └── api/               # API routes
├── lib/                   # Prisma client, auth, utils
├── components/            # Componenti UI condivisi
├── canvas/                # Engine landing page animata
└── prisma/                # Schema DB
```

## 4. Landing Page Animata

### Scena

Canvas 2D a tutto schermo. Sfondo dark gradient (blu notte > grigio antracite). Atmosfera "studio notturno di un developer-archeologo".

**Luca di spalle** al centro-destra, seduto alla scrivania. Stile illustrazione vettoriale flat con dettagli (non cartoon semplice, non realistico). Cuffie in testa, luce del monitor che illumina schiena e scrivania.

**Monitor:** codice Python che si scrive da solo (syntax highlighted), alternato con interfaccia pyArchInit (scheda US), poi mappa GIS che si popola. Ciclo continuo tra 3-4 schermi con transizioni smooth.

**Fumetti animati:** Ogni 4-5 secondi, dalla testa di Luca emerge una bolla con:
- Snippet di codice (`class UnitaStratigrafica:`)
- Matrice di Harris stilizzata
- Reperto 3D che ruota (anfora, ceramica)
- Grafico di dati archeologici

I fumetti salgono con easing, restano 3 secondi, sfumano. Stile: bordo arrotondato, sfondo semi-trasparente con blur, font monospace per il codice.

**Particelle:** Punti luminosi fluttuanti (polvere/idee), linee di codice semi-trasparenti che scorrono nello sfondo.

### Interazione

**Lente d'ingrandimento:** Quando il cursore si avvicina al monitor di Luca (entro un raggio), cerchio di zoom 3x che mostra il dettaglio -- codice leggibile, interfaccia nitida. Fuori dal raggio, monitor visibile ma piccolo.

### Transizione al Sito

Testo "Scopri pyArchInit" in basso con freccia pulsante. Click o scroll triggerano zoom-in verso il monitor, il contenuto si espande fino a diventare la homepage. Durata ~1.5s.

### Tech Landing

- Canvas 2D API puro (no librerie esterne)
- `requestAnimationFrame` a 60fps
- Noise functions per movimenti organici
- Hit detection per lente d'ingrandimento
- Su mobile: illustrazione statica + animazione CSS fumetti (no Canvas pesante)

## 5. LMS

### Modello Dati

```
Corso
├── titolo, descrizione, immagine cover, prezzo, livello (base/intermedio/avanzato)
├── categoria (Python, GIS, QGIS, pyArchInit, Scavo)
└── Moduli (sezioni ordinabili)
    └── Lezioni (ordinabili dentro il modulo)
        ├── tipo: video | testo | quiz | esercizio
        ├── contenuto: URL video / markdown / domande JSON
        └── durata stimata
```

### Flusso Studente

1. **Catalogo** (`/corsi`) -- griglia filtrabile per categoria e livello
2. **Dettaglio corso** (`/corsi/[slug]`) -- programma, preview gratuita 1-2 lezioni, acquisto
3. **Acquisto** -- checkout Stripe + PayPal, dopo pagamento il corso si sblocca
4. **Dashboard** (`/dashboard`) -- i miei corsi, progresso per corso (barra %), continua da dove eri
5. **Player lezione** (`/corsi/[slug]/lezioni/[id]`) -- video player, markdown, quiz inline con feedback
6. **Progresso** -- tracking completamento per lezione, modulo, corso
7. **Certificato** -- al 100% completamento, generazione automatica PDF

### Video

Hostati su Bunny.net Stream. L'admin carica il video, il sistema lo invia al servizio streaming e salva l'URL. Il VPS non serve video direttamente.

## 6. CMS Admin Panel

### Filosofia

Ogni schermata fa una cosa sola. Interfaccia pulita, icone chiare, zero gergo tecnico. L'admin vede solo quello che gli serve.

### Dashboard (`/admin`)

4 card con numeri e mini-grafico trend: studenti attivi, corsi venduti mese, nuovi contatti, articoli in bozza.

### Sezioni

**Pagine** (`/admin/pagine`)
- Lista pagine del sito
- Editor a blocchi visuale: Testo, Immagine, Hero, CTA, Griglia card, Video, Codice
- Drag-and-drop per riordinare blocchi
- Preview live affiancata
- No HTML, no markdown -- tutto visuale

**Corsi** (`/admin/corsi`)
- Lista con stato (bozza/pubblicato), studenti iscritti
- Editor corso: info base + builder moduli/lezioni drag-and-drop
- Upload video (carica su Bunny.net in background)
- Editor quiz: risposta multipla, vero/falso, spiegazione

**Blog** (`/admin/blog`)
- Editor articoli con blocchi
- Categorie, tag, cover
- Stato: bozza / programmato / pubblicato

**Media** (`/admin/media`)
- Libreria centralizzata, upload drag-and-drop
- Organizzazione in cartelle, rinomina
- Ottimizzazione automatica (resize, WebP) con Sharp
- Integrata in tutti gli editor

**Documentazione** (`/admin/docs`)
- Struttura ad albero: sezioni > pagine
- Editor markdown con preview
- Versionamento pagine

**Studenti** (`/admin/studenti`)
- Lista, filtro per corso
- Dettaglio: corsi acquistati, progresso, data iscrizione
- Assegnazione corsi manuale (omaggi, promozioni)

**Contatti** (`/admin/contatti`)
- Lista messaggi, stato: nuovo / letto / risposto
- Notifica email all'admin per nuovi messaggi

**Impostazioni** (`/admin/impostazioni`)
- Info sito (nome, descrizione, logo, favicon)
- Social media links
- Configurazione Stripe/PayPal
- Gestione utenti admin (multi-admin)

### Tech Admin

- React con componenti UI custom leggeri
- `@dnd-kit` per drag-and-drop
- Tiptap per rich text
- Upload con progress bar + ottimizzazione server-side
- Autosave ogni 30 secondi sulle bozze

## 7. Stile Visivo

### Concept: "Codice incontra Terra"

Precisione del codice + calore della terra archeologica.

### Palette

| Ruolo       | Colore   | Uso                                     |
| ----------- | -------- | --------------------------------------- |
| Primary     | #0F1729  | Sfondo principale, hero, landing        |
| Secondary   | #E8DCC8  | Testo su dark, sfondi sezioni light     |
| Accent 1    | #00D4AA  | CTA, link, highlights codice            |
| Accent 2    | #D4712A  | Badge, elementi archeologici, hover     |
| Accent 3    | #8B7355  | Bordi, dettagli, icone secondarie       |
| Success     | #22C55E  | Progressi LMS, completamenti            |
| Code bg     | #1A1E2E  | Blocchi codice, snippet                 |

**Dark-first:** Sito prevalentemente dark, sezioni alternate light (sabbia) per respiro.

### Tipografia

- **Headings:** JetBrains Mono
- **Body:** Inter
- **Label/Badge:** JetBrains Mono light

### Componenti UI

- **Card:** bordi 12px, ombra sottile, hover con bordo teal
- **Bottoni:** pill-shaped, primario teal su dark, secondario outline
- **Divisori sezioni:** SVG organici a forma di strati geologici/stratigrafici
- **Code blocks:** syntax highlighting con tema custom dalla palette
- **Icone:** set custom minimale, mix tech + archeologiche

### Animazioni Sito

- Scroll reveal: fade-in dal basso
- Hover card: scale(1.02) + bordo accent
- Counter animati nella homepage
- Cursor trowel stilizzato sui link (opzionale)

### Responsive

- Mobile-first
- Landing su mobile: illustrazione statica + CSS fumetti (no Canvas)
- Menu hamburger fullscreen animato

## 8. Pagine

### Homepage

Sezioni verticali alternate dark/light con divisori stratigrafici:

1. **Hero** (dark) -- titolo, sottotitolo, 3 CTA (Corsi / Docs / Contribuisci)
2. **Cosa è pyArchInit** (light) -- paragrafo + illustrazione ecosistema + numeri animati
3. **Corsi in Evidenza** (dark) -- 3 card corsi principali
4. **Per Chi** (light) -- 3 colonne: Archeologi / Enti / Sviluppatori con CTA dedicati
5. **Documentazione Preview** (dark) -- 4-6 card guide popolari + ricerca inline
6. **Blog/News** (light) -- ultimi 3 articoli
7. **Testimonial** (dark) -- carousel citazioni
8. **CTA Finale** (gradient teal > dark) -- "Pronto a iniziare?" + doppio bottone
9. **Footer** -- 4 colonne: Navigazione, Corsi, Community, Contatti + logo + copyright

### Corsi (`/corsi`)

Filtri laterali (categoria, livello, prezzo), griglia card responsive, ordinamento.

### Dettaglio Corso (`/corsi/[slug]`)

Hero con cover + info, tabs (Programma accordion | Requisiti | Docente | Recensioni), sidebar sticky acquisto.

### Documentazione (`/docs`)

3 colonne: sidebar albero | contenuto | table of contents. Ricerca full-text, breadcrumb, link "Modifica su GitHub".

### Servizi (`/servizi`)

Lista servizi con icona + descrizione + case study, CTA preventivo.

### Community (`/community`)

Link GitHub, guida contribuire, contributors showcase, roadmap pubblica.

### Blog (`/blog`)

Lista articoli con filtro categoria, card con cover + titolo + data + excerpt + autore.

### Contatti (`/contatti`)

Form (nome, email, tipo richiesta, messaggio), info contatto, mappa opzionale.
