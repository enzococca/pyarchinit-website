/**
 * Import script for "Python per Archeologi" interactive course.
 *
 * Reads the PDF, splits into chapters/sections, creates course in DB.
 *
 * Usage:
 *   node scripts/import-python-course.mjs [path/to/PDF]
 *
 * Default PDF: /Users/enzo/Downloads/PythonPerArcheologia.pdf
 */

import { PDFParse } from "pdf-parse";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use DATABASE_URL env var or default local connection
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://pyarchinit:pyarchinit@localhost:5444/pyarchinit";

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureUniqueSlug(base, existing) {
  let slug = base;
  let counter = 1;
  while (existing.has(slug)) {
    slug = `${base}-${counter++}`;
  }
  existing.add(slug);
  return slug;
}

function escHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert plain PDF text to HTML with:
 * - Headings (lines that look like section titles)
 * - Code blocks (indented lines or lines with Python syntax)
 * - Paragraph text
 */
function textToHtml(rawText) {
  // Clean up PDF artifacts
  let text = rawText
    // Remove page headers "Python per Archeologi, Release 1.0"
    .replace(/Python per Archeologi, Release 1\.0\n/g, "")
    // Remove page markers "-- N of 208 --"
    .replace(/-- \d+ of 208 --\n?/g, "")
    // Remove running chapter titles in page headers (short lines that repeat)
    .replace(/^Capitolo \d+:.{0,80}\n/gm, "")
    .replace(/^Tips and Tricks:.{0,80}\n/gm, "")
    .replace(/^Glossario di Termini.{0,80}\n/gm, "")
    // Remove page number prefixes like "10 Capitolo 1:" or "63 Fondamenti..."
    .replace(/^\d{1,4} Capitolo \d/gm, "")
    .replace(/^\d{1,4} Fondamenti/gm, "Fondamenti")
    .replace(/^\d{1,4} Concetti/gm, "Concetti")
    .replace(/^\d{1,4} Gestione/gm, "Gestione")
    .replace(/^\d{1,4} Moduli/gm, "Moduli")
    .replace(/^\d{1,4} Esercizi/gm, "Esercizi")
    .replace(/^\d{1,4} Analisi/gm, "Analisi")
    .replace(/^\d{1,4} Statistiche/gm, "Statistiche")
    .replace(/^\d{1,4} Cos/gm, "Cos")
    .replace(/^\d{1,4} Configurazione/gm, "Configurazione")
    .replace(/^\d{1,4} Operazioni/gm, "Operazioni")
    .replace(/^\d{1,4} Sistemi/gm, "Sistemi")
    .replace(/^\d{1,4} Visualizzazione/gm, "Visualizzazione")
    .replace(/^\d{1,4} Esportazione/gm, "Esportazione")
    .replace(/^\d{1,4} Nearest/gm, "Nearest")
    .replace(/^\d{1,4} Hot Spot/gm, "Hot Spot")
    .replace(/^\d{1,4} Autocorrelazione/gm, "Autocorrelazione")
    .replace(/^\d{1,4} Ripley/gm, "Ripley")
    .replace(/^\d{1,4} Z-score/gm, "Z-score")
    .replace(/^\d{1,4} Distribuzione/gm, "Distribuzione")
    .replace(/^\d{1,4} Densit/gm, "Densit")
    .replace(/^\d{1,4} Identificazione/gm, "Identificazione")
    .replace(/^\d{1,4} Plugin/gm, "Plugin")
    .replace(/^\d{1,4} Creazione/gm, "Creazione")
    .replace(/^\d{1,4} Sviluppo/gm, "Sviluppo")
    .replace(/^\d{1,4} Strumenti/gm, "Strumenti")
    .replace(/^\d{1,4} Packaging/gm, "Packaging")
    .replace(/^\d{1,4} Caso/gm, "Caso")
    .replace(/^\d{1,4} Testing/gm, "Testing")
    .replace(/^\d{1,4} Debugging/gm, "Debugging")
    .replace(/^\d{1,4} Ottimizzazione/gm, "Ottimizzazione")
    .replace(/^\d{1,4} Documentazione/gm, "Documentazione")
    .replace(/^\d{1,4} Version/gm, "Version")
    .replace(/^\d{1,4} Pubblicazione/gm, "Pubblicazione")
    // Fix "continues on next page" artifacts
    .replace(/\(continues on next page\)\n/g, "")
    .replace(/\(continua dalla pagina precedente\)\n/g, "")
    // Fix broken line continuation (→)
    .replace(/↪→\s*/g, " ")
    // Fix unicode list bullets
    .replace(/^∗\s+/gm, "  • ")
    .replace(/^–\s+/gm, "• ");

  const lines = text.split("\n");
  const htmlParts = [];

  let inCodeBlock = false;
  let codeLines = [];
  let pendingBlank = false;
  let inList = false; // ul or ol
  let listType = ""; // "ul" or "ol"

  // Heuristic: a line starts a code block if it begins with Python-like tokens
  const PYTHON_CODE_START =
    /^(import |from |def |class |if |elif |else:|for |while |try:|except |with |return |print\(|#[^!]|    \w|\t\w|>>>|\.\.\.|result\s*=|layer\s*=|qgs|QgsV|iface\.|self\.|    [a-z_A-Z]|vlayer\s*=|rlayer\s*=|processing\.|@)/;

  // Known section heading words
  const SECTION_WORDS = /^(Fondamenti|Concetti|Gestione|Moduli|Esercizi|Introduzione|Configurazione|Operazioni|Sistemi|Visualizzazione|Analisi|Esportazione|Statistiche|Identificazione|Distribuzione|Densit|Nearest|Hot Spot|Autocorrelazione|Ripley|Z-score|Plugin|Creazione|Packaging|Testing|Debugging|Ottimizzazione|Documentazione|Version|Pubblicazione|Prerequisiti|Obiettivi|Sintassi|Implementazione|Strumenti|Sviluppo|Caso)/i;

  const flushCode = () => {
    if (codeLines.length > 0) {
      const code = codeLines.join("\n").trim();
      if (code) {
        htmlParts.push(
          `<pre><code class="language-python">${escHtml(code)}</code></pre>`
        );
      }
      codeLines = [];
    }
    inCodeBlock = false;
  };

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${listType}>`);
      inList = false;
      listType = "";
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip pure whitespace
    if (!trimmed) {
      if (inCodeBlock) {
        // Look ahead: if next non-empty line is also code, keep the blank
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && (PYTHON_CODE_START.test(lines[j].trim()) || lines[j].startsWith("    "))) {
          codeLines.push("");
        } else {
          flushCode();
        }
      } else {
        closeList();
        pendingBlank = true;
      }
      continue;
    }

    // Detect code block start
    if (!inCodeBlock && PYTHON_CODE_START.test(trimmed)) {
      closeList();
      pendingBlank = false;
      inCodeBlock = true;
      codeLines.push(trimmed);
      continue;
    }

    // If in code block, continue adding lines until we hit blank + non-code line
    if (inCodeBlock) {
      if (
        line.startsWith("    ") ||
        line.startsWith("\t") ||
        PYTHON_CODE_START.test(trimmed) ||
        /^[\s#\(\)\[\]\{\}]/.test(line) ||
        /^[a-z_A-Z]\w*\s*[=\(]/.test(trimmed) // assignments and calls
      ) {
        codeLines.push(trimmed);
        continue;
      } else {
        flushCode();
      }
    }

    // Numbered section heading: "1.1 Fondamenti..." or "1.1.1 Cosa..."
    if (/^\d+\.\d+(\.\d+)?\s+\S/.test(trimmed) && trimmed.length < 100) {
      closeList();
      pendingBlank = false;
      const isSubsection = /^\d+\.\d+\.\d+/.test(trimmed);
      const headingText = trimmed.replace(/^\d+\.\d+(\.\d+)?\s+/, "");
      htmlParts.push(`<h${isSubsection ? 3 : 2}>${escHtml(headingText)}</h${isSubsection ? 3 : 2}>`);
      continue;
    }

    // Known section headings (standalone line matching section words)
    if (SECTION_WORDS.test(trimmed) && trimmed.length < 100 && !trimmed.includes(". ")) {
      // Make sure it's not part of a paragraph (next line is blank or another heading)
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
      if (!nextLine || SECTION_WORDS.test(nextLine) || nextLine.length < 5 || nextLine.startsWith("•")) {
        closeList();
        pendingBlank = false;
        htmlParts.push(`<h2>${escHtml(trimmed)}</h2>`);
        continue;
      }
    }

    // Perché/Cos'è/Come headings
    if (/^(Cos'è|Perché|Come |Cosa )/i.test(trimmed) && trimmed.length < 80 && !trimmed.includes(". ")) {
      closeList();
      pendingBlank = false;
      htmlParts.push(`<h3>${escHtml(trimmed)}</h3>`);
      continue;
    }

    // Bullet list item
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const item = trimmed.replace(/^[•\-\*]\s+/, "");
      if (!inList || listType !== "ul") {
        closeList();
        htmlParts.push("<ul>");
        inList = true;
        listType = "ul";
      }
      htmlParts.push(`<li>${escHtml(item)}</li>`);
      pendingBlank = false;
      continue;
    }

    // Numbered list item: "1. text" or "2. text"
    if (/^\d+\.\s+\S/.test(trimmed) && trimmed.length < 300 && !(/^\d+\.\d+/.test(trimmed))) {
      const item = trimmed.replace(/^\d+\.\s+/, "");
      if (!inList || listType !== "ol") {
        closeList();
        htmlParts.push("<ol>");
        inList = true;
        listType = "ol";
      }
      htmlParts.push(`<li>${escHtml(item)}</li>`);
      pendingBlank = false;
      continue;
    }

    // Regular paragraph text
    closeList();
    const last = htmlParts[htmlParts.length - 1] || "";
    if (last.startsWith("<p>") && last.endsWith("</p>") && !pendingBlank) {
      // Extend the current paragraph
      htmlParts[htmlParts.length - 1] =
        last.slice(0, -4) + " " + escHtml(trimmed) + "</p>";
    } else {
      htmlParts.push(`<p>${escHtml(trimmed)}</p>`);
    }
    pendingBlank = false;
  }

  // Flush any remaining code block
  if (inCodeBlock) flushCode();
  closeList();

  return htmlParts.join("\n");
}

// ─── section splitting ─────────────────────────────────────────────────────────

/**
 * Split chapter text into sections based on known headings.
 * Returns array of { title, text, isExercise }
 */
function normalizeApostrophes(text) {
  // Replace curly/smart apostrophes and quotes with straight ones
  return text
    .replace(/[\u2018\u2019\u02bc]/g, "'") // right single quotation mark → '
    .replace(/[\u201c\u201d]/g, '"');       // curly double quotes → "
}

function splitIntoSections(chapterText, sectionHeadings) {
  // Normalize apostrophes in the chapter text for matching
  const normalizedText = normalizeApostrophes(chapterText);
  const sections = [];

  // Find positions of each section heading in the text
  const positions = [];
  for (const heading of sectionHeadings) {
    // Try to find the heading as a standalone line (may be at start of line)
    // Escape regex special chars
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Allow optional leading page number (e.g., "63 ") or numbered list prefix (e.g., "1. ")
    const re = new RegExp(`(?:^|\\n)(?:\\d+\\.?\\s+)?${escaped}\\s*(?:\\n|$)`, "m");
    const match = re.exec(normalizedText);
    if (match) {
      // Find the actual start of the heading text within the match
      const headingStart = normalizedText.indexOf(heading, match.index);
      positions.push({ index: headingStart, title: heading });
    }
  }

  // Sort by position
  positions.sort((a, b) => a.index - b.index);

  if (positions.length === 0) {
    // No sections found, return the whole chapter as one section
    return [{ title: "Introduzione", text: normalizeApostrophes(chapterText), isExercise: false }];
  }

  // Add text before first section as intro
  const introText = normalizedText.substring(0, positions[0].index).trim();
  if (introText.length > 100) {
    sections.push({ title: "Introduzione", text: introText, isExercise: false });
  }

  // Extract each section (use normalizedText for consistent extraction)
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index + positions[i].title.length;
    const end = i + 1 < positions.length ? positions[i + 1].index : normalizedText.length;
    const sectionText = normalizedText.substring(start, end).trim();
    const isExercise = /esercizi|laboratorio|lab\s*:/i.test(positions[i].title);
    sections.push({
      title: positions[i].title,
      text: sectionText,
      isExercise,
    });
  }

  return sections;
}

// ─── course definition ─────────────────────────────────────────────────────────

const MODULES = [
  {
    title: "Capitolo 1: Introduzione a Python per Archeologi",
    difficulty: "beginner",
    sections: [
      "Fondamenti di Python per Archeologia Digitale",
      "Concetti Base di Python",
      "Gestione degli Errori",
      "Moduli e Librerie",
      "Concetti Python Aggiuntivi per Applicazioni Archeologiche",
      "Esercizi Pratici",
    ],
  },
  {
    title: "Capitolo 2: Introduzione a PyQGIS per Archeologia",
    difficulty: "beginner",
    sections: [
      "Configurazione dell'ambiente PyQGIS",
      "Concetti base di PyQGIS",
      "Operazioni di base con i layer",
      "Sistemi di riferimento delle coordinate",
      "Visualizzazione e simbolizzazione",
      "Analisi spaziale di base",
      "Esportazione dei risultati",
      "Esercizi pratici PyQGIS",
    ],
  },
  {
    title: "Capitolo 3: Analisi Statistiche con PyQGIS",
    difficulty: "intermediate",
    sections: [
      "Statistiche Descrittive di Base",
      "Identificazione e Gestione delle Anomalie",
      "Analisi della Distribuzione Spaziale",
      "Analisi della Densità Spaziale",
      "Nearest Neighbor Analysis (NNA)",
      "Hot Spot Analysis (Analisi dei punti caldi)",
      "Analisi di Autocorrelazione Spaziale",
      "Analisi delle K-funzioni di Ripley",
      "Z-score e Significatività Statistica",
      "Esercizi Pratici",
    ],
  },
  {
    title: "Capitolo 4: Analisi Spaziale Avanzata",
    difficulty: "intermediate",
    sections: [
      "Analisi di Visibilità (Viewshed)",
      "Analisi di Costo-Superficie (Cost Surface Analysis)",
      "Analisi dei Pattern di Insediamento",
      "Analisi Predittiva per l'Archeologia",
      "Analisi della Rete di Trasporto",
      "Analisi delle Aree di Influenza Spaziale",
      "Esercizi pratici",
      "Integrazione dei Risultati delle Analisi Spaziali",
    ],
  },
  {
    title: "Capitolo 5: Sviluppo Plugin QGIS",
    difficulty: "advanced",
    sections: [
      "Creazione di un Plugin Base per l'Archeologia",
      "Implementazione di un Tool per l'Analisi di Visibilità",
      "Integrazione di Strumenti Multipli in un Plugin Completo",
      "Packaging e Distribuzione del Plugin",
      "Esempio di Caso d'Uso Completo",
    ],
  },
  {
    title: "Tips and Tricks: Tecniche Avanzate",
    difficulty: "advanced",
    sections: [
      "Testing del Codice in Python",
      "Debugging Efficace del Codice Python",
      "Ottimizzazione delle Prestazioni",
      "Gestione Efficiente dei Dati Archeologici",
      "Documentazione e Organizzazione del Codice",
      "Controllo di Versione e Collaborazione",
      "Pubblicazione e Condivisione di Strumenti Archeologici",
    ],
  },
  {
    title: "Glossario e Riferimenti",
    difficulty: "beginner",
    sections: [],
  },
];

// ─── chapter text anchors ──────────────────────────────────────────────────────
// These are unique phrases that appear at the start of each chapter's body
// (NOT in the TOC or page headers)

// NOTE: In the PDF, the order is Ch1→Ch2→Ch3→Ch4→Ch5→Glossario→Tips.
// We reorder them here to match the MODULES array (Ch1-5, Tips, Glossario).
// The anchor search uses these to find the START of each chapter's body text.
const CHAPTER_BODY_ANCHORS = [
  "Fondamenti di Python per Archeologia Digitale\nPerché Python",         // Ch1
  "Con il secondo capitolo, entriamo nel",                                 // Ch2
  "Il terzo capitolo del",                                                 // Ch3
  "Il quarto capitolo",                                                    // Ch4
  "Il quinto e ultimo capitolo",                                           // Ch5
  "Questo capitolo supplementare",                                         // Tips (pages 189-203, comes AFTER Glossario in PDF)
  "Glossario di Termini Tecnici e Metodi Statistici per\nPyQGIS in Archeologia\nTermini di Programmazione", // Glossario body
];

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pdfPath =
    process.argv[2] || "/Users/enzo/Downloads/PythonPerArcheologia.pdf";

  console.log("\nReading PDF:", pdfPath);
  const pdfData = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: pdfData, verbosity: 0 });
  await parser.load();
  const result = await parser.getText({});
  const fullText = result.text;
  console.log("PDF loaded. Total length:", fullText.length, "chars");

  // ── Find chapter body start positions ─────────────────────────────────────
  const chapterPositions = CHAPTER_BODY_ANCHORS.map((anchor, i) => {
    const idx = fullText.indexOf(anchor);
    if (idx === -1) {
      console.warn(`WARNING: Chapter ${i + 1} anchor not found: "${anchor.substring(0, 40)}"`);
    }
    return idx;
  });

  console.log(
    "Chapter positions:",
    chapterPositions.map((p, i) => `${MODULES[i]?.title?.split(":")[0] || "Module" + (i+1)}: char ${p}`)
  );

  // Sort all positions to find the correct end of each chapter.
  // The PDF physical order is: Ch1, Ch2, Ch3, Ch4, Ch5, Glossario, Tips
  // but our MODULES array order is:   Ch1, Ch2, Ch3, Ch4, Ch5, Tips, Glossario
  // So we find each chapter's end by using the globally-next position in PDF order.
  const sortedPositions = chapterPositions
    .map((pos, idx) => ({ pos, idx }))
    .filter(({ pos }) => pos !== -1)
    .sort((a, b) => a.pos - b.pos);

  // Build a map: moduleIndex -> { start, end }
  const chapterBounds = new Map();
  for (let si = 0; si < sortedPositions.length; si++) {
    const { pos: start, idx } = sortedPositions[si];
    const nextEntry = sortedPositions[si + 1];
    const end = nextEntry ? nextEntry.pos : fullText.length;
    chapterBounds.set(idx, { start, end });
  }

  // Extract chapter texts
  const chapterTexts = [];
  for (let i = 0; i < CHAPTER_BODY_ANCHORS.length; i++) {
    if (chapterPositions[i] === -1) {
      console.warn(`Chapter ${i + 1} not found! Using empty text.`);
      chapterTexts.push("");
      continue;
    }
    const bounds = chapterBounds.get(i);
    chapterTexts.push(fullText.substring(bounds.start, bounds.end));
    console.log(`  Ch${i + 1} extracted: ${chapterTexts[i].length} chars (pos ${bounds.start}-${bounds.end})`);
  }

  // ── Delete existing course ──────────────────────────────────────────────────
  const courseSlug = "python-archeologi";
  const existing = await prisma.interactiveCourse.findUnique({
    where: { slug: courseSlug },
  });
  if (existing) {
    console.log("\nDeleting existing course...");
    await prisma.interactiveCourse.delete({ where: { slug: courseSlug } });
  }

  // ── Create course ───────────────────────────────────────────────────────────
  const course = await prisma.interactiveCourse.create({
    data: {
      title: "Python per Archeologi",
      slug: courseSlug,
      description:
        "Manuale pratico di Python e PyQGIS per l'Archeologia. Dalla sintassi di base fino allo sviluppo di plugin QGIS avanzati, con esempi e esercizi applicati all'analisi dei dati di scavo, alla statistica spaziale e alla creazione di strumenti GIS professionali.",
      category: "python",
      difficulty: "beginner",
      published: true,
      order: 2,
    },
  });
  console.log(`\nCreated course: ${course.title} (${course.id})`);

  const usedSlugs = new Set();
  let totalLessons = 0;

  // ── Create modules and lessons ─────────────────────────────────────────────
  for (let mi = 0; mi < MODULES.length; mi++) {
    const modDef = MODULES[mi];
    const chapterText = chapterTexts[mi] || "";

    const module = await prisma.interactiveModule.create({
      data: {
        title: modDef.title,
        order: mi + 1,
        courseId: course.id,
      },
    });
    console.log(`\n  Module ${mi + 1}: ${module.title}`);

    // Handle Glossario separately (last module, index 6)
    if (mi === 6) {
      const html = textToHtml(normalizeApostrophes(chapterText));
      const slug = ensureUniqueSlug("python-archeologi-glossario", usedSlugs);
      await prisma.interactiveLesson.create({
        data: {
          title: "Glossario dei Termini",
          slug,
          type: "lesson",
          content: html,
          order: ++totalLessons,
          moduleId: module.id,
        },
      });
      console.log(`    Lesson: Glossario dei Termini`);
      continue;
    }

    // Split chapter into sections
    const sections = splitIntoSections(chapterText, modDef.sections);

    if (sections.length === 0) {
      // Fallback: create one lesson from the whole chapter
      const html = textToHtml(chapterText);
      const slug = ensureUniqueSlug(`python-cap${mi + 1}`, usedSlugs);
      await prisma.interactiveLesson.create({
        data: {
          title: modDef.title,
          slug,
          type: "lesson",
          content: html,
          order: ++totalLessons,
          moduleId: module.id,
        },
      });
      console.log(`    Lesson (full chapter): ${modDef.title}`);
      continue;
    }

    for (const section of sections) {
      const html = textToHtml(section.text);
      const lessonType = section.isExercise ? "lab" : "lesson";
      const slugBase = slugify(
        `python-c${mi + 1}-${section.title.substring(0, 40)}`
      );
      const slug = ensureUniqueSlug(slugBase, usedSlugs);

      await prisma.interactiveLesson.create({
        data: {
          title: section.title,
          slug,
          type: lessonType,
          content: html,
          order: ++totalLessons,
          moduleId: module.id,
        },
      });
      console.log(
        `    ${lessonType === "lab" ? "Lab" : "Lesson"}: ${section.title} (${section.text.length} chars → ${html.length} html chars)`
      );
    }
  }

  console.log(
    `\nDone! Created ${totalLessons} lessons/labs across ${MODULES.length} modules.`
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
