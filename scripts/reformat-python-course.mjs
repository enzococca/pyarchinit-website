/**
 * Reformat Python course - fix the split of "Concetti Base di Python" lesson.
 *
 * The first run had two issues:
 * 1. "Funzioni" was matched at "Funzioni numeriche comuni" inside Numeri section
 *    -> python-c1-funzioni incorrectly contains: math functions + all strings content
 * 2. "Stringhe (str)" was inside a code block so it wasn't found as a heading
 *    -> strings content is missing as standalone lesson
 * 3. "Comprensione di Liste" lesson actually contains: comprehensions + all def/funzioni content
 *
 * This script fixes all of that by working on what's currently in the DB.
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/reformat-python-course.mjs
 */

import { PrismaClient } from "@prisma/client";

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

/**
 * Extract the math functions part from the wrong "Funzioni" lesson.
 * This is the content from the start up to (but not including) the Stringhe section.
 * The Stringhe content starts right after the big code block ending with "Stringhe (str)"
 * inside the <pre><code> block.
 */
function extractMathFunctionsFromWrongLesson(content) {
  // The content starts with <h2>Funzioni</h2> and ends at the strings section
  // "Stringhe (str)" appears at the END of a code block: "...print(distanza)\nStringhe (str)</code></pre>"
  // After that code block comes strings content starting with <p>Le stringhe sono...

  // Find the point where strings content begins: after the code block that ends with Stringhe (str)
  const stringsMarker = "Le stringhe sono sequenze di caratteri";
  const stringsIdx = content.indexOf(stringsMarker);

  if (stringsIdx === -1) {
    console.warn("Could not find strings marker!");
    return { mathFunctions: content, strings: "" };
  }

  // Go back to find the start of the <p> tag before "Le stringhe"
  // There's a </pre> + newline + <p> before it
  const pTagBefore = content.lastIndexOf("<p>", stringsIdx);

  const mathPart = content.substring(0, pTagBefore).trim();
  const stringsPart = content.substring(pTagBefore).trim();

  return { mathFunctions: mathPart, strings: stringsPart };
}

/**
 * Extract the "Funzioni" (def) content from the wrong "Comprensione di Liste" lesson.
 * Comprehensions end before "Funzioni Le funzioni consentono di raggruppare..."
 */
function splitComprensioneAndFunzioni(content) {
  // Find "Funzioni" paragraph that starts the functions section
  // It appears as: <p>Funzioni Le funzioni consentono di raggruppare...
  const funzioniMarker = "<p>Funzioni Le funzioni consentono di raggruppare";
  const funzioniIdx = content.indexOf(funzioniMarker);

  if (funzioniIdx === -1) {
    console.warn("Could not find Funzioni marker in Comprensione!");
    return { comprehensions: content, funzioni: "" };
  }

  const comprehensionsPart = content.substring(0, funzioniIdx).trim();
  // The funzioni part starts with the <p> containing "Funzioni Le funzioni..."
  // We want to turn that into proper content
  let funzioniPart = content.substring(funzioniIdx).trim();

  // Fix the first paragraph: remove "Funzioni " prefix (it becomes part of the h2 title)
  funzioniPart = funzioniPart.replace(
    "<p>Funzioni Le funzioni consentono di raggruppare",
    "<p>Le funzioni consentono di raggruppare"
  );

  return { comprehensions: comprehensionsPart, funzioni: funzioniPart };
}

/**
 * Build a clean Stringhe lesson from the strings content extracted from the wrong funzioni lesson.
 */
function buildStringheLesson(stringsContent) {
  // stringsContent starts with <p>Le stringhe sono...
  // We need to add an h2 heading
  return `<h2>Tipi di Dati: Stringhe</h2>\n${stringsContent}`;
}

/**
 * Build the math functions additional content to append to Tipi di Dati: Numeri.
 * The math functions part starts with <h2>Funzioni</h2><p>numeriche comuni:...
 * We need to fix that heading to be a sub-section of Numeri.
 */
function buildMathFunctionsAddition(mathContent) {
  // Remove the incorrect h2 heading
  let fixed = mathContent
    .replace("<h2>Funzioni</h2>", "")
    .replace("<p>numeriche comuni:</p>", "<h3>Funzioni numeriche comuni</h3>")
    .trim();

  // The code block ends with "Stringhe (str)" at the end - clean that up
  // It's inside a <pre><code> block as part of the last line
  fixed = fixed.replace(/\nStringhe \(str\)<\/code><\/pre>$/, "</code></pre>");
  fixed = fixed.replace(/Stringhe \(str\)\s*<\/code><\/pre>/, "</code></pre>");

  return fixed;
}

/**
 * Clean up artifacts from lesson content.
 */
