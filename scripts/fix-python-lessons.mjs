/**
 * Fix Python course code blocks and content in Supabase DB.
 *
 * Problems fixed:
 * 1. Consecutive code blocks that depend on each other → merged
 * 2. Code blocks using undefined variables → definitions prepended
 * 3. Duplicate headings removed
 * 4. Naming conventions formatted as proper lists
 * 5. PDF artifacts cleaned up
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/fix-python-lessons.mjs
 */

import pg from "pg";
const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.cygykmizdjusppwlpwwv:bybbeh-8dawqu-racTaj@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Default archaeological variable definitions ─────────────────────────────

const DEFAULT_VARS = {
  nome_sito: `nome_sito = "Villa dei Papiri"`,
  anno_scavo: `anno_scavo = 2023`,
  profondita_strato: `profondita_strato = 125.5`,
  coordinate_gps: `coordinate_gps = (40.805, 14.348)`,
  codice_us: `codice_us = "US1042"`,
  descrizione: `descrizione = "Strato di abbandono con tracce di incendio"`,
  reperti: `reperti = ["anfora", "moneta", "ceramica", "osso", "vetro"]`,
  quote: `quote = [123.45, 123.67, 123.89, 124.01]`,
  reperto: `reperto = {"id": 1, "tipo": "ceramica", "classe": "terra sigillata", "periodo": "II sec. d.C.", "coordinate": (41.902782, 12.496366), "integro": False}`,
  numero_reperti: `numero_reperti = 42`,
  area_scavo: `area_scavo = 150`,
  quota_superiore: `quota_superiore = 125.6`,
  quota_inferiore: `quota_inferiore = 123.4`,
  // Additional common variables
  x: `x = 10`,
  y: `y = 5`,
  z: `z = 3`,
  a: `a = 7`,
  b: `b = 3`,
  n: `n = 10`,
  nome: `nome = "Marco"`,
  eta: `eta = 35`,
  lista: `lista = [1, 2, 3, 4, 5]`,
  numeri: `numeri = [1, 2, 3, 4, 5]`,
  risultato: `risultato = 42`,
  messaggio: `messaggio = "Benvenuto allo scavo"`,
  temperatura: `temperatura = 22.5`,
  testo: `testo = "Archeologia digitale"`,
  parola: `parola = "archeologia"`,
  frase: `frase = "Lo scavo ha rivelato reperti importanti"`,
  dati: `dati = [1.2, 3.4, 5.6, 7.8]`,
  valori: `valori = [10, 20, 30, 40, 50]`,
  dizionario: `dizionario = {"chiave": "valore", "tipo": "ceramica"}`,
  contatore: `contatore = 0`,
  totale: `totale = 100`,
  media: `media = 25.5`,
  larghezza: `larghezza = 10`,
  lunghezza: `lunghezza = 15`,
  altezza: `altezza = 3`,
  profondita: `profondita = 2.5`,
  nome_reperto: `nome_reperto = "Anfora"`,
  tipo_reperto: `tipo_reperto = "ceramica"`,
  sito: `sito = {"nome": "Villa dei Papiri", "anno": 2023, "coordinate": (40.805, 14.348)}`,
  strato: `strato = {"id": "US1042", "profondita": 125.5, "tipo": "abbandono"}`,
  catalogo: `catalogo = [{"id": 1, "tipo": "ceramica"}, {"id": 2, "tipo": "moneta"}]`,
  us: `us = "US1042"`,
  materiale: `materiale = "ceramica"`,
  periodo: `periodo = "II sec. d.C."`,
  distanza: `distanza = 15.7`,
};

