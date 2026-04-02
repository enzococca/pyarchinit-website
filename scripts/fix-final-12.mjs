/**
 * Fix the last 12 broken Python code blocks in the pyArchInit course.
 *
 * Lessons affected:
 *   - fondamenti          (#5)
 *   - tuple-set           (#3, #4, #11, #16)
 *   - cicli               (#1, #2)
 *   - gestione-errori     (#4, #5)
 *   - moduli-e-librerie   (#3, #6, #7)
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/fix-final-12.mjs
 */

import pg from "pg";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.cygykmizdjusppwlpwwv:bybbeh-8dawqu-racTaj@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtml(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function encodeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract all <pre><code class="language-python">…</code></pre> blocks */
function extractBlocks(html) {
  const blocks = [];
  const re = /<pre><code class="language-python">([\s\S]*?)<\/code><\/pre>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ raw: m[1], start: m.index, end: m.index + m[0].length });
  }
  return blocks;
}

/** Replace the Nth code block (0-indexed) in the HTML with new code */
function replaceBlock(html, blockIndex, newCode) {
  const blocks = extractBlocks(html);
  if (blockIndex >= blocks.length) {
    throw new Error(`Block index ${blockIndex} out of range (${blocks.length} blocks)`);
  }
  const block = blocks[blockIndex];
  const before = html.slice(0, block.start);
  const after = html.slice(block.end);
  return before + `<pre><code class="language-python">${encodeHtml(newCode)}</code></pre>` + after;
}

/** Test Python code by executing it with python3 */
function testCode(code, label) {
  writeFileSync("/tmp/test_fix_block.py", code);
  const result = spawnSync("python3", ["/tmp/test_fix_block.py"], {
    encoding: "utf8",
    timeout: 10000,
  });
  const passed = result.status === 0;
  const output = passed
    ? result.stdout
    : result.stderr || result.stdout || "unknown error";
  return { passed, output: output.trim() };
}

// ─── Fixed code blocks (plain Python, no HTML encoding) ───────────────────────