function cleanContent(html) {
  return html
    .replace(/<h2>Concetti Base di Python\s+\d+<\/h2>/g, "")
    .replace(/<p>\s*:\s*Introduzione a Python per Archeologi\s*<\/p>/g, "")
    .replace(/<pre><code(?!\s+class)>/g, '<pre><code class="language-python">')
    .trim();
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Fix Python Course Lesson Split ===\n");

  // Find module 1
  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: "python-archeologi" },
  });
  if (!course) throw new Error("Course not found!");

  const module1 = await prisma.interactiveModule.findFirst({
    where: { courseId: course.id, order: 1 },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!module1) throw new Error("Module 1 not found!");

  console.log("Current module 1 lessons:");
  for (const l of module1.lessons) {
    console.log(`  ${l.order}. ${l.title} (${l.content.length} chars) [${l.slug}]`);
  }

  // Get the lessons we need to fix
  const wrongFunzioni = module1.lessons.find(l => l.slug === "python-c1-funzioni");
  const wrongComprensione = module1.lessons.find(l => l.slug === "python-c1-comprensione-di-liste");
  const tipiNumeri = module1.lessons.find(l => l.slug === "python-c1-tipi-di-dati-numeri");

  if (!wrongFunzioni) throw new Error("python-c1-funzioni not found!");
  if (!wrongComprensione) throw new Error("python-c1-comprensione-di-liste not found!");
  if (!tipiNumeri) throw new Error("python-c1-tipi-di-dati-numeri not found!");

  // ── Step 1: Extract content from the wrong "Funzioni" lesson ────────────────
  console.log("\nStep 1: Extracting from wrong 'Funzioni' lesson...");
  const { mathFunctions, strings } = extractMathFunctionsFromWrongLesson(wrongFunzioni.content);
  console.log(`  Math functions part: ${mathFunctions.length} chars`);
  console.log(`  Strings part: ${strings.length} chars`);

  // ── Step 2: Append math functions to Tipi di Dati: Numeri ───────────────────
  console.log("\nStep 2: Updating 'Tipi di Dati: Numeri' with math functions...");
  const mathAddition = buildMathFunctionsAddition(mathFunctions);
  const updatedNumeriContent = cleanContent(tipiNumeri.content + "\n" + mathAddition);
  await prisma.interactiveLesson.update({
    where: { id: tipiNumeri.id },
    data: { content: updatedNumeriContent },
  });
  console.log(`  Updated Numeri lesson: ${updatedNumeriContent.length} chars`);

  // ── Step 3: Delete the wrong "Funzioni" lesson ───────────────────────────────
  console.log("\nStep 3: Deleting wrong 'Funzioni' lesson...");
  await prisma.interactiveLesson.delete({ where: { id: wrongFunzioni.id } });

  // ── Step 4: Extract comprehensions and real funzioni from wrong "Comprensione" ──
  console.log("\nStep 4: Splitting 'Comprensione di Liste' lesson...");
  const { comprehensions, funzioni: funzioniContent } = splitComprensioneAndFunzioni(wrongComprensione.content);
  console.log(`  Comprehensions part: ${comprehensions.length} chars`);
  console.log(`  Funzioni part: ${funzioniContent.length} chars`);

  // ── Step 5: Update the "Comprensione" lesson with just comprehensions ────────
  console.log("\nStep 5: Updating 'Comprensione di Liste' lesson...");
  const cleanedComprensione = cleanContent(comprehensions);
  await prisma.interactiveLesson.update({
    where: { id: wrongComprensione.id },
    data: { content: cleanedComprensione },
  });
  console.log(`  Updated Comprensione lesson: ${cleanedComprensione.length} chars`);

  // ── Step 6: Create the "Tipi di Dati: Stringhe" lesson ──────────────────────
  console.log("\nStep 6: Creating 'Tipi di Dati: Stringhe' lesson...");
  const stringheHtml = cleanContent(buildStringheLesson(strings));
  // This lesson goes after Numeri (order 3) and before Liste (order 4/5)
  // We need to insert at order 4 and shift everything else

  // ── Step 7: Create the proper "Funzioni" lesson ──────────────────────────────
  console.log("\nStep 7: Creating proper 'Funzioni' lesson...");
  const funzioniHtml = cleanContent(`<h2>Funzioni</h2>\n${funzioniContent}`);

  // ── Step 8: Reorder all lessons properly ────────────────────────────────────
  // Get current state of module 1 lessons (after deletions/updates)
  const currentLessons = await prisma.interactiveLesson.findMany({
    where: { moduleId: module1.id },
    orderBy: { order: "asc" },
    select: { id: true, title: true, slug: true, order: true },
  });

  console.log("\nCurrent lessons after fixes:");
  for (const l of currentLessons) {
    console.log(`  ${l.order}. ${l.title} [${l.slug}]`);
  }

  // Target order:
  // 1. Fondamenti di Python per Archeologia Digitale
  // 2. Variabili e Assegnazione
  // 3. Tipi di Dati: Numeri
  // 4. Tipi di Dati: Stringhe (NEW)
  // 5. Tipi di Dati: Liste
  // 6. Tipi di Dati: Tuple, Set, None, Booleani
  // 7. Strutture di Controllo
  // 8. Cicli
  // 9. Comprensione di Liste
  // 10. Funzioni (NEW)
  // 11. Gestione degli Errori
  // 12. Moduli e Librerie
  // 13. Concetti Python Aggiuntivi per Applicazioni Archeologiche
  // 14. Esercizi Pratici

  const ORDER_MAP = [
    "python-c1-fondamenti-di-python-per-archeologia-dig",
    "python-c1-variabili-e-assegnazione",
    "python-c1-tipi-di-dati-numeri",
    // Stringhe will be inserted at order 4
    "python-c1-tipi-di-dati-liste",
    "python-c1-tipi-di-dati-tuple-set-none-booleani",
    "python-c1-strutture-di-controllo",
    "python-c1-cicli",
    "python-c1-comprensione-di-liste",
    // Funzioni will be inserted after comprensione
    "python-c1-gestione-degli-errori",
    "python-c1-moduli-e-librerie",
    "python-c1-concetti-python-aggiuntivi-per-applicazi",
    "python-c1-esercizi-pratici",
  ];

  // First, create the new lessons
  console.log("\nCreating 'Tipi di Dati: Stringhe' lesson...");
  const stringheLesson = await prisma.interactiveLesson.create({
    data: {
      title: "Tipi di Dati: Stringhe",
      slug: "python-c1-tipi-di-dati-stringhe",
      type: "lesson",
      content: stringheHtml,
      order: 999, // temp
      moduleId: module1.id,
    },
  });
  console.log(`  Created: ${stringheLesson.title} (${stringheHtml.length} chars)`);

  console.log("Creating proper 'Funzioni' lesson...");
  const funzioniLesson = await prisma.interactiveLesson.create({
    data: {
      title: "Funzioni",
      slug: "python-c1-funzioni-def",
      type: "lesson",
      content: funzioniHtml,
      order: 998, // temp
      moduleId: module1.id,
    },
  });
  console.log(`  Created: ${funzioniLesson.title} (${funzioniHtml.length} chars)`);

  // Now reorder all lessons
  console.log("\nReordering all module 1 lessons...");

  // Final ordered list of slugs
  const finalOrder = [
    "python-c1-fondamenti-di-python-per-archeologia-dig",
    "python-c1-variabili-e-assegnazione",
    "python-c1-tipi-di-dati-numeri",
    "python-c1-tipi-di-dati-stringhe",
    "python-c1-tipi-di-dati-liste",
    "python-c1-tipi-di-dati-tuple-set-none-booleani",
    "python-c1-strutture-di-controllo",
    "python-c1-cicli",
    "python-c1-comprensione-di-liste",
    "python-c1-funzioni-def",
    "python-c1-gestione-degli-errori",
    "python-c1-moduli-e-librerie",
    "python-c1-concetti-python-aggiuntivi-per-applicazi",
    "python-c1-esercizi-pratici",
  ];

  // Get all current lessons
  const allLessons = await prisma.interactiveLesson.findMany({
    where: { moduleId: module1.id },
    select: { id: true, slug: true, title: true },
  });

  const lessonBySlug = {};
  for (const l of allLessons) {
    lessonBySlug[l.slug] = l;
  }

  for (let i = 0; i < finalOrder.length; i++) {
    const slug = finalOrder[i];
    const lesson = lessonBySlug[slug];
    if (!lesson) {
      console.warn(`  WARNING: Lesson ${slug} not found!`);
      continue;
    }
    await prisma.interactiveLesson.update({
      where: { id: lesson.id },
      data: { order: i + 1 },
    });
    console.log(`  ${i + 1}. ${lesson.title}`);
  }

  // ── Final verification ──────────────────────────────────────────────────────
  console.log("\n=== Final Module 1 Structure ===");
  const finalLessons = await prisma.interactiveLesson.findMany({
    where: { moduleId: module1.id },
    orderBy: { order: "asc" },
    select: { order: true, title: true, slug: true, content: true },
  });

  for (const l of finalLessons) {
    const startsWithH2 = l.content.trimStart().startsWith("<h2>");
    console.log(
      `  ${l.order}. ${l.title} (${l.content.length} chars) [h2: ${startsWithH2 ? "✓" : "✗"}]`
    );
  }

  console.log(`\nDone! Module 1 now has ${finalLessons.length} lessons.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