// ─── HTML entity decode/encode helpers ───────────────────────────────────────

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function encodeHtmlEntities(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Python variable analysis ────────────────────────────────────────────────

/**
 * Extract variable names that are DEFINED (assigned) in a Python code block.
 */
function extractDefinedVars(code) {
  const defined = new Set();

  // Simple assignments: var = ...
  const assignRe = /^[ \t]*([a-zA-Z_]\w*)\s*=[^=]/gm;
  let m;
  while ((m = assignRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // Augmented assignments: var += / -= / *= etc.
  const augRe = /^[ \t]*([a-zA-Z_]\w*)\s*[+\-*/%]=\s/gm;
  while ((m = augRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // for var in ...:
  const forRe = /^[ \t]*for\s+([a-zA-Z_]\w*)\s+in\s/gm;
  while ((m = forRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // for key, value in ...:
  const forKVRe = /^[ \t]*for\s+([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s+in\s/gm;
  while ((m = forKVRe.exec(code)) !== null) {
    defined.add(m[1]);
    defined.add(m[2]);
  }

  // def func_name(...):
  const defRe = /^[ \t]*def\s+([a-zA-Z_]\w*)\s*\(/gm;
  while ((m = defRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // class ClassName:
  const classRe = /^[ \t]*class\s+([a-zA-Z_]\w*)/gm;
  while ((m = classRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // import module / from module import name
  const importRe = /^[ \t]*import\s+([a-zA-Z_]\w*)/gm;
  while ((m = importRe.exec(code)) !== null) {
    defined.add(m[1]);
  }
  const fromImportRe = /^[ \t]*from\s+\S+\s+import\s+(.+)/gm;
  while ((m = fromImportRe.exec(code)) !== null) {
    const names = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop().trim());
    for (const n of names) {
      if (/^[a-zA-Z_]\w*$/.test(n)) defined.add(n);
    }
  }

  // with ... as var:
  const withRe = /^[ \t]*with\s+.+\s+as\s+([a-zA-Z_]\w*)/gm;
  while ((m = withRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // except ... as var:
  const exceptRe = /except\s+\w+\s+as\s+([a-zA-Z_]\w*)/gm;
  while ((m = exceptRe.exec(code)) !== null) {
    defined.add(m[1]);
  }

  // Tuple/list unpacking: a, b = ...
  const unpackRe = /^[ \t]*([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)+)\s*=/gm;
  while ((m = unpackRe.exec(code)) !== null) {
    const names = m[1].split(",").map((s) => s.trim());
    for (const n of names) {
      if (/^[a-zA-Z_]\w*$/.test(n)) defined.add(n);
    }
  }

  // Function parameters (def foo(x, y):)
  const paramRe = /^[ \t]*def\s+\w+\s*\(([^)]*)\)/gm;
  while ((m = paramRe.exec(code)) !== null) {
    const params = m[1].split(",").map((s) => s.trim().split("=")[0].split(":")[0].trim());
    for (const p of params) {
      if (/^[a-zA-Z_]\w*$/.test(p) && p !== "") defined.add(p);
    }
  }

  return defined;
}

/**
 * Extract variable names that are USED (referenced) in a Python code block.
 * We look for identifiers that appear outside of string literals and comments.
 */
function extractUsedVars(code) {
  const used = new Set();

  // Python builtins and keywords to ignore
  const BUILTINS = new Set([
    "print", "len", "range", "str", "int", "float", "bool", "list", "dict",
    "set", "tuple", "type", "isinstance", "input", "open", "file", "sum",
    "min", "max", "abs", "round", "sorted", "reversed", "enumerate", "zip",
    "map", "filter", "any", "all", "id", "hex", "oct", "bin", "chr", "ord",
    "format", "repr", "hash", "dir", "help", "vars", "globals", "locals",
    "super", "property", "staticmethod", "classmethod", "object",
    "True", "False", "None", "self", "cls",
    "if", "elif", "else", "for", "while", "in", "not", "and", "or", "is",
    "def", "class", "return", "yield", "import", "from", "as", "with",
    "try", "except", "finally", "raise", "pass", "break", "continue",
    "del", "assert", "lambda", "global", "nonlocal",
    "math", "os", "sys", "json", "csv", "datetime", "re", "random",
    "collections", "itertools", "functools", "pathlib", "typing",
    "numpy", "np", "pandas", "pd", "matplotlib", "plt",
    "Exception", "ValueError", "TypeError", "KeyError", "IndexError",
    "FileNotFoundError", "ZeroDivisionError", "AttributeError",
    "RuntimeError", "StopIteration", "IOError", "OSError",
    "append", "extend", "insert", "remove", "pop", "clear", "index",
    "count", "sort", "reverse", "copy", "keys", "values", "items",
    "get", "update", "setdefault", "upper", "lower", "strip", "split",
    "join", "replace", "find", "startswith", "endswith", "format",
    "encode", "decode", "read", "write", "close", "seek",
    "add", "discard", "union", "intersection", "difference",
    "pi", "sqrt", "sin", "cos", "tan", "log", "exp", "ceil", "floor",
    "radians", "degrees", "hypot", "atan2", "pow",
    "sleep", "time", "path",
    // Common method names
    "risultato", // when used as result = func(), not standalone
    "processing", "iface", "QgsVectorLayer", "QgsRasterLayer", "QgsProject",
    "qgis", "PyQt5", "QWidget", "QDialog",
    "_", "i", "j", "k", "e", "f", "r", "s", "t", "v", "w", "p", "c", "d",
  ]);

  // Strip string literals and comments to avoid false positives
  let stripped = code
    // Remove triple-quoted strings
    .replace(/"""[\s\S]*?"""/g, '""')
    .replace(/'''[\s\S]*?'''/g, "''")
    // Remove single-line strings
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    // Remove comments
    .replace(/#.*$/gm, "");

  // Find all identifiers
  const identRe = /\b([a-zA-Z_]\w*)\b/g;
  let m;
  while ((m = identRe.exec(stripped)) !== null) {
    const name = m[1];
    if (!BUILTINS.has(name) && name.length > 1) {
      used.add(name);
    }
  }

  return used;
}

/**
 * Find which variables are used but not defined in a code block,
 * and return the definition lines to prepend.
 */
function getMissingVarDefs(code) {
  const defined = extractDefinedVars(code);
  const used = extractUsedVars(code);
  const missing = [];

  for (const varName of used) {
    if (!defined.has(varName) && DEFAULT_VARS[varName]) {
      missing.push(DEFAULT_VARS[varName]);
    }
  }

  return missing;
}

// ─── HTML content fixes ──────────────────────────────────────────────────────

/**
 * Fix 1: Merge consecutive code blocks that depend on each other.
 *
 * Two <pre><code class="language-python"> blocks separated only by
 * whitespace or empty <p></p> tags get merged into one block.
 */
function mergeConsecutiveCodeBlocks(html) {
  // Pattern: end of one code block, optional whitespace/empty paragraphs, start of next
  const mergeRe =
    /<\/code><\/pre>\s*(?:<p>\s*<\/p>\s*)*<pre><code class="language-python">/g;

  let merged = html;
  let prevLength;
  // Iterate until no more merges happen
  do {
    prevLength = merged.length;
    merged = merged.replace(mergeRe, "\n\n");
  } while (merged.length !== prevLength);

  return merged;
}

/**
 * Fix 2: Make each code block self-contained by adding missing variable definitions.
 */
function fixCodeBlockVariables(html) {
  const codeBlockRe = /<pre><code class="language-python">([\s\S]*?)<\/code><\/pre>/g;

  return html.replace(codeBlockRe, (fullMatch, codeContent) => {
    const code = decodeHtmlEntities(codeContent);
    const missingDefs = getMissingVarDefs(code);

    if (missingDefs.length === 0) {
      return fullMatch;
    }

    // Prepend definitions with a comment
    const defsBlock = `# Dati di esempio\n${missingDefs.join("\n")}\n\n`;
    const newCode = defsBlock + code;
    return `<pre><code class="language-python">${encodeHtmlEntities(newCode)}</code></pre>`;
  });
}

/**
 * Fix 3: Remove duplicate headings.
 * If content starts with <h2>Title</h2> followed by a <p> that repeats the same title.
 */
function removeDuplicateHeadings(html) {
  // Pattern: <h2>Title</h2> followed by <p>Title</p> or <p>Title text...</p> where "Title" matches
  const h2Re = /<h2>([^<]+)<\/h2>\s*<p>\1(?:\s*<\/p>|[^<]*<\/p>)/g;
  let fixed = html.replace(h2Re, (match, title) => {
    // Keep only the h2
    return `<h2>${title}</h2>`;
  });

  // Also handle: <h2>Title</h2>\n<p>Title</p>
  fixed = fixed.replace(/<h2>([^<]+)<\/h2>\s*<p>\1<\/p>/g, "<h2>$1</h2>");

  return fixed;
}

/**
 * Fix 4: Format naming conventions and similar lists properly.
 * Convert patterns like:
 *   <p><strong>snake_case</strong>: per variabili...</p>
 *   <p><strong>CamelCase</strong>: per classi...</p>
 * into <ul><li> lists.
 */
function formatConventionLists(html) {
  // Find sequences of <p><strong>...</strong>: ...</p> (3+ in a row = likely a list)
  const conventionPattern =
    /(?:<p><strong>[^<]+<\/strong>\s*:\s*[^<]*<\/p>\s*){3,}/g;

  return html.replace(conventionPattern, (match) => {
    const itemRe = /<p><strong>([^<]+)<\/strong>\s*:\s*([^<]*)<\/p>/g;
    let items = [];
    let m;
    while ((m = itemRe.exec(match)) !== null) {
      items.push(`<li><strong>${m[1]}</strong>: ${m[2]}</li>`);
    }
    if (items.length > 0) {
      return `<ul>\n${items.join("\n")}\n</ul>`;
    }
    return match;
  });
}

/**
 * Fix 4b: Bold text acting as sub-headings → <h3>
 * Pattern: <p><strong>Title Text</strong></p> (standalone bold paragraph)
 */
function promoteBoldToH3(html) {
  // Only convert if it's a short standalone bold paragraph (likely a sub-heading)
  return html.replace(
    /<p><strong>([^<]{5,80})<\/strong><\/p>/g,
    (match, text) => {
      // Skip if it looks like regular bold text (contains common words that suggest prose)
      if (/\b(è|sono|viene|può|deve|questo|questa|ogni|nota|attenzione|importante)\b/i.test(text)) {
        return match;
      }
      // Convert to h3 if it looks like a heading (starts with capital, no period at end)
      if (/^[A-Z]/.test(text) && !text.endsWith(".") && !text.endsWith(":")) {
        return `<h3>${text}</h3>`;
      }
      return match;
    }
  );
}

/**
 * Fix 5: Clean up PDF artifacts.
 */
function cleanPdfArtifacts(html) {
  return html
    // Remove ": Introduzione a Python per Archeologi" text
    .replace(/<p>\s*:\s*Introduzione a Python per Archeologi\s*<\/p>/g, "")
    .replace(/:\s*Introduzione a Python per Archeologi/g, "")
    // Remove "Concetti Base di Python 13" page number references
    .replace(/<h2>Concetti Base di Python\s+\d+<\/h2>/g, "")
    .replace(/Concetti Base di Python\s+\d+/g, "Concetti Base di Python")
    // Remove "(continues on next page)" / "(continua dalla pagina precedente)" markers
    .replace(/<p>\s*\(continues on next page\)\s*<\/p>/g, "")
    .replace(/<p>\s*\(continua dalla pagina precedente\)\s*<\/p>/g, "")
    .replace(/\(continues on next page\)/g, "")
    .replace(/\(continua dalla pagina precedente\)/g, "")
    // Remove stray page numbers in paragraphs
    .replace(/<p>\s*\d{1,3}\s*<\/p>/g, "")
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    // Ensure code blocks have language class
    .replace(/<pre><code(?!\s+class)>/g, '<pre><code class="language-python">')
    .trim();
}

/**
 * Apply all fixes to lesson content.
 */
function fixLessonContent(html, title) {
  let fixed = html;

  // Fix 5 first: clean artifacts before other processing
  fixed = cleanPdfArtifacts(fixed);

  // Fix 1: merge consecutive code blocks
  fixed = mergeConsecutiveCodeBlocks(fixed);

  // Fix 2: make code blocks self-contained
  fixed = fixCodeBlockVariables(fixed);

  // Fix 3: remove duplicate headings
  fixed = removeDuplicateHeadings(fixed);

  // Fix 4: format lists and promote bold headings
  fixed = formatConventionLists(fixed);
  fixed = promoteBoldToH3(fixed);

  // Final cleanup
  fixed = fixed.replace(/<p>\s*<\/p>/g, "").replace(/\n{3,}/g, "\n\n").trim();

  return fixed;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Fix Python Course Lessons ===\n");

  const client = await pool.connect();

  try {
    // 1. Find the course
    const courseRes = await client.query(
      `SELECT id, title FROM "InteractiveCourse" WHERE slug = 'python-archeologi'`
    );
    if (courseRes.rows.length === 0) {
      throw new Error("Course 'python-archeologi' not found!");
    }
    const course = courseRes.rows[0];
    console.log(`Course: ${course.title} (${course.id})\n`);

    // 2. Get all modules
    const modulesRes = await client.query(
      `SELECT id, title, "order" FROM "InteractiveModule" WHERE "courseId" = $1 ORDER BY "order"`,
      [course.id]
    );
    console.log(`Found ${modulesRes.rows.length} modules\n`);

    // 3. Get all lessons
    const lessonsRes = await client.query(
      `SELECT l.id, l.title, l.slug, l.content, l."order", l."moduleId", m.title as module_title
       FROM "InteractiveLesson" l
       JOIN "InteractiveModule" m ON l."moduleId" = m.id
       WHERE m."courseId" = $1
       ORDER BY m."order", l."order"`,
      [course.id]
    );
    console.log(`Found ${lessonsRes.rows.length} lessons total\n`);

    let totalFixed = 0;
    let totalMerged = 0;
    let totalVarsFixed = 0;
    let totalDuplicatesRemoved = 0;
    let totalArtifactsCleaned = 0;

    for (const lesson of lessonsRes.rows) {
      const original = lesson.content;
      const fixed = fixLessonContent(original, lesson.title);

      if (fixed !== original) {
        // Count what changed
        const origCodeBlocks = (original.match(/<pre><code/g) || []).length;
        const fixedCodeBlocks = (fixed.match(/<pre><code/g) || []).length;
        const merged = origCodeBlocks - fixedCodeBlocks;
        if (merged > 0) totalMerged += merged;

        const addedDefs = (fixed.match(/# Dati di esempio/g) || []).length;
        totalVarsFixed += addedDefs;

        if (original.length > fixed.length + 50) totalArtifactsCleaned++;
        if (
          original.match(/<h2>[^<]+<\/h2>\s*<p>/g)?.length >
          fixed.match(/<h2>[^<]+<\/h2>\s*<p>/g)?.length
        ) {
          totalDuplicatesRemoved++;
        }

        // Update the lesson
        await client.query(
          `UPDATE "InteractiveLesson" SET content = $1 WHERE id = $2`,
          [fixed, lesson.id]
        );

        totalFixed++;
        console.log(
          `  FIXED: [${lesson.module_title}] ${lesson.title}` +
            ` (${original.length} → ${fixed.length} chars` +
            (merged > 0 ? `, ${merged} blocks merged` : "") +
            (addedDefs > 0 ? `, ${addedDefs} blocks got var defs` : "") +
            `)`
        );
      } else {
        console.log(`  OK:    [${lesson.module_title}] ${lesson.title}`);
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Total lessons processed: ${lessonsRes.rows.length}`);
    console.log(`Lessons fixed: ${totalFixed}`);
    console.log(`Code blocks merged: ${totalMerged}`);
    console.log(`Code blocks with vars added: ${totalVarsFixed}`);
    console.log(`Duplicate headings removed: ${totalDuplicatesRemoved}`);
    console.log(`Artifacts cleaned: ${totalArtifactsCleaned}`);
    console.log("\nDone!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