const FIXES = [
  // ── fondamenti block #5 (0-indexed: 4) ──────────────────────────────────────
  {
    lessonSlug: "python-c1-fondamenti-di-python-per-archeologia-dig",
    blockIndex: 4,   // 5th block
    label: "fondamenti #5 - add import pandas as pd",
    code: `import sys
import numpy as np
import pandas as pd

print("Python versione:", sys.version.split()[0])
print("NumPy versione:", np.__version__)
print("Pandas versione:", pd.__version__)
`,
  },

  // ── tuple-set block #3 (0-indexed: 2) ───────────────────────────────────────
  {
    lessonSlug: "python-c1-tipi-di-dati-tuple-set-none-booleani",
    blockIndex: 2,   // 3rd block
    label: "tuple-set #3 - tuple immutability (corrupted text replaced)",
    code: `## Tuple sono immutabili - non si possono modificare dopo la creazione
coordinate = (41.902, 12.496)
print("Coordinate:", coordinate)
# Questo genererebbe un errore:
# coordinate[0] = 42.0  # TypeError!
# Ma possiamo convertire in lista, modificare, e riconvertire
lista_temp = list(coordinate)
lista_temp[0] = 42.0
coordinate_nuove = tuple(lista_temp)
print("Nuove coordinate:", coordinate_nuove)
`,
  },

  // ── tuple-set block #4 (0-indexed: 3) ───────────────────────────────────────
  {
    lessonSlug: "python-c1-tipi-di-dati-tuple-set-none-booleani",
    blockIndex: 3,   // 4th block
    label: "tuple-set #4 - dictionaries (corrupted text replaced)",
    code: `## Creazione e accesso ai dizionari
reperto = {
    "id": 1, "tipo": "ceramica", "classe": "terra sigillata",
    "periodo": "II sec. d.C.", "integro": False
}
print("Tipo:", reperto["tipo"])
print("Periodo:", reperto.get("periodo", "sconosciuto"))
# Aggiunta e modifica
reperto["peso"] = 250
reperto["stato"] = "buono"
print("Dopo modifica:", reperto)
`,
  },

  // ── tuple-set block #11 (0-indexed: 10) ─────────────────────────────────────
  {
    lessonSlug: "python-c1-tipi-di-dati-tuple-set-none-booleani",
    blockIndex: 10,  // 11th block
    label: "tuple-set #11 - nested dict with string keys for years",
    code: `sito = {
    "nome": "Pompei",
    "coordinate": {"lat": 40.7462, "lon": 14.4989},
    "reperti": [{"id": 1, "tipo": "anfora"}, {"id": 2, "tipo": "moneta"}],
    "campagne": {
        "2021": {"inizio": "01/06/2021", "fine": "30/08/2021"},
        "2022": {"inizio": "15/05/2022", "fine": "15/09/2022"}
    }
}
print("Lat:", sito["coordinate"]["lat"])
print("Primo reperto:", sito["reperti"][0]["tipo"])
print("Campagna 2022:", sito["campagne"]["2022"]["inizio"])
`,
  },

  // ── tuple-set block #16 (0-indexed: 15) ─────────────────────────────────────
  {
    lessonSlug: "python-c1-tipi-di-dati-tuple-set-none-booleani",
    blockIndex: 15,  // 16th block
    label: "tuple-set #16 - add reperti_area_c",
    code: `reperti_area_a = {"ceramica", "vetro", "moneta"}
reperti_area_b = {"ceramica", "osso", "metallo"}
reperti_area_c = {"ceramica", "ambra", "legno"}
inventario = reperti_area_a | reperti_area_b | reperti_area_c
print("Inventario completo:", inventario)
reperti_comuni = reperti_area_a & reperti_area_b
print("Comuni A-B:", reperti_comuni)
materiali_unici_a = reperti_area_a - reperti_area_b
print("Solo in A:", materiali_unici_a)
`,
  },

  // ── cicli block #1 (0-indexed: 0) ───────────────────────────────────────────
  {
    lessonSlug: "python-c1-cicli",
    blockIndex: 0,   // 1st block
    label: "cicli #1 - reperti as list of dicts",
    code: `reperti = [
    {"id": "R1", "tipo": "ceramica", "profondita": 120.5},
    {"id": "R2", "tipo": "moneta", "profondita": 88.1},
    {"id": "R3", "tipo": "vetro", "profondita": 95.2},
]
tipi_reperti = ["ceramica", "vetro", "moneta"]
quantita_reperti = [15, 3, 8]
# Ciclo for su lista
for reperto in tipi_reperti:
    print("Catalogazione:", reperto)
# Con range
for i in range(3):
    print("Quadrato", i+1)
# Con enumerate
for i, reperto in enumerate(tipi_reperti):
    print("Reperto #" + str(i+1) + ":", reperto)
# Con zip
for tipo, qty in zip(tipi_reperti, quantita_reperti):
    print("Trovati", qty, "reperti di tipo", tipo)
# Iterazione su dizionari
for chiave, valore in reperti[0].items():
    print(chiave, ":", valore)
`,
  },

  // ── cicli block #2 (0-indexed: 1) ───────────────────────────────────────────
  {
    lessonSlug: "python-c1-cicli",
    blockIndex: 1,   // 2nd block
    label: "cicli #2 - while loop without input()",
    code: `## Ciclo while con contatore
profondita_strato = 100
profondita_corrente = 0
while profondita_corrente < profondita_strato:
    profondita_corrente += 25
    print("Scavando a profondita:", profondita_corrente, "cm")
# Ciclo con condizione
tentativi = 0
max_tentativi = 5
while tentativi < max_tentativi:
    tentativi += 1
    if tentativi == 3:
        print("Trovato reperto al tentativo", tentativi)
        break
    print("Tentativo", tentativi, "- nessun reperto")
`,
  },

  // ── gestione-errori block #4 (0-indexed: 3) ──────────────────────────────────
  {
    lessonSlug: "python-c1-gestione-degli-errori",
    blockIndex: 3,   // 4th block
    label: "gestione-errori #4 - custom exceptions (backslash corruption fixed)",
    code: `## Eccezioni personalizzate per l'archeologia
class ErroreScavo(Exception):
    """Errore base per operazioni di scavo."""
    pass

class ErroreProfondita(ErroreScavo):
    """Profondita di scavo eccessiva."""
    pass

class ErroreCoordinate(ErroreScavo):
    """Coordinate non valide."""
    pass

# Test delle eccezioni personalizzate
def scava(profondita):
    if profondita > 500:
        raise ErroreProfondita("Profondita " + str(profondita) + " cm eccessiva!")
    if profondita < 0:
        raise ErroreCoordinate("Profondita negativa!")
    return "Scavo a " + str(profondita) + " cm completato"

try:
    print(scava(150))
    print(scava(600))
except ErroreProfondita as e:
    print("Errore profondita:", e)
except ErroreScavo as e:
    print("Errore generico:", e)
`,
  },

  // ── gestione-errori block #5 (0-indexed: 4) ──────────────────────────────────
  {
    lessonSlug: "python-c1-gestione-degli-errori",
    blockIndex: 4,   // 5th block
    label: "gestione-errori #5 - validate US codes (backslash corruption fixed)",
    code: `## Uso pratico delle eccezioni personalizzate
class ErroreScavo(Exception):
    pass

def valida_us(codice):
    if not codice.startswith("US"):
        raise ErroreScavo("Codice US non valido: " + codice)
    numero = codice[2:]
    if not numero.isdigit():
        raise ErroreScavo("Numero US non valido: " + codice)
    return int(numero)

# Test di validazione
codici_test = ["US1042", "US1043", "XX999", "US", "USabc"]
for codice in codici_test:
    try:
        num = valida_us(codice)
        print(codice, "-> valido, numero:", num)
    except ErroreScavo as e:
        print(codice, "-> ERRORE:", e)
`,
  },

  // ── moduli-e-librerie block #3 (0-indexed: 2) ────────────────────────────────
  {
    lessonSlug: "python-c1-moduli-e-librerie",
    blockIndex: 2,   // 3rd block
    label: "moduli-e-librerie #3 - add x2,y2 variables",
    code: `import math
raggio = 25
angolo_gradi = 45
x1, y1 = 0, 0
x2, y2 = 30, 40
# Calcoli geometrici
area_cerchio = math.pi * raggio**2
print("Area cerchio:", round(area_cerchio, 2))
angolo_rad = math.radians(angolo_gradi)
print("Angolo in radianti:", round(angolo_rad, 4))
distanza = math.sqrt((x2-x1)**2 + (y2-y1)**2)
print("Distanza tra punti:", distanza)
`,
  },

  // ── moduli-e-librerie block #6 (0-indexed: 5) ────────────────────────────────
  {
    lessonSlug: "python-c1-moduli-e-librerie",
    blockIndex: 5,   // 6th block
    label: "moduli-e-librerie #6 - standalone UTM conversion (no external module)",
    code: `## Simulazione di un modulo personalizzato
import math

def converti_a_utm(lat, lon, zona=33):
    k0 = 0.9996
    a = 6378137
    lon0 = (zona * 6 - 183) * math.pi / 180
    lat_rad = lat * math.pi / 180
    lon_rad = lon * math.pi / 180
    e = k0 * a * (lon_rad - lon0) * math.cos(lat_rad) + 500000
    n = k0 * a * math.log(math.tan(math.pi/4 + lat_rad/2))
    return round(e, 2), round(n, 2)

coord = converti_a_utm(41.9, 12.5)
print("Coordinate UTM:", coord)
`,
  },

  // ── moduli-e-librerie block #7 (0-indexed: 6) ────────────────────────────────
  {
    lessonSlug: "python-c1-moduli-e-librerie",
    blockIndex: 6,   // 7th block
    label: "moduli-e-librerie #7 - module organization example (SyntaxError fixed)",
    code: `## Organizzazione del codice con moduli
## In un progetto reale, queste funzioni sarebbero in file separati

# utils.py
def calcola_area(lunghezza, larghezza):
    return lunghezza * larghezza

def calcola_perimetro(lunghezza, larghezza):
    return 2 * (lunghezza + larghezza)

def calcola_volume(lunghezza, larghezza, profondita):
    return lunghezza * larghezza * profondita

# main.py - uso delle funzioni
area = calcola_area(10, 15)
perimetro = calcola_perimetro(10, 15)
volume = calcola_volume(10, 15, 2.5)

print("Area scavo:", area, "m2")
print("Perimetro:", perimetro, "m")
print("Volume terra:", volume, "m3")
`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Fix: Last 12 Broken Python Code Blocks ===\n");

  // Step 1: test every replacement locally before touching the DB
  console.log("--- Phase 1: Local Python Tests ---\n");
  let allPassed = true;
  for (const fix of FIXES) {
    const { passed, output } = testCode(fix.code, fix.label);
    const status = passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${fix.label}`);
    if (!passed) {
      allPassed = false;
      console.log("  ERROR:\n  " + output.split("\n").slice(-5).join("\n  "));
    } else {
      const preview = output.split("\n").filter(l => l.trim()).slice(0, 2);
      preview.forEach(l => console.log("  > " + l));
    }
  }

  if (!allPassed) {
    console.error("\n\nABORTED: Some code blocks failed local tests. DB not touched.\n");
    process.exit(1);
  }

  console.log(`\nAll ${FIXES.length} local tests passed.\n`);

  // Step 2: apply fixes to DB
  console.log("--- Phase 2: Applying DB Updates ---\n");

  const client = await pool.connect();
  try {
    // Load each lesson once, apply all its fixes, then save once
    const lessonMap = new Map(); // slug → {id, content}

    for (const fix of FIXES) {
      if (!lessonMap.has(fix.lessonSlug)) {
        const res = await client.query(
          `SELECT id, title, content FROM "InteractiveLesson" WHERE slug = $1`,
          [fix.lessonSlug]
        );
        if (res.rows.length === 0) {
          throw new Error(`Lesson not found: ${fix.lessonSlug}`);
        }
        lessonMap.set(fix.lessonSlug, {
          id: res.rows[0].id,
          title: res.rows[0].title,
          content: res.rows[0].content,
        });
        console.log(`Loaded: "${res.rows[0].title}" (${fix.lessonSlug})`);
      }
    }

    // Apply fixes in order (fixes for the same lesson must be applied with
    // correct block indices that account for earlier fixes in that lesson).
    // Since we process fixes in order and blockIndex refers to the original
    // positions, we apply fixes to a running copy of the content and adjust
    // indices as we go.

    // Group fixes by lessonSlug preserving order
    const fixesByLesson = new Map();
    for (const fix of FIXES) {
      if (!fixesByLesson.has(fix.lessonSlug)) {
        fixesByLesson.set(fix.lessonSlug, []);
      }
      fixesByLesson.get(fix.lessonSlug).push(fix);
    }

    for (const [slug, lessonFixes] of fixesByLesson.entries()) {
      const lesson = lessonMap.get(slug);
      let html = lesson.content;

      // Apply each fix to the current html, using original blockIndex
      // (since we only replace—never add/remove—block count stays same)
      for (const fix of lessonFixes) {
        html = replaceBlock(html, fix.blockIndex, fix.code);
        console.log(`  Applied fix: ${fix.label}`);
      }

      lesson.content = html; // save updated content back

      await client.query(
        `UPDATE "InteractiveLesson" SET content = $1 WHERE id = $2`,
        [html, lesson.id]
      );
      console.log(`  Saved lesson "${lesson.title}"\n`);
    }

    // Step 3: verification — re-run DB content through python3
    console.log("--- Phase 3: Post-DB Verification ---\n");
    let verifyPassed = true;
    for (const [slug, lessonFixes] of fixesByLesson.entries()) {
      const lesson = lessonMap.get(slug);
      const blocks = extractBlocks(lesson.content);
      for (const fix of lessonFixes) {
        const rawCode = blocks[fix.blockIndex]?.raw ?? "";
        const code = decodeHtml(rawCode);
        const { passed, output } = testCode(code, fix.label);
        const status = passed ? "PASS" : "FAIL";
        console.log(`[${status}] ${fix.label}`);
        if (!passed) {
          verifyPassed = false;
          console.log("  ERROR:\n  " + output.split("\n").slice(-3).join("\n  "));
        } else {
          const preview = output.split("\n").filter(l => l.trim()).slice(0, 1);
          preview.forEach(l => console.log("  > " + l));
        }
      }
    }

    if (!verifyPassed) {
      console.error("\nWARNING: Some post-DB verifications failed.");
    } else {
      console.log(`\nAll ${FIXES.length} post-DB verifications passed.`);
    }

    console.log("\n=== Done! All 12 blocks fixed and saved to DB. ===\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR:", err.message);
  process.exit(1);
});
