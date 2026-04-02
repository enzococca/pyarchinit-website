/**
 * Rewrite chapters 2-5 of the Python course to use pure Python (no QGIS).
 * All code blocks are self-contained and executable in Pyodide (browser).
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/rewrite-chapters-2-5.mjs
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function codeBlock(code) {
  return `<pre><code class="language-python">${escHtml(code.trim())}</code></pre>`;
}

/** Test a Python code block. Returns { ok, output, error } */
function testCode(code, label) {
  const tmp = join(tmpdir(), `pytest_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);
  // Replace plt.show() with plt.savefig for testing (no display)
  let testable = code.replace(/plt\.show\(\)/g, "pass  # plt.show() skipped in test");
  // Replace plt.style.use that might fail in headless
  writeFileSync(tmp, testable);
  try {
    const output = execSync(`python3 "${tmp}" 2>&1`, { timeout: 15000 }).toString();
    unlinkSync(tmp);
    return { ok: true, output };
  } catch (e) {
    try { unlinkSync(tmp); } catch (_) {}
    return { ok: false, error: e.stderr?.toString() || e.stdout?.toString() || e.message };
  }
}

function buildHtml(sections) {
  // sections: array of { tag, text } or { code }
  return sections.map(s => {
    if (s.code !== undefined) return codeBlock(s.code);
    if (s.tag === "p") return `<p>${s.text}</p>`;
    if (s.tag === "h2") return `<h2>${s.text}</h2>`;
    if (s.tag === "h3") return `<h3>${s.text}</h3>`;
    if (s.tag === "ul") return `<ul>${s.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
    if (s.tag === "ol") return `<ol>${s.items.map(i => `<li>${i}</li>`).join("")}</ol>`;
    return "";
  }).join("\n");
}

// ─── ALL LESSON CONTENT ────────────────────────────────────────────────────────

const LESSONS = {};

// ============================================================================
// CHAPTER 2: Analisi Dati Archeologici con Python
// ============================================================================

LESSONS["python-c2-introduzione"] = {
  title: "Introduzione all'Analisi Dati con Python",
  content: [
    { tag: "h2", text: "Perche Python per l'Archeologia Spaziale?" },
    { tag: "p", text: "Python offre strumenti potenti per analizzare dati archeologici direttamente nel browser. Con librerie come NumPy e Matplotlib possiamo gestire coordinate, calcolare distanze, creare visualizzazioni e molto altro - tutto senza bisogno di software GIS dedicato." },
    { tag: "h3", text: "Vantaggi dell'approccio Python puro" },
    { tag: "ul", items: [
      "Eseguibile ovunque: nel browser, su server, in notebook",
      "Riproducibile: ogni analisi e uno script condivisibile",
      "Flessibile: personalizzazione totale degli algoritmi",
      "Integrabile: si combina con database, web API, report automatici",
    ]},
    { tag: "p", text: "In questo capitolo impareremo a lavorare con dati spaziali archeologici usando NumPy per i calcoli, Matplotlib per le visualizzazioni e le strutture dati native di Python." },
    { code: `import numpy as np

# Dati di siti archeologici: [nome, est, nord, periodo]
siti = [
    ("Villa Romana", 456200, 4523100, "Romano"),
    ("Necropoli", 456800, 4523500, "Etrusco"),
    ("Insediamento", 457100, 4522800, "Medievale"),
    ("Tempio", 456500, 4523300, "Romano"),
    ("Fornace", 457300, 4523600, "Romano"),
]

print("=== Siti Archeologici nel Dataset ===")
for nome, est, nord, periodo in siti:
    print("  " + nome + " - Coordinate: E " + str(est) + " N " + str(nord) + " - Periodo: " + periodo)

# Calcolo centro medio
coords = np.array([[s[1], s[2]] for s in siti])
centro = coords.mean(axis=0)
print("\\nCentro medio dei siti: E " + str(round(centro[0], 1)) + " N " + str(round(centro[1], 1)))
print("Numero totale di siti: " + str(len(siti)))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Siti archeologici con coordinate
nomi = ["Villa Romana", "Necropoli", "Insediamento", "Tempio", "Fornace"]
est = [456200, 456800, 457100, 456500, 457300]
nord = [4523100, 4523500, 4522800, 4523300, 4523600]
periodi = ["Romano", "Etrusco", "Medievale", "Romano", "Romano"]

colori = {"Romano": "#e74c3c", "Etrusco": "#3498db", "Medievale": "#2ecc71"}

fig, ax = plt.subplots(figsize=(8, 6))
for i in range(len(nomi)):
    c = colori[periodi[i]]
    ax.scatter(est[i], nord[i], c=c, s=100, zorder=5)
    ax.annotate(nomi[i], (est[i], nord[i]), textcoords="offset points",
                xytext=(8, 8), fontsize=9, color="white")

# Legenda manuale
for periodo, colore in colori.items():
    ax.scatter([], [], c=colore, s=80, label=periodo)
ax.legend(title="Periodo")

ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Mappa dei Siti Archeologici")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c2-configurazione-dell-ambiente-pyqgis"] = {
  title: "Configurazione dell'Ambiente di Analisi",
  slug: "python-c2-configurazione-dell-ambiente-pyqgis",
  content: [
    { tag: "h2", text: "Configurazione dell'Ambiente Python per Archeologia" },
    { tag: "p", text: "Per analizzare dati archeologici in Python abbiamo bisogno di alcune librerie fondamentali. Tutte sono disponibili nel nostro playground interattivo che gira nel browser con Pyodide." },
    { tag: "h3", text: "Librerie principali" },
    { tag: "ul", items: [
      "<strong>numpy</strong> - Calcolo numerico con array multidimensionali",
      "<strong>matplotlib</strong> - Grafici e visualizzazioni",
      "<strong>statistics</strong> - Statistiche descrittive (media, mediana, deviazione standard)",
      "<strong>math</strong> - Funzioni matematiche (trigonometria, radice quadrata)",
      "<strong>collections</strong> - Strutture dati avanzate (Counter, defaultdict)",
      "<strong>csv + io.StringIO</strong> - Lettura/scrittura dati CSV senza file su disco",
    ]},
    { code: `import numpy as np
import math
import statistics
from collections import Counter, defaultdict

print("=== Verifica Ambiente ===")
print("NumPy versione: " + np.__version__)
print("Modulo math: OK")
print("Modulo statistics: OK")
print("Modulo collections: OK")

# Test rapido: creiamo un array di profondita di scavo
profondita = np.array([0.5, 1.2, 0.8, 2.1, 1.5, 0.3, 1.8, 0.9])
print("\\n=== Test con dati di scavo ===")
print("Profondita rilevate (m): " + str(profondita))
print("Media: " + str(round(np.mean(profondita), 2)) + " m")
print("Massima: " + str(np.max(profondita)) + " m")
print("Minima: " + str(np.min(profondita)) + " m")` },
    { tag: "h3", text: "Lavorare con dati CSV in memoria" },
    { tag: "p", text: "Nel browser non abbiamo accesso al filesystem. Usiamo io.StringIO per simulare file CSV direttamente in memoria." },
    { code: `import csv
import io

# Simuliamo un file CSV di reperti archeologici
csv_data = """id,tipo,materiale,profondita,settore
1,Ceramica,Terracotta,0.45,A
2,Moneta,Bronzo,0.80,A
3,Ceramica,Sigillata,1.20,B
4,Osso,Fauna,0.35,A
5,Ceramica,Terracotta,0.90,B
6,Vetro,Soffiato,1.50,C
7,Moneta,Argento,0.70,B
8,Ceramica,Bucchero,1.80,C"""

# Leggiamo come lista di dizionari
reader = csv.DictReader(io.StringIO(csv_data))
reperti = list(reader)

print("=== Reperti da CSV ===")
print("Numero reperti: " + str(len(reperti)))
print("Colonne: " + str(list(reperti[0].keys())))
print("\\nPrimi 3 reperti:")
for r in reperti[:3]:
    print("  #" + r["id"] + " " + r["tipo"] + " (" + r["materiale"] + ") - prof: " + r["profondita"] + "m - settore " + r["settore"])` },
    { code: `from collections import Counter

# Continuiamo con i dati dei reperti
tipi = ["Ceramica", "Moneta", "Ceramica", "Osso", "Ceramica", "Vetro", "Moneta", "Ceramica"]
materiali = ["Terracotta", "Bronzo", "Sigillata", "Fauna", "Terracotta", "Soffiato", "Argento", "Bucchero"]
settori = ["A", "A", "B", "A", "B", "C", "B", "C"]

# Conteggio per tipo
conteggio_tipi = Counter(tipi)
print("=== Conteggio per Tipo ===")
for tipo, n in conteggio_tipi.most_common():
    print("  " + tipo + ": " + str(n) + " reperti")

# Conteggio per settore
conteggio_settori = Counter(settori)
print("\\n=== Conteggio per Settore ===")
for settore, n in sorted(conteggio_settori.items()):
    print("  Settore " + settore + ": " + str(n) + " reperti")

# Materiali unici
print("\\n=== Materiali Unici ===")
for m in sorted(set(materiali)):
    print("  - " + m)` },
  ]
};

LESSONS["python-c2-concetti-base-di-pyqgis"] = {
  title: "Concetti Base: Array e DataFrames Archeologici",
  content: [
    { tag: "h2", text: "Lavorare con Dati Strutturati" },
    { tag: "p", text: "I dati archeologici sono naturalmente tabulari: ogni reperto o sito ha attributi (coordinate, tipo, periodo, etc.). NumPy ci permette di gestire grandi quantita di dati numerici in modo efficiente, mentre liste di dizionari funzionano bene per dati misti." },
    { tag: "h3", text: "Array NumPy per coordinate" },
    { code: `import numpy as np

# Coordinate di 10 siti archeologici (Est, Nord) in sistema UTM
coordinate = np.array([
    [456200, 4523100],  # Villa Romana
    [456800, 4523500],  # Necropoli
    [457100, 4522800],  # Insediamento medievale
    [456500, 4523300],  # Tempio
    [457300, 4523600],  # Fornace
    [456100, 4522900],  # Tomba a camera
    [457500, 4523200],  # Acquedotto
    [456700, 4522600],  # Domus
    [456300, 4523700],  # Santuario
    [457000, 4523000],  # Terme
])

print("=== Array di Coordinate ===")
print("Forma: " + str(coordinate.shape) + " (righe x colonne)")
print("Tipo dati: " + str(coordinate.dtype))
print("\\nColonna Est - min: " + str(coordinate[:, 0].min()) + " max: " + str(coordinate[:, 0].max()))
print("Colonna Nord - min: " + str(coordinate[:, 1].min()) + " max: " + str(coordinate[:, 1].max()))

# Bounding box
bbox_min = coordinate.min(axis=0)
bbox_max = coordinate.max(axis=0)
area = (bbox_max[0] - bbox_min[0]) * (bbox_max[1] - bbox_min[1])
print("\\nBounding Box:")
print("  SW: E " + str(bbox_min[0]) + " N " + str(bbox_min[1]))
print("  NE: E " + str(bbox_max[0]) + " N " + str(bbox_max[1]))
print("  Area: " + str(area) + " m2 = " + str(round(area / 1e6, 2)) + " km2")` },
    { tag: "h3", text: "Dizionari per attributi misti" },
    { code: `import numpy as np
from collections import defaultdict

# Database di reperti come lista di dizionari
reperti = [
    {"id": 1, "tipo": "Ceramica", "periodo": "Romano", "profondita": 0.45, "settore": "A", "x": 456210, "y": 4523110},
    {"id": 2, "tipo": "Moneta", "periodo": "Romano", "profondita": 0.80, "settore": "A", "x": 456215, "y": 4523105},
    {"id": 3, "tipo": "Ceramica", "periodo": "Etrusco", "profondita": 1.20, "settore": "B", "x": 456810, "y": 4523510},
    {"id": 4, "tipo": "Osso", "periodo": "Medievale", "profondita": 0.35, "settore": "A", "x": 456205, "y": 4523115},
    {"id": 5, "tipo": "Ceramica", "periodo": "Romano", "profondita": 0.90, "settore": "B", "x": 456820, "y": 4523505},
    {"id": 6, "tipo": "Vetro", "periodo": "Romano", "profondita": 1.50, "settore": "C", "x": 457110, "y": 4522810},
    {"id": 7, "tipo": "Moneta", "periodo": "Etrusco", "profondita": 0.70, "settore": "B", "x": 456805, "y": 4523515},
    {"id": 8, "tipo": "Anfora", "periodo": "Romano", "profondita": 1.80, "settore": "C", "x": 457105, "y": 4522805},
]

# Raggruppamento per periodo
per_periodo = defaultdict(list)
for r in reperti:
    per_periodo[r["periodo"]].append(r)

print("=== Reperti per Periodo ===")
for periodo, items in sorted(per_periodo.items()):
    profs = [item["profondita"] for item in items]
    media_prof = sum(profs) / len(profs)
    print(periodo + ": " + str(len(items)) + " reperti, profondita media: " + str(round(media_prof, 2)) + " m")

# Estrazione coordinate come array NumPy per calcoli
coords = np.array([[r["x"], r["y"]] for r in reperti])
centro = coords.mean(axis=0)
print("\\nCentro medio dei reperti: E " + str(round(centro[0], 1)) + " N " + str(round(centro[1], 1)))` },
  ]
};

LESSONS["python-c2-operazioni-di-base-con-i-layer"] = {
  title: "Operazioni con i Dati Archeologici",
  content: [
    { tag: "h2", text: "Filtrare, Selezionare e Modificare Dati" },
    { tag: "p", text: "In archeologia dobbiamo costantemente filtrare e trasformare dati: selezionare reperti per periodo, filtrare siti per area geografica, calcolare nuovi attributi. Vediamo come farlo in Python." },
    { tag: "h3", text: "Filtraggio con condizioni" },
    { code: `import numpy as np

# Dataset: profondita, peso(g), lunghezza(cm), tipo_codice
# tipo_codice: 1=ceramica, 2=metallo, 3=osso, 4=vetro
dati = np.array([
    [0.45, 120, 8.5, 1],
    [0.80, 45, 2.1, 2],
    [1.20, 250, 15.0, 1],
    [0.35, 15, 3.2, 3],
    [0.90, 180, 12.0, 1],
    [1.50, 30, 4.5, 4],
    [0.70, 55, 2.8, 2],
    [1.80, 350, 18.5, 1],
    [0.60, 22, 5.0, 3],
    [1.10, 200, 14.0, 1],
])

nomi_tipo = {1: "Ceramica", 2: "Metallo", 3: "Osso", 4: "Vetro"}

# Filtro: solo ceramiche (tipo=1)
ceramiche = dati[dati[:, 3] == 1]
print("=== Ceramiche ===")
print("Trovate: " + str(len(ceramiche)) + " su " + str(len(dati)))
print("Peso medio: " + str(round(ceramiche[:, 1].mean(), 1)) + " g")
print("Profondita media: " + str(round(ceramiche[:, 0].mean(), 2)) + " m")

# Filtro combinato: reperti profondi (>1m) E pesanti (>100g)
mask = (dati[:, 0] > 1.0) & (dati[:, 1] > 100)
profondi_pesanti = dati[mask]
print("\\n=== Reperti profondi (>1m) e pesanti (>100g) ===")
print("Trovati: " + str(len(profondi_pesanti)))
for row in profondi_pesanti:
    tipo = nomi_tipo[int(row[3])]
    print("  " + tipo + " - prof: " + str(row[0]) + "m, peso: " + str(row[1]) + "g")

# Statistiche per tipo
print("\\n=== Peso medio per tipo ===")
for codice, nome in nomi_tipo.items():
    subset = dati[dati[:, 3] == codice]
    if len(subset) > 0:
        print("  " + nome + ": " + str(round(subset[:, 1].mean(), 1)) + " g (" + str(len(subset)) + " reperti)")` },
    { tag: "h3", text: "Ordinamento e selezione" },
    { code: `import numpy as np

# Siti con attributi: [est, nord, num_reperti, anno_scavo]
siti = [
    {"nome": "Villa Adriana", "est": 456200, "nord": 4523100, "reperti": 342, "anno": 2018},
    {"nome": "Necropoli Banditaccia", "est": 456800, "nord": 4523500, "reperti": 128, "anno": 2020},
    {"nome": "Foro Romano", "est": 457100, "nord": 4522800, "reperti": 567, "anno": 2015},
    {"nome": "Terme Tauriane", "est": 456500, "nord": 4523300, "reperti": 89, "anno": 2021},
    {"nome": "Acquedotto Vergine", "est": 457300, "nord": 4523600, "reperti": 45, "anno": 2019},
    {"nome": "Domus Aurea", "est": 456100, "nord": 4522900, "reperti": 234, "anno": 2017},
]

# Ordina per numero di reperti (decrescente)
per_reperti = sorted(siti, key=lambda s: s["reperti"], reverse=True)
print("=== Siti per numero di reperti (top 3) ===")
for i, s in enumerate(per_reperti[:3]):
    print(str(i + 1) + ". " + s["nome"] + ": " + str(s["reperti"]) + " reperti")

# Filtra siti scavati dopo il 2018
recenti = [s for s in siti if s["anno"] >= 2019]
print("\\n=== Siti scavati dal 2019 ===")
for s in recenti:
    print("  " + s["nome"] + " (" + str(s["anno"]) + "): " + str(s["reperti"]) + " reperti")

# Calcola densita reperti per sito (reperti per anno di attivita)
anno_corrente = 2026
print("\\n=== Densita reperti/anno di scavo ===")
for s in siti:
    anni = anno_corrente - s["anno"]
    densita = s["reperti"] / anni
    print("  " + s["nome"] + ": " + str(round(densita, 1)) + " reperti/anno")` },
  ]
};

LESSONS["python-c2-sistemi-di-riferimento-delle-coordinate"] = {
  title: "Sistemi di Riferimento delle Coordinate",
  content: [
    { tag: "h2", text: "Conversione tra Sistemi di Coordinate" },
    { tag: "p", text: "In archeologia usiamo spesso coordinate UTM (metriche, adatte per calcoli di distanza) e coordinate geografiche (latitudine/longitudine). Possiamo implementare la conversione con pura matematica." },
    { tag: "h3", text: "Da Gradi Decimali a UTM (formula semplificata)" },
    { code: `import math

def lat_lon_to_utm(lat, lon):
    """Conversione semplificata da Lat/Lon a UTM (WGS84)"""
    # Costanti WGS84
    a = 6378137.0  # semiasse maggiore
    f = 1 / 298.257223563  # appiattimento
    e2 = 2 * f - f * f  # eccentricita al quadrato
    e_prime2 = e2 / (1 - e2)
    k0 = 0.9996  # fattore di scala

    # Zona UTM
    zona = int((lon + 180) / 6) + 1
    lon0 = math.radians((zona - 1) * 6 - 180 + 3)  # meridiano centrale

    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)

    N = a / math.sqrt(1 - e2 * math.sin(lat_rad) ** 2)
    T = math.tan(lat_rad) ** 2
    C = e_prime2 * math.cos(lat_rad) ** 2
    A = math.cos(lat_rad) * (lon_rad - lon0)

    # Meridian arc
    M = a * ((1 - e2/4 - 3*e2**2/64) * lat_rad
             - (3*e2/8 + 3*e2**2/32) * math.sin(2*lat_rad)
             + (15*e2**2/256) * math.sin(4*lat_rad))

    est = k0 * N * (A + (1-T+C)*A**3/6) + 500000
    nord = k0 * (M + N * math.tan(lat_rad) * (A**2/2 + (5-T+9*C+4*C**2)*A**4/24))

    return zona, round(est, 2), round(nord, 2)

# Siti archeologici famosi con coordinate geografiche
siti = [
    ("Pompei", 40.7484, 14.4848),
    ("Paestum", 40.4197, 15.0050),
    ("Ercolano", 40.8060, 14.3477),
    ("Ostia Antica", 41.7559, 12.2916),
]

print("=== Conversione Lat/Lon -> UTM ===")
print("-" * 60)
for nome, lat, lon in siti:
    zona, est, nord = lat_lon_to_utm(lat, lon)
    print(nome + ":")
    print("  Lat/Lon: " + str(lat) + ", " + str(lon))
    print("  UTM Zona " + str(zona) + ": E " + str(est) + " N " + str(nord))
    print()` },
    { tag: "h3", text: "Calcolo distanze tra siti" },
    { code: `import math

def distanza_haversine(lat1, lon1, lat2, lon2):
    """Distanza tra due punti sulla Terra (km) con formula di Haversine"""
    R = 6371  # raggio Terra in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon/2)**2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c

# Siti archeologici campani
siti = [
    ("Pompei", 40.7484, 14.4848),
    ("Paestum", 40.4197, 15.0050),
    ("Ercolano", 40.8060, 14.3477),
    ("Cuma", 40.8468, 14.0538),
]

print("=== Matrice delle Distanze (km) ===")
# Intestazione
header = "            "
for nome, _, _ in siti:
    header += nome[:8].ljust(10)
print(header)
print("-" * (12 + 10 * len(siti)))

for i, (n1, lat1, lon1) in enumerate(siti):
    row = n1[:10].ljust(12)
    for j, (n2, lat2, lon2) in enumerate(siti):
        if i == j:
            row += "  ---   "
        else:
            d = distanza_haversine(lat1, lon1, lat2, lon2)
            row += str(round(d, 1)).rjust(6) + "  "
    print(row)

# Trova la coppia piu vicina
min_dist = float("inf")
coppia = ("", "")
for i in range(len(siti)):
    for j in range(i+1, len(siti)):
        d = distanza_haversine(siti[i][1], siti[i][2], siti[j][1], siti[j][2])
        if d < min_dist:
            min_dist = d
            coppia = (siti[i][0], siti[j][0])

print("\\nCoppia piu vicina: " + coppia[0] + " - " + coppia[1] + " (" + str(round(min_dist, 1)) + " km)")` },
  ]
};

LESSONS["python-c2-visualizzazione-e-simbolizzazione"] = {
  title: "Visualizzazione dei Dati Archeologici",
  content: [
    { tag: "h2", text: "Grafici e Mappe con Matplotlib" },
    { tag: "p", text: "Matplotlib e lo strumento principale per creare visualizzazioni in Python. Possiamo produrre scatter plot (mappe di siti), bar chart (distribuzione reperti), istogrammi e molto altro." },
    { tag: "h3", text: "Scatter plot: mappa dei siti" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Siti con coordinate e numero di reperti
np.random.seed(42)
n_siti = 25
est = np.random.uniform(456000, 458000, n_siti)
nord = np.random.uniform(4522000, 4524000, n_siti)
n_reperti = np.random.randint(10, 500, n_siti)
periodi = np.random.choice(["Romano", "Etrusco", "Medievale"], n_siti)

colori_map = {"Romano": "#e74c3c", "Etrusco": "#3498db", "Medievale": "#2ecc71"}
colori = [colori_map[p] for p in periodi]

fig, ax = plt.subplots(figsize=(9, 7))
scatter = ax.scatter(est, nord, c=colori, s=n_reperti * 0.5, alpha=0.7, edgecolors="white", linewidth=0.5)

# Legenda periodi
for periodo, colore in colori_map.items():
    ax.scatter([], [], c=colore, s=80, label=periodo, edgecolors="white")
ax.legend(title="Periodo", loc="upper left")

ax.set_xlabel("Est UTM (m)")
ax.set_ylabel("Nord UTM (m)")
ax.set_title("Distribuzione Siti Archeologici\\n(dimensione = numero reperti)")
ax.grid(True, alpha=0.2)
plt.tight_layout()
plt.show()` },
    { tag: "h3", text: "Bar chart: distribuzione dei reperti" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.style.use("dark_background")

# Conteggio reperti per tipo e settore
categorie = ["Ceramica", "Metallo", "Osso", "Vetro", "Litico"]
settore_A = [45, 12, 8, 3, 15]
settore_B = [38, 18, 5, 7, 10]
settore_C = [52, 8, 12, 2, 20]

x = range(len(categorie))
width = 0.25

fig, ax = plt.subplots(figsize=(9, 6))
bars1 = ax.bar([i - width for i in x], settore_A, width, label="Settore A", color="#e74c3c", alpha=0.8)
bars2 = ax.bar(x, settore_B, width, label="Settore B", color="#3498db", alpha=0.8)
bars3 = ax.bar([i + width for i in x], settore_C, width, label="Settore C", color="#2ecc71", alpha=0.8)

ax.set_xlabel("Tipo di Reperto")
ax.set_ylabel("Numero di Reperti")
ax.set_title("Distribuzione Reperti per Tipo e Settore")
ax.set_xticks(x)
ax.set_xticklabels(categorie)
ax.legend()
ax.grid(True, alpha=0.2, axis="y")

plt.tight_layout()
plt.show()` },
    { tag: "h3", text: "Istogramma: distribuzione delle profondita" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Profondita di 100 reperti (distribuzione realistica)
np.random.seed(123)
prof_romani = np.random.normal(0.8, 0.3, 40)
prof_medievali = np.random.normal(0.4, 0.2, 30)
prof_etruschi = np.random.normal(1.5, 0.4, 30)

fig, ax = plt.subplots(figsize=(9, 6))

ax.hist(prof_romani, bins=15, alpha=0.6, label="Romano", color="#e74c3c", edgecolor="white", linewidth=0.5)
ax.hist(prof_medievali, bins=15, alpha=0.6, label="Medievale", color="#2ecc71", edgecolor="white", linewidth=0.5)
ax.hist(prof_etruschi, bins=15, alpha=0.6, label="Etrusco", color="#3498db", edgecolor="white", linewidth=0.5)

ax.axvline(np.mean(prof_romani), color="#e74c3c", linestyle="--", linewidth=1.5, label="Media Romano")
ax.axvline(np.mean(prof_etruschi), color="#3498db", linestyle="--", linewidth=1.5, label="Media Etrusco")

ax.set_xlabel("Profondita (m)")
ax.set_ylabel("Frequenza")
ax.set_title("Distribuzione delle Profondita per Periodo")
ax.legend()
ax.grid(True, alpha=0.2, axis="y")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c2-analisi-spaziale-di-base"] = {
  title: "Analisi Spaziale di Base",
  content: [
    { tag: "h2", text: "Calcoli Spaziali Fondamentali" },
    { tag: "p", text: "Le analisi spaziali di base includono il calcolo di distanze, la ricerca del punto piu vicino, e la determinazione del bounding box. Questi sono i mattoni fondamentali per analisi piu complesse." },
    { tag: "h3", text: "Matrice delle distanze e punto piu vicino" },
    { code: `import numpy as np

# Coordinate di 8 siti
nomi = ["Villa", "Necropoli", "Foro", "Terme", "Tempio", "Anfiteatro", "Porta", "Mercato"]
coords = np.array([
    [456200, 4523100],
    [456800, 4523500],
    [457100, 4522800],
    [456500, 4523300],
    [457300, 4523600],
    [456100, 4522900],
    [457500, 4523200],
    [456700, 4522600],
])

# Calcolo matrice distanze con broadcasting
diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
dist_matrix = np.sqrt((diff ** 2).sum(axis=2))

# Per ogni sito, trova il piu vicino (escluso se stesso)
print("=== Nearest Neighbor per ogni sito ===")
for i in range(len(nomi)):
    distances = dist_matrix[i].copy()
    distances[i] = np.inf  # escludi se stesso
    j = np.argmin(distances)
    d = distances[j]
    print(nomi[i] + " -> " + nomi[j] + ": " + str(round(d, 0)) + " m")

# Statistiche distanze
# Estrai triangolo superiore (senza diagonale)
upper = dist_matrix[np.triu_indices(len(nomi), k=1)]
print("\\n=== Statistiche Distanze ===")
print("Distanza minima: " + str(round(upper.min(), 0)) + " m")
print("Distanza massima: " + str(round(upper.max(), 0)) + " m")
print("Distanza media: " + str(round(upper.mean(), 0)) + " m")
print("Deviazione standard: " + str(round(upper.std(), 0)) + " m")` },
    { tag: "h3", text: "Bounding box e centro medio" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

nomi = ["Villa", "Necropoli", "Foro", "Terme", "Tempio", "Anfiteatro", "Porta", "Mercato"]
coords = np.array([
    [456200, 4523100], [456800, 4523500], [457100, 4522800], [456500, 4523300],
    [457300, 4523600], [456100, 4522900], [457500, 4523200], [456700, 4522600],
])

# Calcoli
centro = coords.mean(axis=0)
bbox_min = coords.min(axis=0)
bbox_max = coords.max(axis=0)

# Distanza media dal centro (dispersione)
dist_dal_centro = np.sqrt(((coords - centro) ** 2).sum(axis=1))

fig, ax = plt.subplots(figsize=(8, 7))

# Bounding box
rect = plt.Rectangle((bbox_min[0], bbox_min[1]),
                      bbox_max[0] - bbox_min[0], bbox_max[1] - bbox_min[1],
                      fill=False, edgecolor="#f39c12", linewidth=2, linestyle="--", label="Bounding Box")
ax.add_patch(rect)

# Siti
ax.scatter(coords[:, 0], coords[:, 1], c="#3498db", s=80, zorder=5, edgecolors="white")
for i, nome in enumerate(nomi):
    ax.annotate(nome, (coords[i, 0], coords[i, 1]),
                textcoords="offset points", xytext=(8, 8), fontsize=8, color="white")

# Centro medio
ax.scatter(centro[0], centro[1], c="#e74c3c", s=150, marker="*", zorder=6, label="Centro Medio")

# Cerchio di dispersione media
circle = plt.Circle((centro[0], centro[1]), dist_dal_centro.mean(),
                     fill=False, edgecolor="#e74c3c", linewidth=1.5, linestyle=":", label="Dispersione media")
ax.add_patch(circle)

ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Siti con Bounding Box e Centro Medio")
ax.legend(loc="lower right")
ax.set_aspect("equal")
ax.grid(True, alpha=0.2)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c2-esportazione-dei-risultati"] = {
  title: "Esportazione dei Risultati",
  content: [
    { tag: "h2", text: "Salvare i Risultati delle Analisi" },
    { tag: "p", text: "Dopo aver analizzato i dati, dobbiamo esportare i risultati in formati riutilizzabili: CSV per fogli di calcolo, JSON per applicazioni web, e testo per report." },
    { tag: "h3", text: "Esportazione in formato CSV" },
    { code: `import csv
import io

# Dati da esportare
siti_analizzati = [
    {"nome": "Villa Adriana", "est": 456200, "nord": 4523100, "reperti": 342, "densita": 42.8},
    {"nome": "Necropoli", "est": 456800, "nord": 4523500, "reperti": 128, "densita": 21.3},
    {"nome": "Foro Romano", "est": 457100, "nord": 4522800, "reperti": 567, "densita": 51.5},
    {"nome": "Terme", "est": 456500, "nord": 4523300, "reperti": 89, "densita": 17.8},
]

# Scrivi CSV in memoria
output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=["nome", "est", "nord", "reperti", "densita"])
writer.writeheader()
writer.writerows(siti_analizzati)

csv_text = output.getvalue()
print("=== Output CSV ===")
print(csv_text)

# Rileggi per verifica
reader = csv.DictReader(io.StringIO(csv_text))
print("=== Verifica rilettura ===")
for row in reader:
    print("  " + row["nome"] + " - reperti: " + row["reperti"] + ", densita: " + row["densita"])` },
    { tag: "h3", text: "Esportazione in formato JSON" },
    { code: `import json

# Risultati dell'analisi
risultati = {
    "progetto": "Scavo Area Nord",
    "data_analisi": "2026-04-01",
    "n_siti": 4,
    "statistiche": {
        "reperti_totali": 1126,
        "media_reperti": 281.5,
        "densita_media": 33.35,
    },
    "siti": [
        {"nome": "Villa Adriana", "coordinate": [456200, 4523100], "reperti": 342},
        {"nome": "Necropoli", "coordinate": [456800, 4523500], "reperti": 128},
        {"nome": "Foro Romano", "coordinate": [457100, 4522800], "reperti": 567},
        {"nome": "Terme", "coordinate": [456500, 4523300], "reperti": 89},
    ]
}

# Serializza in JSON formattato
json_output = json.dumps(risultati, indent=2, ensure_ascii=False)
print("=== Output JSON ===")
print(json_output)

# Verifica: rileggi
parsed = json.loads(json_output)
print("\\n=== Verifica ===")
print("Progetto: " + parsed["progetto"])
print("Siti: " + str(parsed["n_siti"]))
print("Reperti totali: " + str(parsed["statistiche"]["reperti_totali"]))` },
  ]
};

LESSONS["python-c2-esercizi-pratici-pyqgis"] = {
  title: "Esercizi Pratici",
  content: [
    { tag: "h2", text: "Esercizi: Analisi Dati Archeologici" },
    { tag: "p", text: "Metti in pratica quanto appreso con questi esercizi. Ogni blocco e un esercizio completo con soluzione." },
    { tag: "h3", text: "Esercizio 1: Analisi di un dataset di reperti" },
    { code: `import numpy as np
from collections import Counter

# Dataset: 50 reperti con tipo, peso, profondita
np.random.seed(42)
tipi = np.random.choice(["Ceramica", "Metallo", "Osso", "Vetro", "Litico"], 50,
                         p=[0.4, 0.15, 0.2, 0.1, 0.15])
pesi = np.random.exponential(100, 50).round(1)
profondita = np.random.uniform(0.1, 2.5, 50).round(2)

# Esercizio: calcola statistiche per tipo
print("=== Statistiche per Tipo di Reperto ===")
conteggio = Counter(tipi)
for tipo in sorted(conteggio.keys()):
    mask = tipi == tipo
    p = pesi[mask]
    d = profondita[mask]
    print("\\n" + tipo + " (" + str(conteggio[tipo]) + " reperti):")
    print("  Peso:      media=" + str(round(p.mean(), 1)) + "g, min=" + str(p.min()) + "g, max=" + str(round(p.max(), 1)) + "g")
    print("  Profondita: media=" + str(round(d.mean(), 2)) + "m, min=" + str(d.min()) + "m, max=" + str(round(d.max(), 2)) + "m")

# Quale tipo e piu profondo in media?
tipo_profondo = max(conteggio.keys(), key=lambda t: profondita[tipi == t].mean())
print("\\nTipo piu profondo in media: " + tipo_profondo + " (" + str(round(profondita[tipi == tipo_profondo].mean(), 2)) + " m)")` },
    { tag: "h3", text: "Esercizio 2: Mappa di distribuzione" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Genera siti casuali in 3 cluster (insediamenti)
np.random.seed(42)
cluster1 = np.random.normal([456300, 4523100], [100, 100], (15, 2))
cluster2 = np.random.normal([457000, 4523500], [150, 80], (10, 2))
cluster3 = np.random.normal([456700, 4522700], [80, 120], (8, 2))

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Plot 1: tutti i punti
ax1 = axes[0]
ax1.scatter(cluster1[:, 0], cluster1[:, 1], c="#e74c3c", s=50, label="Cluster A", alpha=0.7)
ax1.scatter(cluster2[:, 0], cluster2[:, 1], c="#3498db", s=50, label="Cluster B", alpha=0.7)
ax1.scatter(cluster3[:, 0], cluster3[:, 1], c="#2ecc71", s=50, label="Cluster C", alpha=0.7)

# Centri dei cluster
for cl, col in [(cluster1, "#e74c3c"), (cluster2, "#3498db"), (cluster3, "#2ecc71")]:
    centro = cl.mean(axis=0)
    ax1.scatter(centro[0], centro[1], c=col, s=200, marker="+", linewidths=3, zorder=5)

ax1.set_title("Distribuzione dei Siti")
ax1.set_xlabel("Est (m)")
ax1.set_ylabel("Nord (m)")
ax1.legend()
ax1.grid(True, alpha=0.2)

# Plot 2: Distanze dal centro di ogni cluster
ax2 = axes[1]
for cl, nome, col in [(cluster1, "A", "#e74c3c"), (cluster2, "B", "#3498db"), (cluster3, "C", "#2ecc71")]:
    centro = cl.mean(axis=0)
    distanze = np.sqrt(((cl - centro) ** 2).sum(axis=1))
    ax2.hist(distanze, bins=8, alpha=0.6, label="Cluster " + nome, color=col, edgecolor="white")

ax2.set_title("Distanze dal Centro del Cluster")
ax2.set_xlabel("Distanza (m)")
ax2.set_ylabel("Frequenza")
ax2.legend()
ax2.grid(True, alpha=0.2, axis="y")

plt.tight_layout()
plt.show()` },
  ]
};

// ============================================================================
// CHAPTER 3: Analisi Statistiche
// ============================================================================

LESSONS["python-c3-introduzione"] = {
  title: "Introduzione alle Analisi Statistiche",
  content: [
    { tag: "h2", text: "Statistica per l'Archeologia" },
    { tag: "p", text: "Le analisi statistiche sono fondamentali per interpretare i dati archeologici in modo oggettivo. In questo capitolo impareremo a usare NumPy, il modulo statistics e SciPy per analizzare distribuzioni, identificare pattern e testare ipotesi." },
    { code: `import numpy as np
import statistics

# Dataset di profondita di reperti in 3 settori di scavo
np.random.seed(42)
settore_A = np.random.normal(0.8, 0.25, 30).round(2)
settore_B = np.random.normal(1.2, 0.35, 25).round(2)
settore_C = np.random.normal(0.5, 0.15, 20).round(2)

print("=== Panoramica Dataset ===")
for nome, dati in [("Settore A", settore_A), ("Settore B", settore_B), ("Settore C", settore_C)]:
    print("\\n" + nome + " (" + str(len(dati)) + " reperti):")
    print("  Media:     " + str(round(np.mean(dati), 3)) + " m")
    print("  Mediana:   " + str(round(np.median(dati), 3)) + " m")
    print("  Std Dev:   " + str(round(np.std(dati), 3)) + " m")
    print("  Min-Max:   " + str(round(dati.min(), 2)) + " - " + str(round(dati.max(), 2)) + " m")` },
  ]
};

LESSONS["python-c3-statistiche-descrittive-di-base"] = {
  title: "Statistiche Descrittive di Base",
  content: [
    { tag: "h2", text: "Misure di Tendenza Centrale e Dispersione" },
    { tag: "p", text: "Le statistiche descrittive ci aiutano a sintetizzare grandi dataset. Le misure piu importanti sono media, mediana, moda, varianza e deviazione standard." },
    { code: `import numpy as np
import statistics

# Pesi di frammenti ceramici (grammi) da uno strato archeologico
pesi = [45.2, 23.1, 67.8, 12.5, 89.3, 34.7, 56.2, 78.9, 15.3, 42.6,
        98.1, 31.4, 52.8, 19.7, 73.5, 41.2, 28.9, 65.3, 37.8, 84.6,
        11.2, 93.4, 47.5, 59.1, 26.3, 71.8, 38.4, 82.7, 55.0, 44.3]

print("=== Statistiche Descrittive: Pesi Ceramici ===")
print("N campioni: " + str(len(pesi)))
print("\\n--- Tendenza Centrale ---")
print("Media:    " + str(round(statistics.mean(pesi), 2)) + " g")
print("Mediana:  " + str(round(statistics.median(pesi), 2)) + " g")
print("Moda:     Non applicabile (dati continui)")

print("\\n--- Dispersione ---")
print("Varianza:    " + str(round(statistics.variance(pesi), 2)))
print("Dev. Std.:   " + str(round(statistics.stdev(pesi), 2)) + " g")
print("Range:       " + str(round(max(pesi) - min(pesi), 2)) + " g")

# Quartili con numpy
arr = np.array(pesi)
q1, q2, q3 = np.percentile(arr, [25, 50, 75])
iqr = q3 - q1
print("\\n--- Quartili ---")
print("Q1 (25%%):  " + str(round(q1, 2)) + " g")
print("Q2 (50%%):  " + str(round(q2, 2)) + " g")
print("Q3 (75%%):  " + str(round(q3, 2)) + " g")
print("IQR:        " + str(round(iqr, 2)) + " g")` },
    { tag: "h3", text: "Visualizzazione: Box plot" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
ceramica = np.random.normal(50, 20, 40)
metallo = np.random.normal(30, 15, 35)
osso = np.random.normal(15, 8, 30)
vetro = np.random.normal(25, 12, 20)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Box plot
bp = ax1.boxplot([ceramica, metallo, osso, vetro],
                  labels=["Ceramica", "Metallo", "Osso", "Vetro"],
                  patch_artist=True,
                  medianprops={"color": "white", "linewidth": 2})

colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"]
for patch, color in zip(bp["boxes"], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)

ax1.set_ylabel("Peso (g)")
ax1.set_title("Distribuzione Pesi per Materiale")
ax1.grid(True, alpha=0.2, axis="y")

# Violin plot
parts = ax2.violinplot([ceramica, metallo, osso, vetro], positions=[1, 2, 3, 4], showmeans=True, showmedians=True)
for i, pc in enumerate(parts["bodies"]):
    pc.set_facecolor(colors[i])
    pc.set_alpha(0.7)

ax2.set_xticks([1, 2, 3, 4])
ax2.set_xticklabels(["Ceramica", "Metallo", "Osso", "Vetro"])
ax2.set_ylabel("Peso (g)")
ax2.set_title("Violin Plot dei Pesi")
ax2.grid(True, alpha=0.2, axis="y")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-identificazione-e-gestione-delle-anomali"] = {
  title: "Identificazione e Gestione delle Anomalie",
  content: [
    { tag: "h2", text: "Rilevamento Outlier con Z-score e IQR" },
    { tag: "p", text: "Gli outlier (valori anomali) possono rappresentare errori di misurazione oppure scoperte interessanti. Usiamo metodi statistici per identificarli." },
    { code: `import numpy as np

# Profondita di reperti (un valore anomalo inserito)
profondita = np.array([
    0.45, 0.52, 0.48, 0.61, 0.55, 0.42, 0.58, 0.50, 0.63, 0.47,
    0.53, 0.49, 0.56, 0.44, 0.60, 0.51, 0.57, 0.46, 0.54, 0.59,
    2.85,  # <-- possibile anomalia!
    0.50, 0.55, 0.48, 0.52
])

# Metodo 1: Z-score
media = np.mean(profondita)
std = np.std(profondita)
z_scores = (profondita - media) / std

print("=== Metodo Z-score (soglia: |z| > 2) ===")
print("Media: " + str(round(media, 3)) + " m")
print("Dev. Std.: " + str(round(std, 3)) + " m")
outliers_z = np.where(np.abs(z_scores) > 2)[0]
for idx in outliers_z:
    print("  Outlier #" + str(idx) + ": " + str(profondita[idx]) + " m (z=" + str(round(z_scores[idx], 2)) + ")")

# Metodo 2: IQR
q1, q3 = np.percentile(profondita, [25, 75])
iqr = q3 - q1
lower = q1 - 1.5 * iqr
upper = q3 + 1.5 * iqr

print("\\n=== Metodo IQR ===")
print("Q1: " + str(round(q1, 3)) + ", Q3: " + str(round(q3, 3)) + ", IQR: " + str(round(iqr, 3)))
print("Limiti: [" + str(round(lower, 3)) + ", " + str(round(upper, 3)) + "]")
outliers_iqr = np.where((profondita < lower) | (profondita > upper))[0]
for idx in outliers_iqr:
    print("  Outlier #" + str(idx) + ": " + str(profondita[idx]) + " m")

# Dati ripuliti
clean = profondita[(profondita >= lower) & (profondita <= upper)]
print("\\n=== Dopo rimozione outlier ===")
print("N campioni: " + str(len(profondita)) + " -> " + str(len(clean)))
print("Media: " + str(round(media, 3)) + " -> " + str(round(np.mean(clean), 3)) + " m")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

profondita = np.array([
    0.45, 0.52, 0.48, 0.61, 0.55, 0.42, 0.58, 0.50, 0.63, 0.47,
    0.53, 0.49, 0.56, 0.44, 0.60, 0.51, 0.57, 0.46, 0.54, 0.59,
    2.85, 0.50, 0.55, 0.48, 0.52
])

media = np.mean(profondita)
std = np.std(profondita)
z_scores = np.abs((profondita - media) / std)
is_outlier = z_scores > 2

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Scatter plot con outlier evidenziati
normal = profondita[~is_outlier]
outlier = profondita[is_outlier]
ax1.scatter(range(len(profondita)), profondita, c=np.where(is_outlier, "#e74c3c", "#3498db"), s=60, zorder=5)
ax1.axhline(media, color="#f39c12", linestyle="--", label="Media")
ax1.axhline(media + 2*std, color="#e74c3c", linestyle=":", label="+2 sigma")
ax1.axhline(media - 2*std, color="#e74c3c", linestyle=":", label="-2 sigma")
ax1.set_xlabel("Indice reperto")
ax1.set_ylabel("Profondita (m)")
ax1.set_title("Rilevamento Outlier (Z-score)")
ax1.legend()
ax1.grid(True, alpha=0.2)

# Distribuzione
ax2.hist(profondita, bins=15, alpha=0.7, color="#3498db", edgecolor="white", label="Tutti")
ax2.hist(normal, bins=15, alpha=0.5, color="#2ecc71", edgecolor="white", label="Senza outlier")
ax2.axvline(media, color="#f39c12", linestyle="--", label="Media")
ax2.set_xlabel("Profondita (m)")
ax2.set_ylabel("Frequenza")
ax2.set_title("Distribuzione con/senza Outlier")
ax2.legend()
ax2.grid(True, alpha=0.2, axis="y")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-analisi-della-distribuzione-spaziale"] = {
  title: "Analisi della Distribuzione Spaziale",
  content: [
    { tag: "h2", text: "Distribuzione Spaziale dei Siti" },
    { tag: "p", text: "L'analisi della distribuzione spaziale ci permette di capire se i siti archeologici sono distribuiti in modo casuale, raggruppato o uniforme. Calcoliamo il centro medio, il centro mediano e la distanza standard." },
    { code: `import numpy as np

# 30 siti archeologici con coordinate
np.random.seed(42)
# Cluster romano
romano_x = np.random.normal(456500, 200, 15)
romano_y = np.random.normal(4523200, 150, 15)
# Cluster etrusco
etrusco_x = np.random.normal(457200, 150, 10)
etrusco_y = np.random.normal(4523700, 100, 10)
# Sparsi
sparsi_x = np.random.uniform(455800, 457800, 5)
sparsi_y = np.random.uniform(4522400, 4524000, 5)

tutti_x = np.concatenate([romano_x, etrusco_x, sparsi_x])
tutti_y = np.concatenate([romano_y, etrusco_y, sparsi_y])

# Centro medio (mean center)
cx_mean = np.mean(tutti_x)
cy_mean = np.mean(tutti_y)

# Centro mediano (meno sensibile agli outlier)
cx_median = np.median(tutti_x)
cy_median = np.median(tutti_y)

# Distanza standard (standard distance)
std_dist = np.sqrt(np.std(tutti_x)**2 + np.std(tutti_y)**2)

# Ellisse di deviazione standard
std_x = np.std(tutti_x)
std_y = np.std(tutti_y)

print("=== Analisi Distribuzione Spaziale ===")
print("N siti: " + str(len(tutti_x)))
print("\\nCentro medio:   E " + str(round(cx_mean, 1)) + " N " + str(round(cy_mean, 1)))
print("Centro mediano: E " + str(round(cx_median, 1)) + " N " + str(round(cy_median, 1)))
print("\\nDistanza standard: " + str(round(std_dist, 1)) + " m")
print("Std Est: " + str(round(std_x, 1)) + " m")
print("Std Nord: " + str(round(std_y, 1)) + " m")
print("Rapporto assi: " + str(round(std_x / std_y, 2)) + " (>1 = allungato in Est)")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
romano_x = np.random.normal(456500, 200, 15)
romano_y = np.random.normal(4523200, 150, 15)
etrusco_x = np.random.normal(457200, 150, 10)
etrusco_y = np.random.normal(4523700, 100, 10)
sparsi_x = np.random.uniform(455800, 457800, 5)
sparsi_y = np.random.uniform(4522400, 4524000, 5)

tutti_x = np.concatenate([romano_x, etrusco_x, sparsi_x])
tutti_y = np.concatenate([romano_y, etrusco_y, sparsi_y])

cx = np.mean(tutti_x)
cy = np.mean(tutti_y)
std_x = np.std(tutti_x)
std_y = np.std(tutti_y)

fig, ax = plt.subplots(figsize=(8, 7))

ax.scatter(romano_x, romano_y, c="#e74c3c", s=60, label="Romano", alpha=0.7, edgecolors="white")
ax.scatter(etrusco_x, etrusco_y, c="#3498db", s=60, label="Etrusco", alpha=0.7, edgecolors="white")
ax.scatter(sparsi_x, sparsi_y, c="#95a5a6", s=60, label="Non classificato", alpha=0.7, edgecolors="white")

# Centro medio
ax.scatter(cx, cy, c="#f39c12", s=200, marker="*", zorder=6, label="Centro medio")

# Ellisse deviazione standard (1 e 2 sigma)
theta = np.linspace(0, 2 * np.pi, 100)
for n_sigma, ls in [(1, "-"), (2, "--")]:
    ex = cx + n_sigma * std_x * np.cos(theta)
    ey = cy + n_sigma * std_y * np.sin(theta)
    ax.plot(ex, ey, color="#f39c12", linestyle=ls, linewidth=1.5,
            label=str(n_sigma) + " sigma" if n_sigma == 1 else str(n_sigma) + " sigma")

ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Distribuzione Spaziale con Ellisse di Deviazione Standard")
ax.legend(loc="lower right", fontsize=8)
ax.grid(True, alpha=0.2)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-analisi-della-densita-spaziale"] = {
  title: "Analisi della Densita Spaziale",
  content: [
    { tag: "h2", text: "Stima della Densita con Kernel (KDE)" },
    { tag: "p", text: "La Kernel Density Estimation (KDE) ci permette di stimare la densita di punti nello spazio, evidenziando zone di concentrazione. Implementiamo una KDE gaussiana con NumPy." },
    { code: `import numpy as np

def kde_2d(x, y, grid_x, grid_y, bandwidth):
    """Kernel Density Estimation 2D con kernel gaussiano"""
    n = len(x)
    density = np.zeros_like(grid_x)
    for i in range(n):
        dx = grid_x - x[i]
        dy = grid_y - y[i]
        kernel = np.exp(-0.5 * (dx**2 + dy**2) / bandwidth**2)
        density += kernel
    density /= (n * 2 * np.pi * bandwidth**2)
    return density

# Coordinate di reperti (cluster)
np.random.seed(42)
x = np.concatenate([np.random.normal(100, 15, 20), np.random.normal(180, 10, 15)])
y = np.concatenate([np.random.normal(80, 12, 20), np.random.normal(120, 8, 15)])

# Griglia
xi = np.linspace(50, 230, 50)
yi = np.linspace(30, 170, 50)
grid_x, grid_y = np.meshgrid(xi, yi)

# Calcola KDE
density = kde_2d(x, y, grid_x, grid_y, bandwidth=15)

print("=== Kernel Density Estimation ===")
print("N punti: " + str(len(x)))
print("Bandwidth: 15 m")
print("Griglia: " + str(grid_x.shape))
print("Densita max: " + str(round(density.max(), 6)))
print("Densita min: " + str(round(density.min(), 6)))

# Trova picchi di densita
max_idx = np.unravel_index(density.argmax(), density.shape)
print("\\nPicco di densita a: E " + str(round(grid_x[max_idx], 1)) + " N " + str(round(grid_y[max_idx], 1)))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

def kde_2d(x, y, grid_x, grid_y, bandwidth):
    n = len(x)
    density = np.zeros_like(grid_x)
    for i in range(n):
        dx = grid_x - x[i]
        dy = grid_y - y[i]
        kernel = np.exp(-0.5 * (dx**2 + dy**2) / bandwidth**2)
        density += kernel
    density /= (n * 2 * np.pi * bandwidth**2)
    return density

np.random.seed(42)
x = np.concatenate([np.random.normal(100, 15, 20), np.random.normal(180, 10, 15)])
y = np.concatenate([np.random.normal(80, 12, 20), np.random.normal(120, 8, 15)])

xi = np.linspace(50, 230, 80)
yi = np.linspace(30, 170, 80)
grid_x, grid_y = np.meshgrid(xi, yi)

density = kde_2d(x, y, grid_x, grid_y, bandwidth=15)

fig, ax = plt.subplots(figsize=(9, 6))
cf = ax.contourf(grid_x, grid_y, density, levels=15, cmap="inferno")
ax.contour(grid_x, grid_y, density, levels=8, colors="white", linewidths=0.5, alpha=0.3)
ax.scatter(x, y, c="white", s=20, alpha=0.8, edgecolors="gray", linewidth=0.5)
plt.colorbar(cf, ax=ax, label="Densita")
ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Mappa di Densita dei Reperti (KDE Gaussiana)")
ax.set_aspect("equal")
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-nearest-neighbor-analysis-nna"] = {
  title: "Nearest Neighbor Analysis (NNA)",
  content: [
    { tag: "h2", text: "Analisi del Vicino Piu Prossimo" },
    { tag: "p", text: "L'NNA confronta la distanza media osservata al vicino piu prossimo con quella attesa in una distribuzione casuale. Un rapporto R < 1 indica clustering, R > 1 indica dispersione." },
    { code: `import numpy as np

def nearest_neighbor_analysis(coords):
    """
    Calcola il Nearest Neighbor Index (NNI).
    R < 1: clustered, R = 1: random, R > 1: dispersed
    """
    n = len(coords)
    # Matrice distanze
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    np.fill_diagonal(dist, np.inf)

    # Distanza media osservata al NN
    nn_dist = dist.min(axis=1)
    d_obs = nn_dist.mean()

    # Area del bounding box
    bbox = coords.max(axis=0) - coords.min(axis=0)
    area = bbox[0] * bbox[1]
    density = n / area

    # Distanza media attesa (distribuzione casuale)
    d_exp = 0.5 / np.sqrt(density)

    # NNI
    R = d_obs / d_exp

    # Z-score
    se = 0.26136 / np.sqrt(n * density)
    z = (d_obs - d_exp) / se

    return R, z, d_obs, d_exp, nn_dist

# Test 1: Punti raggruppati (clustered)
np.random.seed(42)
clustered = np.concatenate([
    np.random.normal([100, 100], 10, (15, 2)),
    np.random.normal([200, 200], 10, (15, 2))
])

R, z, d_obs, d_exp, nn = nearest_neighbor_analysis(clustered)
print("=== Punti Raggruppati ===")
print("R = " + str(round(R, 3)) + " (< 1 = clustered)")
print("Z = " + str(round(z, 3)))
print("D osservata: " + str(round(d_obs, 2)) + " m")
print("D attesa:    " + str(round(d_exp, 2)) + " m")
print("Interpretazione: " + ("Clustered" if R < 1 else "Dispersed" if R > 1 else "Random"))

# Test 2: Punti sparsi (dispersed)
grid_x, grid_y = np.meshgrid(np.linspace(0, 300, 6), np.linspace(0, 300, 5))
dispersed = np.column_stack([grid_x.ravel(), grid_y.ravel()])
dispersed += np.random.normal(0, 5, dispersed.shape)

R2, z2, d_obs2, d_exp2, nn2 = nearest_neighbor_analysis(dispersed)
print("\\n=== Punti Sparsi (quasi-griglia) ===")
print("R = " + str(round(R2, 3)) + " (> 1 = dispersed)")
print("Z = " + str(round(z2, 3)))
print("Interpretazione: " + ("Clustered" if R2 < 1 else "Dispersed" if R2 > 1 else "Random"))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)

fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# 1. Clustered
clustered = np.concatenate([
    np.random.normal([100, 100], 15, (20, 2)),
    np.random.normal([250, 250], 15, (20, 2))
])
axes[0].scatter(clustered[:, 0], clustered[:, 1], c="#e74c3c", s=30, alpha=0.7)
axes[0].set_title("Clustered (R < 1)")
axes[0].set_aspect("equal")
axes[0].grid(True, alpha=0.2)

# 2. Random
random_pts = np.random.uniform(0, 300, (40, 2))
axes[1].scatter(random_pts[:, 0], random_pts[:, 1], c="#f39c12", s=30, alpha=0.7)
axes[1].set_title("Random (R ~ 1)")
axes[1].set_aspect("equal")
axes[1].grid(True, alpha=0.2)

# 3. Dispersed
gx, gy = np.meshgrid(np.linspace(20, 280, 7), np.linspace(20, 280, 6))
dispersed = np.column_stack([gx.ravel(), gy.ravel()]) + np.random.normal(0, 5, (42, 2))
axes[2].scatter(dispersed[:, 0], dispersed[:, 1], c="#2ecc71", s=30, alpha=0.7)
axes[2].set_title("Dispersed (R > 1)")
axes[2].set_aspect("equal")
axes[2].grid(True, alpha=0.2)

for ax in axes:
    ax.set_xlabel("Est (m)")
    ax.set_ylabel("Nord (m)")
    ax.set_xlim(-20, 320)
    ax.set_ylim(-20, 320)

plt.suptitle("Tre Pattern Spaziali: Clustered, Random, Dispersed", fontsize=13)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-hot-spot-analysis-analisi-dei-punti-cal"] = {
  title: "Hot Spot Analysis (Analisi dei Punti Caldi)",
  content: [
    { tag: "h2", text: "Analisi Hot Spot con Getis-Ord Gi*" },
    { tag: "p", text: "L'analisi hot spot identifica zone con concentrazioni statisticamente significative di valori alti (hot spot) o bassi (cold spot). Implementiamo una versione semplificata della statistica Gi*." },
    { code: `import numpy as np

def getis_ord_gi_star(values, coords, distance_threshold):
    """
    Calcola la statistica Gi* di Getis-Ord per ogni punto.
    values: array di valori (es. numero reperti)
    coords: array Nx2 di coordinate
    distance_threshold: distanza entro cui i punti sono considerati vicini
    """
    n = len(values)
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    distances = np.sqrt((diff ** 2).sum(axis=2))

    # Matrice pesi binaria (1 se entro soglia, 0 altrimenti)
    W = (distances <= distance_threshold).astype(float)

    x_mean = values.mean()
    s = values.std()

    gi_star = np.zeros(n)
    for i in range(n):
        wi = W[i]
        numerator = np.sum(wi * values) - x_mean * np.sum(wi)
        wi_sum = np.sum(wi)
        denominator = s * np.sqrt((n * np.sum(wi**2) - wi_sum**2) / (n - 1))
        if denominator > 0:
            gi_star[i] = numerator / denominator

    return gi_star

# Dati: griglia di quadranti con conteggio reperti
np.random.seed(42)
# Creiamo una griglia 6x6 con hot spot nel quadrante NE
grid_size = 6
gx, gy = np.meshgrid(range(grid_size), range(grid_size))
coords = np.column_stack([gx.ravel(), gy.ravel()]).astype(float) * 50

# Valori base casuali + hot spot in alto a destra
values = np.random.poisson(10, len(coords)).astype(float)
for i in range(len(coords)):
    if coords[i, 0] > 150 and coords[i, 1] > 150:
        values[i] += np.random.poisson(20)

gi_star = getis_ord_gi_star(values, coords, distance_threshold=75)

print("=== Hot Spot Analysis (Gi*) ===")
print("Griglia: " + str(grid_size) + "x" + str(grid_size) + " quadranti")
print("Soglia distanza: 75 m")
print("\\nHot spots (Gi* > 1.96, p < 0.05):")
hot = np.where(gi_star > 1.96)[0]
for idx in hot:
    print("  Quadrante (" + str(int(coords[idx, 0])) + "," + str(int(coords[idx, 1])) + "): Gi*=" + str(round(gi_star[idx], 2)) + ", reperti=" + str(int(values[idx])))

print("\\nCold spots (Gi* < -1.96, p < 0.05):")
cold = np.where(gi_star < -1.96)[0]
if len(cold) == 0:
    print("  Nessuno trovato")
for idx in cold:
    print("  Quadrante (" + str(int(coords[idx, 0])) + "," + str(int(coords[idx, 1])) + "): Gi*=" + str(round(gi_star[idx], 2)) + ", reperti=" + str(int(values[idx])))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

def getis_ord_gi_star(values, coords, distance_threshold):
    n = len(values)
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    distances = np.sqrt((diff ** 2).sum(axis=2))
    W = (distances <= distance_threshold).astype(float)
    x_mean = values.mean()
    s = values.std()
    gi_star = np.zeros(n)
    for i in range(n):
        wi = W[i]
        numerator = np.sum(wi * values) - x_mean * np.sum(wi)
        wi_sum = np.sum(wi)
        denominator = s * np.sqrt((n * np.sum(wi**2) - wi_sum**2) / (n - 1))
        if denominator > 0:
            gi_star[i] = numerator / denominator
    return gi_star

np.random.seed(42)
grid_size = 8
gx, gy = np.meshgrid(range(grid_size), range(grid_size))
coords = np.column_stack([gx.ravel(), gy.ravel()]).astype(float) * 50
values = np.random.poisson(10, len(coords)).astype(float)
for i in range(len(coords)):
    if coords[i, 0] > 200 and coords[i, 1] > 200:
        values[i] += np.random.poisson(25)

gi_star = getis_ord_gi_star(values, coords, distance_threshold=75)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# Mappa valori
gi_grid = gi_star.reshape(grid_size, grid_size)
val_grid = values.reshape(grid_size, grid_size)

im1 = ax1.imshow(val_grid, cmap="YlOrRd", origin="lower", interpolation="nearest")
ax1.set_title("Numero Reperti per Quadrante")
plt.colorbar(im1, ax=ax1, label="Reperti")

# Mappa Gi*
im2 = ax2.imshow(gi_grid, cmap="RdBu_r", origin="lower", interpolation="nearest",
                 vmin=-3, vmax=3)
ax2.set_title("Hot Spot Analysis (Gi*)")
plt.colorbar(im2, ax=ax2, label="Z-score Gi*")
ax2.contour(gi_grid, levels=[1.96], colors=["yellow"], linewidths=2, linestyles=["--"])
ax2.contour(gi_grid, levels=[-1.96], colors=["cyan"], linewidths=2, linestyles=["--"])

for ax in [ax1, ax2]:
    ax.set_xlabel("Colonna")
    ax.set_ylabel("Riga")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-analisi-di-autocorrelazione-spaziale"] = {
  title: "Analisi di Autocorrelazione Spaziale",
  content: [
    { tag: "h2", text: "Indice di Moran I" },
    { tag: "p", text: "L'indice di Moran I misura l'autocorrelazione spaziale globale: valori simili tendono ad essere vicini (I positivo) o distanti (I negativo)? Implementiamolo con NumPy." },
    { code: `import numpy as np

def morans_i(values, coords, distance_threshold):
    """
    Calcola l'indice di Moran I globale.
    I > 0: autocorrelazione positiva (cluster di valori simili)
    I ~ 0: distribuzione casuale
    I < 0: autocorrelazione negativa (valori dissimili vicini)
    """
    n = len(values)
    x = values - values.mean()

    # Matrice pesi
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    distances = np.sqrt((diff ** 2).sum(axis=2))
    W = (distances <= distance_threshold).astype(float)
    np.fill_diagonal(W, 0)

    w_sum = W.sum()
    numerator = n * np.sum(W * np.outer(x, x))
    denominator = w_sum * np.sum(x ** 2)

    I = numerator / denominator if denominator != 0 else 0

    # Valore atteso e varianza sotto ipotesi nulla
    E_I = -1 / (n - 1)

    # Z-score semplificato
    S1 = 0.5 * np.sum((W + W.T) ** 2)
    S2 = np.sum((W.sum(axis=1) + W.sum(axis=0)) ** 2)
    s2 = np.sum(x ** 2) / n
    s4 = np.sum(x ** 4) / n
    b2 = s4 / s2 ** 2

    E_I2_num = n * ((n**2 - 3*n + 3)*S1 - n*S2 + 3*w_sum**2) - b2*(n*(n-1)*S1 - 2*n*S2 + 6*w_sum**2)
    E_I2_den = (n-1)*(n-2)*(n-3)*w_sum**2
    V_I = E_I2_num / E_I2_den - E_I**2 if E_I2_den != 0 else 0.01

    z = (I - E_I) / np.sqrt(abs(V_I)) if V_I != 0 else 0

    return I, E_I, z

# Dataset: densita reperti in quadranti con pattern spaziale
np.random.seed(42)
grid_size = 7
gx, gy = np.meshgrid(range(grid_size), range(grid_size))
coords = np.column_stack([gx.ravel(), gy.ravel()]).astype(float)

# Valori con autocorrelazione spaziale positiva
# (quadranti vicini hanno valori simili)
base = np.zeros(len(coords))
for i in range(len(coords)):
    base[i] = 5 * coords[i, 0] + 3 * coords[i, 1]
values = base + np.random.normal(0, 3, len(coords))

I, E_I, z = morans_i(values, coords, distance_threshold=1.5)

print("=== Moran I - Autocorrelazione Spaziale ===")
print("N quadranti: " + str(len(coords)))
print("Soglia distanza: 1.5")
print("\\nMoran I = " + str(round(I, 4)))
print("E[I] = " + str(round(E_I, 4)) + " (valore atteso sotto H0)")
print("Z-score = " + str(round(z, 2)))

if abs(z) > 1.96:
    if I > E_I:
        print("\\nRisultato: Autocorrelazione POSITIVA significativa (p < 0.05)")
        print("-> Valori simili tendono a raggrupparsi nello spazio")
    else:
        print("\\nRisultato: Autocorrelazione NEGATIVA significativa (p < 0.05)")
        print("-> Valori dissimili tendono a essere vicini")
else:
    print("\\nRisultato: Nessuna autocorrelazione significativa")` },
  ]
};

LESSONS["python-c3-analisi-delle-k-funzioni-di-ripley"] = {
  title: "Analisi delle K-funzioni di Ripley",
  content: [
    { tag: "h2", text: "K-function di Ripley" },
    { tag: "p", text: "La K-function di Ripley misura il clustering a diverse scale di distanza. Confrontando K(d) osservato con K(d) atteso sotto Complete Spatial Randomness (CSR), possiamo identificare a quale scala avviene il clustering." },
    { code: `import numpy as np

def ripley_k(coords, distances, area):
    """Calcola K(d) e L(d) di Ripley"""
    n = len(coords)
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist_matrix = np.sqrt((diff ** 2).sum(axis=2))

    K = np.zeros(len(distances))
    for di, d in enumerate(distances):
        count = np.sum(dist_matrix < d) - n  # escludi diagonale
        K[di] = area * count / (n * (n - 1))

    # L(d) = sqrt(K(d)/pi) - d (linearizzazione)
    L = np.sqrt(K / np.pi) - distances

    # K atteso sotto CSR
    K_csr = np.pi * distances ** 2

    return K, L, K_csr

# Punti con clustering evidente
np.random.seed(42)
cluster1 = np.random.normal([150, 150], 20, (25, 2))
cluster2 = np.random.normal([350, 300], 25, (20, 2))
scatter = np.random.uniform(0, 500, (10, 2))
coords = np.vstack([cluster1, cluster2, scatter])

area = 500 * 500
distances = np.linspace(5, 200, 40)

K, L, K_csr = ripley_k(coords, distances, area)

print("=== Ripley K-function ===")
print("N punti: " + str(len(coords)))
print("Area: " + str(area) + " m2")
print("\\nDistanza  K(d)      K_csr     L(d)")
print("-" * 45)
for i in range(0, len(distances), 8):
    d = distances[i]
    print(str(round(d, 0)).rjust(6) + "    " + str(round(K[i], 0)).rjust(8) + "  " + str(round(K_csr[i], 0)).rjust(8) + "  " + str(round(L[i], 1)).rjust(8))

# Distanza con massimo clustering
max_L_idx = np.argmax(L)
print("\\nMassimo clustering a distanza: " + str(round(distances[max_L_idx], 0)) + " m")
print("L(d) max = " + str(round(L[max_L_idx], 1)))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

def ripley_k(coords, distances, area):
    n = len(coords)
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist_matrix = np.sqrt((diff ** 2).sum(axis=2))
    K = np.zeros(len(distances))
    for di, d in enumerate(distances):
        count = np.sum(dist_matrix < d) - n
        K[di] = area * count / (n * (n - 1))
    L = np.sqrt(K / np.pi) - distances
    K_csr = np.pi * distances ** 2
    return K, L, K_csr

np.random.seed(42)
cluster1 = np.random.normal([150, 150], 20, (25, 2))
cluster2 = np.random.normal([350, 300], 25, (20, 2))
scatter = np.random.uniform(0, 500, (10, 2))
coords = np.vstack([cluster1, cluster2, scatter])

area = 500 * 500
distances = np.linspace(5, 200, 40)
K, L, K_csr = ripley_k(coords, distances, area)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# L(d) function
ax1.plot(distances, L, color="#e74c3c", linewidth=2, label="L(d) osservato")
ax1.axhline(0, color="#f39c12", linestyle="--", linewidth=1, label="CSR (L=0)")
ax1.fill_between(distances, L, 0, where=L > 0, alpha=0.2, color="#e74c3c", label="Clustering")
ax1.fill_between(distances, L, 0, where=L < 0, alpha=0.2, color="#3498db", label="Dispersione")
ax1.set_xlabel("Distanza (m)")
ax1.set_ylabel("L(d)")
ax1.set_title("Funzione L di Ripley")
ax1.legend()
ax1.grid(True, alpha=0.2)

# Mappa punti
ax2.scatter(coords[:, 0], coords[:, 1], c="#3498db", s=30, alpha=0.7)
max_L_idx = np.argmax(L)
for cl_center in [coords[:25].mean(axis=0), coords[25:45].mean(axis=0)]:
    circle = plt.Circle(cl_center, distances[max_L_idx], fill=False,
                        edgecolor="#e74c3c", linewidth=1.5, linestyle="--")
    ax2.add_patch(circle)
ax2.set_xlabel("Est (m)")
ax2.set_ylabel("Nord (m)")
ax2.set_title("Punti con Raggio di Max Clustering")
ax2.set_aspect("equal")
ax2.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-z-score-e-significativita-statistica"] = {
  title: "Z-score e Significativita Statistica",
  content: [
    { tag: "h2", text: "Test di Significativita Statistica" },
    { tag: "p", text: "Lo Z-score ci dice quante deviazioni standard un valore si discosta dalla media. In archeologia, lo usiamo per testare se i pattern osservati sono statisticamente significativi o casuali." },
    { code: `import numpy as np

def z_test_two_samples(sample1, sample2):
    """Test Z per due campioni indipendenti"""
    n1, n2 = len(sample1), len(sample2)
    mean1, mean2 = np.mean(sample1), np.mean(sample2)
    std1, std2 = np.std(sample1, ddof=1), np.std(sample2, ddof=1)

    se = np.sqrt(std1**2/n1 + std2**2/n2)
    z = (mean1 - mean2) / se

    # p-value approssimato (distribuzione normale)
    p = 2 * (1 - 0.5 * (1 + np.sign(abs(z)) * (1 - np.exp(-2 * abs(z)**2 / np.pi))))

    return z, p, mean1, mean2, se

# Confronto profondita reperti: Settore A vs Settore B
np.random.seed(42)
settore_A = np.random.normal(0.85, 0.20, 35)  # piu profondi
settore_B = np.random.normal(0.65, 0.25, 30)  # meno profondi

z, p, m1, m2, se = z_test_two_samples(settore_A, settore_B)

print("=== Test Z: Profondita Settore A vs Settore B ===")
print("\\nSettore A: n=" + str(len(settore_A)) + ", media=" + str(round(m1, 3)) + " m")
print("Settore B: n=" + str(len(settore_B)) + ", media=" + str(round(m2, 3)) + " m")
print("Differenza: " + str(round(m1 - m2, 3)) + " m")
print("\\nZ-score: " + str(round(z, 3)))
print("Errore standard: " + str(round(se, 4)))

alpha = 0.05
print("\\n--- Risultato (alpha = " + str(alpha) + ") ---")
if abs(z) > 1.96:
    print("Z = " + str(round(z, 2)) + " > 1.96")
    print("SIGNIFICATIVO: le profondita dei due settori sono diverse")
    if z > 0:
        print("Il Settore A e significativamente piu profondo del Settore B")
    else:
        print("Il Settore B e significativamente piu profondo del Settore A")
else:
    print("NON significativo: non possiamo concludere che i settori differiscano")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Visualizzazione della distribuzione normale e aree critiche
x = np.linspace(-4, 4, 200)
y = np.exp(-x**2 / 2) / np.sqrt(2 * np.pi)

fig, ax = plt.subplots(figsize=(10, 5))

# Distribuzione
ax.plot(x, y, color="white", linewidth=2)
ax.fill_between(x, y, alpha=0.1, color="white")

# Zona di accettazione
mask_accept = (x >= -1.96) & (x <= 1.96)
ax.fill_between(x[mask_accept], y[mask_accept], alpha=0.3, color="#2ecc71", label="Accettazione (95%)")

# Zone di rifiuto
mask_left = x < -1.96
mask_right = x > 1.96
ax.fill_between(x[mask_left], y[mask_left], alpha=0.5, color="#e74c3c", label="Rifiuto H0 (p < 0.05)")
ax.fill_between(x[mask_right], y[mask_right], alpha=0.5, color="#e74c3c")

# Linee critiche
ax.axvline(-1.96, color="#f39c12", linestyle="--", linewidth=1.5, label="z = +/-1.96")
ax.axvline(1.96, color="#f39c12", linestyle="--", linewidth=1.5)

# Z osservato (esempio)
z_obs = 3.2
ax.axvline(z_obs, color="#9b59b6", linewidth=2, label="Z osservato = " + str(z_obs))
ax.annotate("Significativo!", (z_obs, 0.15), fontsize=11, color="#9b59b6",
            xytext=(z_obs + 0.3, 0.25), arrowprops={"arrowstyle": "->", "color": "#9b59b6"})

ax.set_xlabel("Z-score")
ax.set_ylabel("Densita di Probabilita")
ax.set_title("Test di Significativita Statistica (due code, alpha = 0.05)")
ax.legend(loc="upper left")
ax.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c3-esercizi-pratici"] = {
  title: "Esercizi Pratici di Statistica",
  content: [
    { tag: "h2", text: "Esercizi: Analisi Statistiche Archeologiche" },
    { tag: "h3", text: "Esercizio 1: Analisi completa di un dataset" },
    { code: `import numpy as np
import statistics

# Dataset: lunghezze (cm) di punte di freccia da 3 strati
np.random.seed(42)
strato_1 = np.random.normal(4.5, 0.8, 20).round(1)  # superiore (recente)
strato_2 = np.random.normal(5.2, 0.6, 25).round(1)  # intermedio
strato_3 = np.random.normal(6.0, 1.0, 15).round(1)  # inferiore (antico)

print("=== Analisi Punte di Freccia per Strato ===")
for nome, dati in [("Strato 1 (recente)", strato_1), ("Strato 2 (medio)", strato_2), ("Strato 3 (antico)", strato_3)]:
    q1, med, q3 = np.percentile(dati, [25, 50, 75])
    print("\\n" + nome + ":")
    print("  N: " + str(len(dati)))
    print("  Media: " + str(round(np.mean(dati), 2)) + " cm")
    print("  Mediana: " + str(round(med, 2)) + " cm")
    print("  Dev. Std: " + str(round(np.std(dati, ddof=1), 2)) + " cm")
    print("  IQR: " + str(round(q3 - q1, 2)) + " cm")

# Test: le punte diventano piu corte nel tempo?
tutte = np.concatenate([strato_1, strato_2, strato_3])
trend = np.polyfit([1]*20 + [2]*25 + [3]*15, tutte, 1)
print("\\n=== Trend Temporale ===")
print("Coefficiente: " + str(round(trend[0], 2)) + " cm/strato")
if trend[0] > 0:
    print("Le punte AUMENTANO di dimensione andando in profondita (piu antiche = piu grandi)")
else:
    print("Le punte DIMINUISCONO di dimensione andando in profondita")` },
    { tag: "h3", text: "Esercizio 2: NNA su dati reali" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

def calc_nni(coords):
    n = len(coords)
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    np.fill_diagonal(dist, np.inf)
    nn_dist = dist.min(axis=1)
    d_obs = nn_dist.mean()
    bbox = coords.max(axis=0) - coords.min(axis=0)
    area = bbox[0] * bbox[1]
    density = n / area
    d_exp = 0.5 / np.sqrt(density)
    R = d_obs / d_exp
    return R, nn_dist

# Simuliamo 3 scenari di distribuzione di tombe
np.random.seed(42)

# Scenario A: Necropoli organizzata (file ordinate)
gx, gy = np.meshgrid(np.linspace(0, 100, 6), np.linspace(0, 80, 5))
org = np.column_stack([gx.ravel(), gy.ravel()]) + np.random.normal(0, 3, (30, 2))

# Scenario B: Tombe a cluster familiare
fam1 = np.random.normal([30, 40], 8, (12, 2))
fam2 = np.random.normal([80, 70], 6, (10, 2))
fam3 = np.random.normal([60, 20], 10, (8, 2))
cluster = np.vstack([fam1, fam2, fam3])

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

for ax, data, titolo in [(axes[0], org, "Necropoli Organizzata"), (axes[1], cluster, "Tombe a Cluster")]:
    R, nn_dist = calc_nni(data)
    ax.scatter(data[:, 0], data[:, 1], c="#3498db", s=40, alpha=0.7)
    tipo = "Dispersed" if R > 1 else "Clustered" if R < 0.9 else "Random"
    ax.set_title(titolo + "\\nR = " + str(round(R, 2)) + " (" + tipo + ")")
    ax.set_xlabel("Est (m)")
    ax.set_ylabel("Nord (m)")
    ax.set_aspect("equal")
    ax.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()` },
  ]
};

// ============================================================================
// CHAPTER 4: Analisi Spaziale Avanzata
// ============================================================================

LESSONS["python-c4-introduzione"] = {
  title: "Introduzione all'Analisi Spaziale Avanzata",
  content: [
    { tag: "h2", text: "Analisi Spaziale Avanzata in Python Puro" },
    { tag: "p", text: "In questo capitolo implementeremo algoritmi di analisi spaziale avanzata usando solo Python, NumPy e Matplotlib: viewshed (analisi di visibilita), cost surface, pattern di insediamento, analisi predittiva, grafi di rete e diagrammi di Voronoi." },
    { code: `import numpy as np

# Creiamo un DEM (Digital Elevation Model) sintetico
np.random.seed(42)
size = 50
x = np.linspace(0, 10, size)
y = np.linspace(0, 10, size)
X, Y = np.meshgrid(x, y)

# Terreno con colline e valli
dem = (3 * np.sin(X * 0.8) * np.cos(Y * 0.6) +
       2 * np.exp(-((X - 3)**2 + (Y - 7)**2) / 3) +
       1.5 * np.exp(-((X - 8)**2 + (Y - 3)**2) / 2) +
       np.random.normal(0, 0.1, (size, size)))

print("=== DEM Sintetico ===")
print("Dimensioni: " + str(dem.shape))
print("Altitudine min: " + str(round(dem.min(), 2)) + " m")
print("Altitudine max: " + str(round(dem.max(), 2)) + " m")
print("Altitudine media: " + str(round(dem.mean(), 2)) + " m")
print("\\nQuesto DEM rappresenta un'area di " + str(int(x[-1] - x[0])) + " x " + str(int(y[-1] - y[0])) + " km")
print("con risoluzione " + str(round((x[1]-x[0])*1000, 0)) + " m per cella")` },
  ]
};

LESSONS["python-c4-analisi-di-visibilita-viewshed"] = {
  title: "Analisi di Visibilita (Viewshed)",
  content: [
    { tag: "h2", text: "Viewshed: Cosa si vede da un punto?" },
    { tag: "p", text: "L'analisi di visibilita (viewshed) determina quali aree del terreno sono visibili da un punto di osservazione. Implementiamo un algoritmo line-of-sight su un DEM rappresentato come array NumPy 2D." },
    { code: `import numpy as np

def compute_viewshed(dem, obs_row, obs_col, obs_height=2.0):
    """
    Calcola il viewshed da un punto di osservazione sul DEM.
    obs_height: altezza dell'osservatore sopra il terreno (m)
    Restituisce: array booleano (True = visibile)
    """
    rows, cols = dem.shape
    visible = np.zeros((rows, cols), dtype=bool)
    visible[obs_row, obs_col] = True
    obs_elev = dem[obs_row, obs_col] + obs_height

    for r in range(rows):
        for c in range(cols):
            if r == obs_row and c == obs_col:
                continue

            # Line of sight: cammina dal punto di osservazione al target
            n_steps = max(abs(r - obs_row), abs(c - obs_col))
            if n_steps == 0:
                continue

            max_angle = -np.inf
            is_visible = True

            for step in range(1, n_steps + 1):
                # Punto intermedio
                frac = step / n_steps
                ir = obs_row + frac * (r - obs_row)
                ic = obs_col + frac * (c - obs_col)

                # Interpolazione bilineare semplificata
                ri, ci = int(round(ir)), int(round(ic))
                ri = max(0, min(ri, rows - 1))
                ci = max(0, min(ci, cols - 1))

                if step < n_steps:
                    # Punto intermedio: controlla se blocca la vista
                    dist = np.sqrt((ir - obs_row)**2 + (ic - obs_col)**2)
                    if dist > 0:
                        angle = (dem[ri, ci] - obs_elev) / dist
                        if angle > max_angle:
                            max_angle = angle
                else:
                    # Punto target
                    dist = np.sqrt((r - obs_row)**2 + (c - obs_col)**2)
                    if dist > 0:
                        target_angle = (dem[r, c] - obs_elev) / dist
                        is_visible = target_angle >= max_angle

            visible[r, c] = is_visible

    return visible

# DEM sintetico
np.random.seed(42)
size = 30
x = np.linspace(0, 5, size)
y = np.linspace(0, 5, size)
X, Y = np.meshgrid(x, y)
dem = (2 * np.sin(X) * np.cos(Y * 0.8) +
       3 * np.exp(-((X-2)**2 + (Y-3)**2)/1.5) +
       np.random.normal(0, 0.05, (size, size)))

# Punto di osservazione: sulla collina
obs_r, obs_c = 18, 12
viewshed = compute_viewshed(dem, obs_r, obs_c, obs_height=2.0)

pct = 100 * viewshed.sum() / viewshed.size
print("=== Analisi Viewshed ===")
print("DEM: " + str(size) + "x" + str(size) + " celle")
print("Osservatore: riga " + str(obs_r) + ", col " + str(obs_c))
print("Altitudine osservatore: " + str(round(dem[obs_r, obs_c], 2)) + " m + 2m")
print("Area visibile: " + str(round(pct, 1)) + "% del territorio")
print("Celle visibili: " + str(viewshed.sum()) + " / " + str(viewshed.size))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
size = 30
x = np.linspace(0, 5, size)
y = np.linspace(0, 5, size)
X, Y = np.meshgrid(x, y)
dem = (2 * np.sin(X) * np.cos(Y * 0.8) +
       3 * np.exp(-((X-2)**2 + (Y-3)**2)/1.5) +
       np.random.normal(0, 0.05, (size, size)))

def compute_viewshed(dem, obs_row, obs_col, obs_height=2.0):
    rows, cols = dem.shape
    visible = np.zeros((rows, cols), dtype=bool)
    visible[obs_row, obs_col] = True
    obs_elev = dem[obs_row, obs_col] + obs_height
    for r in range(rows):
        for c in range(cols):
            if r == obs_row and c == obs_col:
                continue
            n_steps = max(abs(r - obs_row), abs(c - obs_col))
            if n_steps == 0:
                continue
            max_angle = -np.inf
            is_visible = True
            for step in range(1, n_steps + 1):
                frac = step / n_steps
                ir = obs_row + frac * (r - obs_row)
                ic = obs_col + frac * (c - obs_col)
                ri = max(0, min(int(round(ir)), rows - 1))
                ci = max(0, min(int(round(ic)), cols - 1))
                if step < n_steps:
                    dist = np.sqrt((ir - obs_row)**2 + (ic - obs_col)**2)
                    if dist > 0:
                        angle = (dem[ri, ci] - obs_elev) / dist
                        if angle > max_angle:
                            max_angle = angle
                else:
                    dist = np.sqrt((r - obs_row)**2 + (c - obs_col)**2)
                    if dist > 0:
                        target_angle = (dem[r, c] - obs_elev) / dist
                        is_visible = target_angle >= max_angle
            visible[r, c] = is_visible
    return visible

obs_r, obs_c = 18, 12
viewshed = compute_viewshed(dem, obs_r, obs_c, obs_height=2.0)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# DEM
im1 = ax1.imshow(dem, cmap="terrain", origin="lower", extent=[0, 5, 0, 5])
ax1.plot(x[obs_c], y[obs_r], "r*", markersize=15, label="Osservatore")
plt.colorbar(im1, ax=ax1, label="Altitudine (m)")
ax1.set_title("Modello Digitale del Terreno")
ax1.legend()

# Viewshed
vis_display = np.ma.masked_where(~viewshed, dem)
ax2.imshow(dem, cmap="terrain", origin="lower", extent=[0, 5, 0, 5], alpha=0.3)
ax2.imshow(vis_display, cmap="YlOrRd", origin="lower", extent=[0, 5, 0, 5], alpha=0.6)
ax2.plot(x[obs_c], y[obs_r], "r*", markersize=15, label="Osservatore")
ax2.set_title("Viewshed (aree visibili in giallo/rosso)")
ax2.legend()

for ax in [ax1, ax2]:
    ax.set_xlabel("Est (km)")
    ax.set_ylabel("Nord (km)")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-analisi-di-costo-superficie-cost-surfac"] = {
  title: "Analisi di Costo-Superficie",
  content: [
    { tag: "h2", text: "Cost Surface e Percorso di Costo Minimo" },
    { tag: "p", text: "L'analisi di costo-superficie calcola il 'costo' di attraversamento del terreno (basato su pendenza, vegetazione, etc.) e trova il percorso ottimale tra due punti usando l'algoritmo di Dijkstra." },
    { code: `import numpy as np
import heapq

def create_cost_surface(dem):
    """Crea superficie di costo basata sulla pendenza"""
    rows, cols = dem.shape
    # Calcola pendenza (gradiente)
    grad_y, grad_x = np.gradient(dem)
    slope = np.sqrt(grad_x**2 + grad_y**2)
    # Costo = 1 + pendenza (pendenze ripide costano di piu)
    cost = 1.0 + slope * 5.0
    return cost

def dijkstra_path(cost_surface, start, end):
    """Trova il percorso di costo minimo con Dijkstra"""
    rows, cols = cost_surface.shape
    dist = np.full((rows, cols), np.inf)
    dist[start] = 0
    prev = np.full((rows, cols, 2), -1, dtype=int)
    visited = np.zeros((rows, cols), dtype=bool)

    # Priority queue: (costo, riga, colonna)
    pq = [(0, start[0], start[1])]

    # 8 direzioni
    dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    diag = np.sqrt(2)

    while pq:
        d, r, c = heapq.heappop(pq)
        if visited[r, c]:
            continue
        visited[r, c] = True

        if (r, c) == end:
            break

        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not visited[nr, nc]:
                step_dist = diag if (dr != 0 and dc != 0) else 1.0
                new_dist = d + cost_surface[nr, nc] * step_dist
                if new_dist < dist[nr, nc]:
                    dist[nr, nc] = new_dist
                    prev[nr, nc] = [r, c]
                    heapq.heappush(pq, (new_dist, nr, nc))

    # Ricostruisci percorso
    path = []
    r, c = end
    while (r, c) != start and prev[r, c, 0] != -1:
        path.append((r, c))
        r, c = prev[r, c]
    path.append(start)
    path.reverse()

    return path, dist

# DEM sintetico con montagna centrale
np.random.seed(42)
size = 40
x = np.linspace(0, 8, size)
y = np.linspace(0, 8, size)
X, Y = np.meshgrid(x, y)
dem = (4 * np.exp(-((X-4)**2 + (Y-4)**2)/3) +
       np.random.normal(0, 0.1, (size, size)))

cost = create_cost_surface(dem)
start = (5, 5)
end = (35, 35)

path, dist_map = dijkstra_path(cost, start, end)

print("=== Cost Surface Analysis ===")
print("DEM: " + str(size) + "x" + str(size))
print("Costo min: " + str(round(cost.min(), 2)))
print("Costo max: " + str(round(cost.max(), 2)))
print("\\nPercorso da " + str(start) + " a " + str(end) + ":")
print("  Lunghezza: " + str(len(path)) + " celle")
print("  Costo totale: " + str(round(dist_map[end], 2)))
print("  Costo diretto (linea retta): " + str(round(np.sqrt((end[0]-start[0])**2 + (end[1]-start[1])**2) * cost.mean(), 2)))
print("  Risparmio: il percorso aggira la montagna!")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import heapq

plt.style.use("dark_background")

np.random.seed(42)
size = 40
x = np.linspace(0, 8, size)
y = np.linspace(0, 8, size)
X, Y = np.meshgrid(x, y)
dem = 4 * np.exp(-((X-4)**2 + (Y-4)**2)/3) + np.random.normal(0, 0.1, (size, size))

grad_y, grad_x = np.gradient(dem)
slope = np.sqrt(grad_x**2 + grad_y**2)
cost = 1.0 + slope * 5.0

def dijkstra_path(cs, s, e):
    rows, cols = cs.shape
    dist = np.full((rows, cols), np.inf)
    dist[s] = 0
    prev = np.full((rows, cols, 2), -1, dtype=int)
    visited = np.zeros((rows, cols), dtype=bool)
    pq = [(0, s[0], s[1])]
    dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    dg = np.sqrt(2)
    while pq:
        d, r, c = heapq.heappop(pq)
        if visited[r, c]:
            continue
        visited[r, c] = True
        if (r, c) == e:
            break
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not visited[nr, nc]:
                sd = dg if (dr != 0 and dc != 0) else 1.0
                nd = d + cs[nr, nc] * sd
                if nd < dist[nr, nc]:
                    dist[nr, nc] = nd
                    prev[nr, nc] = [r, c]
                    heapq.heappush(pq, (nd, nr, nc))
    path = []
    r, c = e
    while (r, c) != s and prev[r, c, 0] != -1:
        path.append((r, c))
        r, c = prev[r, c]
    path.append(s)
    path.reverse()
    return path, dist

start = (5, 5)
end = (35, 35)
path, dist_map = dijkstra_path(cost, start, end)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# Cost surface
im1 = ax1.imshow(cost, cmap="YlOrRd", origin="lower")
path_arr = np.array(path)
ax1.plot(path_arr[:, 1], path_arr[:, 0], "w-", linewidth=2, label="Percorso ottimale")
ax1.plot(start[1], start[0], "go", markersize=10, label="Partenza")
ax1.plot(end[1], end[0], "r*", markersize=12, label="Arrivo")
plt.colorbar(im1, ax=ax1, label="Costo")
ax1.set_title("Superficie di Costo + Percorso")
ax1.legend(fontsize=8)

# Accumulated cost
im2 = ax2.imshow(np.minimum(dist_map, np.percentile(dist_map[dist_map < np.inf], 99)),
                  cmap="plasma", origin="lower")
ax2.plot(path_arr[:, 1], path_arr[:, 0], "w-", linewidth=2)
ax2.plot(start[1], start[0], "go", markersize=10)
ax2.plot(end[1], end[0], "r*", markersize=12)
plt.colorbar(im2, ax=ax2, label="Costo Accumulato")
ax2.set_title("Costo Accumulato dalla Partenza")

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-analisi-dei-pattern-di-insediamento"] = {
  title: "Analisi dei Pattern di Insediamento",
  content: [
    { tag: "h2", text: "Point Pattern Analysis" },
    { tag: "p", text: "L'analisi dei pattern di insediamento studia come i siti archeologici sono distribuiti nello spazio e perche. Combiniamo NNA, K-function e analisi di densita per un quadro completo." },
    { code: `import numpy as np

def analyze_settlement_pattern(coords, area_width, area_height):
    """Analisi completa del pattern di insediamento"""
    n = len(coords)
    area = area_width * area_height
    density = n / area

    # 1. Nearest Neighbor
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    np.fill_diagonal(dist, np.inf)
    nn_dist = dist.min(axis=1)
    d_obs = nn_dist.mean()
    d_exp = 0.5 / np.sqrt(density)
    R = d_obs / d_exp

    # 2. Centro medio e dispersione
    centro = coords.mean(axis=0)
    dist_centro = np.sqrt(((coords - centro)**2).sum(axis=1))
    std_dist = np.sqrt(np.sum((coords - centro)**2) / n)

    # 3. Coefficiente di variazione NN
    cv_nn = nn_dist.std() / nn_dist.mean()

    results = {
        "n_siti": n,
        "densita": density,
        "NNI_R": R,
        "centro": centro,
        "std_distance": std_dist,
        "cv_nn": cv_nn,
        "nn_mean": d_obs,
        "nn_expected": d_exp,
    }
    return results

# Simuliamo un paesaggio con insediamenti
np.random.seed(42)

# Insediamenti lungo un fiume (pattern lineare)
n_river = 15
river_x = np.linspace(100, 900, n_river) + np.random.normal(0, 20, n_river)
river_y = 300 + 50 * np.sin(river_x / 200) + np.random.normal(0, 15, n_river)

# Insediamenti su altura (cluster)
hill_x = np.random.normal(500, 40, 10)
hill_y = np.random.normal(700, 30, 10)

# Tutti i siti
all_coords = np.column_stack([
    np.concatenate([river_x, hill_x]),
    np.concatenate([river_y, hill_y])
])

results = analyze_settlement_pattern(all_coords, 1000, 1000)

print("=== Analisi Pattern di Insediamento ===")
print("N siti: " + str(results["n_siti"]))
print("Densita: " + str(round(results["densita"] * 1e6, 2)) + " siti/km2")
print("\\n--- Nearest Neighbor ---")
print("NNI (R): " + str(round(results["NNI_R"], 3)))
pattern = "Clustered" if results["NNI_R"] < 0.8 else "Random" if results["NNI_R"] < 1.2 else "Dispersed"
print("Pattern: " + pattern)
print("\\n--- Dispersione ---")
print("Centro medio: (" + str(round(results["centro"][0], 1)) + ", " + str(round(results["centro"][1], 1)) + ")")
print("Distanza standard: " + str(round(results["std_distance"], 1)) + " m")
print("CV distanza NN: " + str(round(results["cv_nn"], 3)))
if results["cv_nn"] > 1:
    print("  -> Alta variabilita: possibili sub-cluster")
else:
    print("  -> Bassa variabilita: distribuzione omogenea")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
n_river = 15
river_x = np.linspace(100, 900, n_river) + np.random.normal(0, 20, n_river)
river_y = 300 + 50 * np.sin(river_x / 200) + np.random.normal(0, 15, n_river)
hill_x = np.random.normal(500, 40, 10)
hill_y = np.random.normal(700, 30, 10)

fig, ax = plt.subplots(figsize=(10, 7))

# Sfondo: "fiume"
fx = np.linspace(0, 1000, 200)
fy = 300 + 50 * np.sin(fx / 200)
ax.fill_between(fx, fy - 30, fy + 30, alpha=0.15, color="#3498db", label="Fiume")
ax.plot(fx, fy, color="#3498db", alpha=0.4, linewidth=1)

# Sfondo: "collina"
circle = plt.Circle((500, 700), 80, fill=True, facecolor="#8B4513", alpha=0.15, label="Altura")
ax.add_patch(circle)

# Insediamenti
ax.scatter(river_x, river_y, c="#2ecc71", s=80, edgecolors="white", linewidth=0.5,
           label="Siti fluviali", zorder=5)
ax.scatter(hill_x, hill_y, c="#e74c3c", s=80, edgecolors="white", linewidth=0.5,
           label="Siti su altura", zorder=5)

# Centro medio
all_x = np.concatenate([river_x, hill_x])
all_y = np.concatenate([river_y, hill_y])
cx, cy = all_x.mean(), all_y.mean()
ax.scatter(cx, cy, c="#f39c12", s=200, marker="+", linewidths=3, zorder=6, label="Centro medio")

# Connessioni NN
coords = np.column_stack([all_x, all_y])
diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
dist = np.sqrt((diff ** 2).sum(axis=2))
np.fill_diagonal(dist, np.inf)
for i in range(len(coords)):
    j = np.argmin(dist[i])
    ax.plot([coords[i, 0], coords[j, 0]], [coords[i, 1], coords[j, 1]],
            "w-", alpha=0.2, linewidth=0.5)

ax.set_xlim(0, 1000)
ax.set_ylim(0, 1000)
ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Pattern di Insediamento: Siti Fluviali e di Altura")
ax.legend(loc="upper left", fontsize=9)
ax.set_aspect("equal")
ax.grid(True, alpha=0.1)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-analisi-predittiva-per-l-archeologia"] = {
  title: "Analisi Predittiva per l'Archeologia",
  content: [
    { tag: "h2", text: "Modello Predittivo con Regressione Logistica" },
    { tag: "p", text: "L'analisi predittiva in archeologia usa variabili ambientali (distanza da fiumi, pendenza, altitudine) per prevedere dove si trovano siti ancora non scoperti. Implementiamo una regressione logistica semplice con NumPy." },
    { code: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

def logistic_regression(X, y, lr=0.01, iterations=1000):
    """Regressione logistica con gradient descent"""
    n, m = X.shape
    weights = np.zeros(m)
    bias = 0

    for _ in range(iterations):
        z = X.dot(weights) + bias
        pred = sigmoid(z)
        dw = (1/n) * X.T.dot(pred - y)
        db = (1/n) * np.sum(pred - y)
        weights -= lr * dw
        bias -= lr * db

    return weights, bias

# Generiamo dati di training: variabili ambientali per celle del territorio
np.random.seed(42)
n_cells = 200

# Features: distanza_fiume, pendenza, altitudine (normalizzate)
dist_fiume = np.random.uniform(0, 1, n_cells)
pendenza = np.random.uniform(0, 1, n_cells)
altitudine = np.random.uniform(0, 1, n_cells)

# I siti tendono ad essere: vicini al fiume, bassa pendenza, altitudine media
prob = sigmoid(-3 * dist_fiume + 2 * (1 - pendenza) + 1.5 * (1 - np.abs(altitudine - 0.4)))
presenza = (np.random.random(n_cells) < prob).astype(float)

X = np.column_stack([dist_fiume, pendenza, altitudine])
y = presenza

# Training
weights, bias = logistic_regression(X, y, lr=0.1, iterations=2000)

# Predizioni
predictions = sigmoid(X.dot(weights) + bias)
predicted_class = (predictions > 0.5).astype(int)
accuracy = (predicted_class == y).mean()

print("=== Modello Predittivo Archeologico ===")
print("\\nPesi del modello:")
labels = ["Dist. Fiume", "Pendenza", "Altitudine"]
for i, (label, w) in enumerate(zip(labels, weights)):
    direction = "NEGATIVO" if w < 0 else "POSITIVO"
    print("  " + label + ": " + str(round(w, 3)) + " (" + direction + ")")
print("  Bias: " + str(round(bias, 3)))

print("\\nAccuratezza: " + str(round(accuracy * 100, 1)) + "%")
print("Siti reali: " + str(int(y.sum())) + " / " + str(n_cells))
print("Siti predetti: " + str(predicted_class.sum()) + " / " + str(n_cells))

# Interpretazione
print("\\n=== Interpretazione ===")
for label, w in zip(labels, weights):
    if abs(w) > 0.5:
        effect = "AUMENTA" if w > 0 else "DIMINUISCE"
        print("  " + label + " " + effect + " la probabilita di sito")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

def sigmoid(z):
    return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

# Creiamo una mappa predittiva
size = 50
x = np.linspace(0, 1, size)
y_ax = np.linspace(0, 1, size)
X_grid, Y_grid = np.meshgrid(x, y_ax)

# Feature maps sintetiche
dist_fiume = np.abs(Y_grid - 0.3 - 0.1 * np.sin(X_grid * 6))
pendenza = np.abs(np.gradient(3 * np.exp(-((X_grid-0.5)**2 + (Y_grid-0.7)**2)/0.1))[0])
altitudine = 0.3 + 0.4 * np.exp(-((X_grid-0.5)**2 + (Y_grid-0.7)**2)/0.1)

# Pesi (come dal modello)
weights = np.array([-2.5, -1.8, 0.8])
bias = 1.5

features = np.stack([dist_fiume, pendenza, altitudine], axis=-1)
z = np.sum(features * weights, axis=-1) + bias
prob_map = sigmoid(z)

# Siti "noti" (training)
np.random.seed(42)
known_x = np.random.uniform(0.1, 0.9, 15)
known_y = np.random.uniform(0.1, 0.9, 15)

fig, axes = plt.subplots(1, 3, figsize=(15, 5))

im0 = axes[0].imshow(dist_fiume, cmap="Blues_r", origin="lower", extent=[0, 1, 0, 1])
axes[0].set_title("Distanza dal Fiume")
plt.colorbar(im0, ax=axes[0])

im1 = axes[1].imshow(altitudine, cmap="terrain", origin="lower", extent=[0, 1, 0, 1])
axes[1].set_title("Altitudine")
plt.colorbar(im1, ax=axes[1])

im2 = axes[2].imshow(prob_map, cmap="RdYlGn", origin="lower", extent=[0, 1, 0, 1], vmin=0, vmax=1)
axes[2].contour(prob_map, levels=[0.5, 0.7, 0.9], colors=["white"], linewidths=0.5,
                extent=[0, 1, 0, 1], origin="lower")
axes[2].scatter(known_x, known_y, c="white", s=30, marker="^", edgecolors="black", linewidth=0.5, label="Siti noti")
axes[2].set_title("Mappa Predittiva")
axes[2].legend(fontsize=8)
plt.colorbar(im2, ax=axes[2], label="P(sito)")

for ax in axes:
    ax.set_xlabel("Est")
    ax.set_ylabel("Nord")

plt.suptitle("Modello Predittivo Archeologico", fontsize=13)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-analisi-della-rete-di-trasporto"] = {
  title: "Analisi della Rete di Trasporto",
  content: [
    { tag: "h2", text: "Grafi e Percorsi Ottimali" },
    { tag: "p", text: "Le reti di trasporto antiche (strade romane, vie commerciali) possono essere modellate come grafi. Ogni nodo e un insediamento, ogni arco e un collegamento con un costo (distanza, tempo di percorrenza)." },
    { code: `import heapq

def dijkstra(graph, start, end):
    """Shortest path su grafo con dizionario di adiacenza"""
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    prev = {node: None for node in graph}
    pq = [(0, start)]
    visited = set()

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        if u == end:
            break
        for v, w in graph[u]:
            if v not in visited and d + w < dist[v]:
                dist[v] = d + w
                prev[v] = u
                heapq.heappush(pq, (dist[v], v))

    path = []
    node = end
    while node is not None:
        path.append(node)
        node = prev[node]
    path.reverse()
    return path, dist[end]

# Rete stradale romana
# Grafo: nodo -> [(vicino, distanza_km)]
rete = {
    "Roma": [("Ostia", 30), ("Capua", 210), ("Arezzo", 250)],
    "Ostia": [("Roma", 30), ("Napoli", 230)],
    "Capua": [("Roma", 210), ("Napoli", 40), ("Benevento", 60)],
    "Napoli": [("Ostia", 230), ("Capua", 40), ("Pompei", 25), ("Paestum", 100)],
    "Pompei": [("Napoli", 25), ("Paestum", 80)],
    "Paestum": [("Napoli", 100), ("Pompei", 80)],
    "Benevento": [("Capua", 60), ("Brindisi", 200)],
    "Brindisi": [("Benevento", 200), ("Taranto", 70)],
    "Taranto": [("Brindisi", 70)],
    "Arezzo": [("Roma", 250), ("Firenze", 80)],
    "Firenze": [("Arezzo", 80)],
}

print("=== Rete Stradale Romana ===")
print("Nodi (citta): " + str(len(rete)))
n_archi = sum(len(v) for v in rete.values()) // 2
print("Archi (strade): " + str(n_archi))

# Percorsi piu brevi
coppie = [("Roma", "Pompei"), ("Firenze", "Brindisi"), ("Ostia", "Paestum")]
for partenza, arrivo in coppie:
    path, dist = dijkstra(rete, partenza, arrivo)
    print("\\n" + partenza + " -> " + arrivo + ":")
    print("  Percorso: " + " -> ".join(path))
    print("  Distanza: " + str(dist) + " km")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import heapq

plt.style.use("dark_background")

# Coordinate approssimative delle citta
posizioni = {
    "Roma": (12.5, 41.9), "Ostia": (12.3, 41.7), "Capua": (14.2, 41.1),
    "Napoli": (14.3, 40.8), "Pompei": (14.5, 40.7), "Paestum": (15.0, 40.4),
    "Benevento": (14.8, 41.1), "Brindisi": (17.9, 40.6), "Taranto": (17.2, 40.5),
    "Arezzo": (11.9, 43.5), "Firenze": (11.3, 43.8),
}

archi = [
    ("Roma", "Ostia"), ("Roma", "Capua"), ("Roma", "Arezzo"),
    ("Ostia", "Napoli"), ("Capua", "Napoli"), ("Capua", "Benevento"),
    ("Napoli", "Pompei"), ("Napoli", "Paestum"), ("Pompei", "Paestum"),
    ("Benevento", "Brindisi"), ("Brindisi", "Taranto"), ("Arezzo", "Firenze"),
]

# Percorso evidenziato: Firenze -> Brindisi
percorso = ["Firenze", "Arezzo", "Roma", "Capua", "Benevento", "Brindisi"]

fig, ax = plt.subplots(figsize=(10, 7))

# Disegna archi
for a, b in archi:
    x = [posizioni[a][0], posizioni[b][0]]
    y = [posizioni[a][1], posizioni[b][1]]
    ax.plot(x, y, "w-", alpha=0.3, linewidth=1)

# Evidenzia percorso ottimale
for i in range(len(percorso) - 1):
    a, b = percorso[i], percorso[i + 1]
    x = [posizioni[a][0], posizioni[b][0]]
    y = [posizioni[a][1], posizioni[b][1]]
    ax.plot(x, y, "-", color="#f39c12", linewidth=3, alpha=0.8)

# Disegna nodi
for nome, (x, y) in posizioni.items():
    color = "#e74c3c" if nome in percorso else "#3498db"
    size = 120 if nome in percorso else 80
    ax.scatter(x, y, c=color, s=size, zorder=5, edgecolors="white")
    ax.annotate(nome, (x, y), textcoords="offset points", xytext=(8, 8),
                fontsize=9, color="white")

ax.set_xlabel("Longitudine")
ax.set_ylabel("Latitudine")
ax.set_title("Rete Stradale Romana: Percorso Firenze -> Brindisi")
ax.grid(True, alpha=0.2)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-analisi-delle-aree-di-influenza-spaziale"] = {
  title: "Analisi delle Aree di Influenza Spaziale",
  content: [
    { tag: "h2", text: "Diagrammi di Voronoi" },
    { tag: "p", text: "I diagrammi di Voronoi partizionano lo spazio assegnando ogni punto all'insediamento piu vicino. In archeologia, questo modella i 'territori' o aree di influenza di ogni sito." },
    { code: `import numpy as np

def voronoi_grid(sites, grid_size=100, extent=(0, 1000, 0, 1000)):
    """Calcola Voronoi su una griglia raster"""
    x = np.linspace(extent[0], extent[1], grid_size)
    y = np.linspace(extent[2], extent[3], grid_size)
    X, Y = np.meshgrid(x, y)

    # Per ogni cella, trova il sito piu vicino
    assignment = np.zeros((grid_size, grid_size), dtype=int)
    min_dist = np.full((grid_size, grid_size), np.inf)

    for i, site in enumerate(sites):
        dist = np.sqrt((X - site[0])**2 + (Y - site[1])**2)
        mask = dist < min_dist
        assignment[mask] = i
        min_dist[mask] = dist[mask]

    # Calcola area di ogni regione
    cell_area = ((extent[1]-extent[0]) / grid_size) * ((extent[3]-extent[2]) / grid_size)
    areas = np.zeros(len(sites))
    for i in range(len(sites)):
        areas[i] = np.sum(assignment == i) * cell_area

    return assignment, areas, (X, Y)

# Insediamenti principali
np.random.seed(42)
nomi = ["Oppidum A", "Oppidum B", "Villa C", "Castrum D", "Pagus E", "Vicus F"]
sites = np.array([
    [200, 400], [500, 700], [800, 300],
    [300, 800], [700, 600], [500, 200],
])

assignment, areas, (X, Y) = voronoi_grid(sites, grid_size=100)
total_area = 1000 * 1000

print("=== Aree di Influenza (Voronoi) ===")
print("Territorio totale: " + str(total_area / 1e6) + " km2")
print("\\nSito             Coordinate    Area (m2)    % Territorio")
print("-" * 60)
for i, (nome, site) in enumerate(zip(nomi, sites)):
    pct = 100 * areas[i] / total_area
    print(nome.ljust(16) + " (" + str(site[0]) + "," + str(site[1]) + ")".ljust(12) +
          str(int(areas[i])).rjust(10) + str(round(pct, 1)).rjust(8) + "%")

# Sito con territorio piu grande
max_idx = np.argmax(areas)
print("\\nTerritorio piu grande: " + nomi[max_idx] + " (" + str(round(areas[max_idx]/1e4, 1)) + " ha)")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
nomi = ["Oppidum A", "Oppidum B", "Villa C", "Castrum D", "Pagus E", "Vicus F"]
sites = np.array([
    [200, 400], [500, 700], [800, 300],
    [300, 800], [700, 600], [500, 200],
])

# Voronoi su griglia
grid_size = 200
x = np.linspace(0, 1000, grid_size)
y = np.linspace(0, 1000, grid_size)
X, Y = np.meshgrid(x, y)

assignment = np.zeros((grid_size, grid_size), dtype=int)
min_dist = np.full((grid_size, grid_size), np.inf)
for i, site in enumerate(sites):
    dist = np.sqrt((X - site[0])**2 + (Y - site[1])**2)
    mask = dist < min_dist
    assignment[mask] = i
    min_dist[mask] = dist[mask]

fig, ax = plt.subplots(figsize=(8, 8))

colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"]
cmap = plt.cm.colors.ListedColormap(colors)
ax.imshow(assignment, cmap=cmap, origin="lower", extent=[0, 1000, 0, 1000], alpha=0.3)

# Confini Voronoi (dove cambia assegnazione)
boundary = np.zeros_like(assignment, dtype=bool)
boundary[1:, :] |= assignment[1:, :] != assignment[:-1, :]
boundary[:, 1:] |= assignment[:, 1:] != assignment[:, :-1]
boundary_y, boundary_x = np.where(boundary)
ax.scatter(boundary_x * 1000 / grid_size, boundary_y * 1000 / grid_size,
           c="white", s=0.1, alpha=0.5)

# Siti
for i, (nome, site) in enumerate(zip(nomi, sites)):
    ax.scatter(site[0], site[1], c=colors[i], s=150, edgecolors="white",
               linewidth=2, zorder=5)
    ax.annotate(nome, (site[0], site[1]), textcoords="offset points",
                xytext=(10, 10), fontsize=9, color="white", fontweight="bold")

ax.set_xlim(0, 1000)
ax.set_ylim(0, 1000)
ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Diagramma di Voronoi: Aree di Influenza")
ax.set_aspect("equal")
ax.grid(True, alpha=0.1)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-esercizi-pratici"] = {
  title: "Esercizi Pratici di Analisi Spaziale",
  content: [
    { tag: "h2", text: "Esercizi: Analisi Spaziale Avanzata" },
    { tag: "h3", text: "Esercizio 1: Viewshed multiplo" },
    { code: `import numpy as np

def quick_viewshed(dem, obs_r, obs_c, obs_h=2.0):
    rows, cols = dem.shape
    visible = np.zeros((rows, cols), dtype=bool)
    obs_elev = dem[obs_r, obs_c] + obs_h
    for r in range(rows):
        for c in range(cols):
            n_steps = max(abs(r - obs_r), abs(c - obs_c))
            if n_steps == 0:
                visible[r, c] = True
                continue
            max_a = -np.inf
            vis = True
            for s in range(1, n_steps + 1):
                frac = s / n_steps
                ir = int(round(obs_r + frac * (r - obs_r)))
                ic = int(round(obs_c + frac * (c - obs_c)))
                ir = max(0, min(ir, rows-1))
                ic = max(0, min(ic, cols-1))
                dist = max(np.sqrt((ir-obs_r)**2 + (ic-obs_c)**2), 0.001)
                angle = (dem[ir, ic] - obs_elev) / dist
                if s < n_steps:
                    if angle > max_a:
                        max_a = angle
                else:
                    vis = angle >= max_a
            visible[r, c] = vis
    return visible

# DEM piccolo
np.random.seed(42)
size = 20
X, Y = np.meshgrid(np.linspace(0, 5, size), np.linspace(0, 5, size))
dem = 2 * np.sin(X) * np.cos(Y * 0.7) + np.random.normal(0, 0.05, (size, size))

# 3 punti di osservazione (torri di guardia)
torri = [(5, 5), (5, 15), (15, 10)]

# Viewshed combinato
combined = np.zeros((size, size), dtype=bool)
for r, c in torri:
    vs = quick_viewshed(dem, r, c)
    combined |= vs
    pct = 100 * vs.sum() / vs.size
    print("Torre (" + str(r) + "," + str(c) + "): " + str(round(pct, 1)) + "% visibile")

pct_combined = 100 * combined.sum() / combined.size
print("\\nCopertura combinata: " + str(round(pct_combined, 1)) + "%")
print("Celle non visibili: " + str((~combined).sum()) + " / " + str(combined.size))` },
    { tag: "h3", text: "Esercizio 2: Analisi di accessibilita" },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Calcoliamo l'accessibilita: quanti siti sono raggiungibili entro r km?
np.random.seed(42)

# 20 insediamenti
n = 20
coords = np.random.uniform(0, 10, (n, 2))

# Matrice distanze
diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
dist = np.sqrt((diff ** 2).sum(axis=2))

# Per ogni raggio, conta i vicini accessibili
raggi = np.linspace(0.5, 5, 20)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# Mappa con cerchi di accessibilita
sito_focus = 5
ax1.scatter(coords[:, 0], coords[:, 1], c="#3498db", s=60, zorder=5, edgecolors="white")
ax1.scatter(coords[sito_focus, 0], coords[sito_focus, 1], c="#e74c3c", s=120, zorder=6, edgecolors="white")

for r, alpha in [(1, 0.3), (2, 0.2), (3, 0.1)]:
    circle = plt.Circle(coords[sito_focus], r, fill=True, facecolor="#e74c3c", alpha=alpha)
    ax1.add_patch(circle)
    n_within = np.sum(dist[sito_focus] <= r) - 1
    ax1.annotate(str(r) + " km: " + str(n_within) + " siti",
                 (coords[sito_focus, 0] + r * 0.7, coords[sito_focus, 1] + r * 0.7),
                 fontsize=8, color="white")

ax1.set_xlim(-1, 11)
ax1.set_ylim(-1, 11)
ax1.set_title("Accessibilita del Sito " + str(sito_focus))
ax1.set_aspect("equal")
ax1.grid(True, alpha=0.2)

# Grafico accessibilita media
mean_access = []
for r in raggi:
    neighbors = (dist <= r).sum(axis=1) - 1
    mean_access.append(neighbors.mean())

ax2.plot(raggi, mean_access, "o-", color="#2ecc71", linewidth=2)
ax2.axhline(n/2, color="#f39c12", linestyle="--", label="50% dei siti")
ax2.set_xlabel("Raggio (km)")
ax2.set_ylabel("N. medio siti accessibili")
ax2.set_title("Curva di Accessibilita Media")
ax2.legend()
ax2.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c4-integrazione-dei-risultati-delle-analisi"] = {
  title: "Integrazione dei Risultati delle Analisi Spaziali",
  content: [
    { tag: "h2", text: "Combinare le Analisi in un Report" },
    { tag: "p", text: "In un progetto reale, combiniamo diverse analisi spaziali per costruire un quadro completo. Ecco come integrare i risultati in un unico report strutturato." },
    { code: `import numpy as np
import json

# Simuliamo i risultati di diverse analisi
np.random.seed(42)

n_siti = 25
coords = np.random.uniform(0, 1000, (n_siti, 2))

# NNA
diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
dist = np.sqrt((diff ** 2).sum(axis=2))
np.fill_diagonal(dist, np.inf)
nn_dist = dist.min(axis=1)
d_obs = nn_dist.mean()
area = 1000 * 1000
density = n_siti / area
d_exp = 0.5 / np.sqrt(density)
R = d_obs / d_exp

# Centro e dispersione
centro = coords.mean(axis=0)
std_dist = np.sqrt(((coords - centro)**2).sum(axis=1).mean())

# Report completo
report = {
    "progetto": "Survey Valle del Tevere 2025",
    "data": "2026-04-01",
    "sommario": {
        "n_siti": n_siti,
        "area_km2": area / 1e6,
        "densita_siti_km2": round(density * 1e6, 2),
    },
    "distribuzione": {
        "NNI_R": round(R, 3),
        "pattern": "Clustered" if R < 0.8 else "Random" if R < 1.2 else "Dispersed",
        "centro_medio": [round(centro[0], 1), round(centro[1], 1)],
        "dispersione_media": round(std_dist, 1),
    },
    "raccomandazioni": [],
}

if R < 1:
    report["raccomandazioni"].append("Pattern raggruppato: indagare fattori di aggregazione")
report["raccomandazioni"].append("Prospezione raccomandata nelle aree a bassa densita")
report["raccomandazioni"].append("Analisi predittiva per identificare nuovi siti potenziali")

# Output
print("=== REPORT ANALISI SPAZIALE ===")
print(json.dumps(report, indent=2, ensure_ascii=False))

print("\\n=== Sommario ===")
print("Siti analizzati: " + str(report["sommario"]["n_siti"]))
print("Area: " + str(report["sommario"]["area_km2"]) + " km2")
print("Pattern: " + report["distribuzione"]["pattern"] + " (R=" + str(report["distribuzione"]["NNI_R"]) + ")")
print("\\nRaccomandazioni:")
for i, r in enumerate(report["raccomandazioni"]):
    print("  " + str(i+1) + ". " + r)` },
  ]
};

// ============================================================================
// CHAPTER 5: Automazione di Analisi Archeologiche
// ============================================================================

LESSONS["python-c5-introduzione"] = {
  title: "Introduzione all'Automazione",
  content: [
    { tag: "h2", text: "Automazione di Analisi Archeologiche" },
    { tag: "p", text: "Invece di ripetere manualmente le stesse analisi per ogni sito o campagna di scavo, possiamo creare pipeline automatizzate in Python. In questo capitolo impariamo a costruire script che leggono dati, eseguono analisi, creano grafici e generano report." },
    { tag: "h3", text: "Vantaggi dell'automazione" },
    { tag: "ul", items: [
      "Riproducibilita: stessi dati producono sempre gli stessi risultati",
      "Velocita: analisi su centinaia di siti in secondi",
      "Consistenza: tutti i siti sono analizzati allo stesso modo",
      "Documentazione: il codice e la documentazione dell'analisi",
    ]},
    { code: `import numpy as np
from collections import Counter

def analisi_rapida_sito(nome, reperti):
    """Pipeline di analisi automatica per un sito"""
    tipi = [r["tipo"] for r in reperti]
    profondita = [r["profondita"] for r in reperti]
    prof_arr = np.array(profondita)

    conteggio = Counter(tipi)
    tipo_principale = conteggio.most_common(1)[0]

    risultato = {
        "nome": nome,
        "n_reperti": len(reperti),
        "tipo_principale": tipo_principale[0],
        "tipo_principale_n": tipo_principale[1],
        "prof_media": round(float(np.mean(prof_arr)), 2),
        "prof_std": round(float(np.std(prof_arr)), 2),
        "prof_max": round(float(np.max(prof_arr)), 2),
        "tipi_unici": len(conteggio),
    }
    return risultato

# Dati simulati per 3 siti
np.random.seed(42)
siti_dati = {
    "Villa Romana": [
        {"tipo": np.random.choice(["Ceramica", "Metallo", "Vetro", "Osso"]),
         "profondita": round(float(np.random.normal(0.8, 0.3)), 2)}
        for _ in range(45)
    ],
    "Necropoli Etrusca": [
        {"tipo": np.random.choice(["Ceramica", "Metallo", "Osso", "Gioiello"]),
         "profondita": round(float(np.random.normal(1.5, 0.5)), 2)}
        for _ in range(30)
    ],
    "Castrum Medievale": [
        {"tipo": np.random.choice(["Ceramica", "Metallo", "Litico"]),
         "profondita": round(float(np.random.normal(0.5, 0.2)), 2)}
        for _ in range(60)
    ],
}

print("=== Pipeline Analisi Automatica ===")
print("Siti da analizzare: " + str(len(siti_dati)))
print()

risultati = []
for nome, reperti in siti_dati.items():
    r = analisi_rapida_sito(nome, reperti)
    risultati.append(r)
    print("--- " + r["nome"] + " ---")
    print("  Reperti: " + str(r["n_reperti"]))
    print("  Tipo principale: " + r["tipo_principale"] + " (" + str(r["tipo_principale_n"]) + ")")
    print("  Profondita: " + str(r["prof_media"]) + " +/- " + str(r["prof_std"]) + " m")
    print()

# Sommario comparativo
print("=== Sommario Comparativo ===")
sito_max = max(risultati, key=lambda x: x["n_reperti"])
print("Sito con piu reperti: " + sito_max["nome"] + " (" + str(sito_max["n_reperti"]) + ")")
sito_profondo = max(risultati, key=lambda x: x["prof_media"])
print("Sito piu profondo: " + sito_profondo["nome"] + " (" + str(sito_profondo["prof_media"]) + " m)")` },
  ]
};

LESSONS["python-c5-creazione-di-un-plugin-base-per-l-archeo"] = {
  title: "Pipeline di Analisi Completa",
  content: [
    { tag: "h2", text: "Costruire una Pipeline di Analisi" },
    { tag: "p", text: "Una pipeline di analisi legge i dati, li trasforma, esegue calcoli e produce output. Organizziamo il codice in funzioni riutilizzabili." },
    { code: `import csv
import io
import numpy as np
from collections import Counter

# Step 1: Lettura dati
def leggi_dati_csv(csv_text):
    reader = csv.DictReader(io.StringIO(csv_text))
    return list(reader)

# Step 2: Pulizia e validazione
def pulisci_dati(reperti):
    puliti = []
    errori = 0
    for r in reperti:
        try:
            r["profondita"] = float(r["profondita"])
            r["peso"] = float(r["peso"])
            if r["profondita"] < 0 or r["peso"] < 0:
                errori += 1
                continue
            puliti.append(r)
        except (ValueError, KeyError):
            errori += 1
    return puliti, errori

# Step 3: Analisi
def analizza(reperti):
    profs = np.array([r["profondita"] for r in reperti])
    pesi = np.array([r["peso"] for r in reperti])
    tipi = Counter(r["tipo"] for r in reperti)

    return {
        "n": len(reperti),
        "prof_media": round(float(profs.mean()), 2),
        "prof_mediana": round(float(np.median(profs)), 2),
        "peso_medio": round(float(pesi.mean()), 1),
        "tipi": dict(tipi.most_common()),
    }

# Step 4: Report testuale
def genera_report(analisi, nome_sito):
    lines = []
    lines.append("=" * 40)
    lines.append("REPORT: " + nome_sito)
    lines.append("=" * 40)
    lines.append("Reperti analizzati: " + str(analisi["n"]))
    lines.append("Profondita media: " + str(analisi["prof_media"]) + " m")
    lines.append("Profondita mediana: " + str(analisi["prof_mediana"]) + " m")
    lines.append("Peso medio: " + str(analisi["peso_medio"]) + " g")
    lines.append("\\nDistribuzione per tipo:")
    for tipo, n in analisi["tipi"].items():
        pct = round(100 * n / analisi["n"], 1)
        lines.append("  " + tipo + ": " + str(n) + " (" + str(pct) + "%)")
    return "\\n".join(lines)

# Esecuzione pipeline
csv_input = """id,tipo,profondita,peso,settore
1,Ceramica,0.45,120,A
2,Metallo,0.80,45,A
3,Ceramica,1.20,250,B
4,Osso,0.35,15,A
5,Ceramica,0.90,180,B
6,Vetro,1.50,30,C
7,Metallo,0.70,55,B
8,Ceramica,1.80,350,C
9,Ceramica,0.60,90,A
10,Osso,0.40,12,B
11,ERRORE,-0.5,abc,X
12,Metallo,0.95,65,A"""

print("=== Pipeline di Analisi ===")
raw = leggi_dati_csv(csv_input)
print("Step 1 - Dati letti: " + str(len(raw)) + " record")

puliti, errori = pulisci_dati(raw)
print("Step 2 - Pulizia: " + str(len(puliti)) + " validi, " + str(errori) + " errori")

analisi = analizza(puliti)
print("Step 3 - Analisi completata")

report = genera_report(analisi, "Saggio A - Area Nord")
print("Step 4 - Report generato\\n")
print(report)` },
  ]
};

LESSONS["python-c5-implementazione-di-un-tool-per-l-analisi"] = {
  title: "Elaborazione Batch di Piu Siti",
  content: [
    { tag: "h2", text: "Batch Processing: Analizzare Molti Siti" },
    { tag: "p", text: "Quando abbiamo dati da molti siti, il batch processing ci permette di analizzarli tutti automaticamente e confrontare i risultati." },
    { code: `import numpy as np
from collections import Counter

def batch_analysis(sites_data):
    """Analizza un batch di siti e produce statistiche comparative"""
    results = []

    for site_name, data in sites_data.items():
        coords = np.array(data["coords"])
        n = len(coords)

        # Centro
        centro = coords.mean(axis=0)

        # Dispersione
        dist_centro = np.sqrt(((coords - centro)**2).sum(axis=1))

        # NNI
        diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
        dmat = np.sqrt((diff ** 2).sum(axis=2))
        np.fill_diagonal(dmat, np.inf)
        nn_dist = dmat.min(axis=1)
        d_obs = nn_dist.mean()
        bbox = coords.max(axis=0) - coords.min(axis=0)
        area = max(bbox[0] * bbox[1], 1)
        d_exp = 0.5 / np.sqrt(n / area)
        R = d_obs / d_exp if d_exp > 0 else 1

        results.append({
            "nome": site_name,
            "n_punti": n,
            "centro": centro,
            "dispersione": round(float(dist_centro.mean()), 1),
            "NNI": round(R, 3),
            "pattern": "Cluster" if R < 0.8 else "Random" if R < 1.2 else "Disperso",
            "periodi": Counter(data["periodi"]),
        })

    return results

# Dati di 5 siti
np.random.seed(42)
sites = {
    "Area A - Foro": {
        "coords": np.random.normal([500, 300], [30, 25], (18, 2)).tolist(),
        "periodi": list(np.random.choice(["Romano", "Tardo-Romano"], 18)),
    },
    "Area B - Necropoli": {
        "coords": (np.concatenate([
            np.random.normal([200, 600], 20, (10, 2)),
            np.random.normal([350, 650], 15, (8, 2))
        ])).tolist(),
        "periodi": list(np.random.choice(["Etrusco", "Romano"], 18)),
    },
    "Area C - Insediamento": {
        "coords": np.random.uniform(100, 900, (25, 2)).tolist(),
        "periodi": list(np.random.choice(["Medievale", "Romano", "Etrusco"], 25)),
    },
    "Area D - Santuario": {
        "coords": np.random.normal([700, 200], [15, 12], (12, 2)).tolist(),
        "periodi": list(np.random.choice(["Etrusco"], 12)),
    },
}

print("=== Batch Processing: 4 Siti ===\\n")
results = batch_analysis(sites)

# Tabella comparativa
print("Sito".ljust(22) + "Punti".rjust(6) + "NNI".rjust(8) + "Pattern".rjust(10) + "Disp.".rjust(8))
print("-" * 54)
for r in results:
    print(r["nome"].ljust(22) +
          str(r["n_punti"]).rjust(6) +
          str(r["NNI"]).rjust(8) +
          r["pattern"].rjust(10) +
          (str(r["dispersione"]) + "m").rjust(8))

# Sito piu clustered
most_clustered = min(results, key=lambda x: x["NNI"])
print("\\nSito piu raggruppato: " + most_clustered["nome"] + " (R=" + str(most_clustered["NNI"]) + ")")` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

np.random.seed(42)
sites = {
    "Foro": np.random.normal([500, 300], [30, 25], (18, 2)),
    "Necropoli": np.concatenate([np.random.normal([200, 600], 20, (10, 2)),
                                  np.random.normal([350, 650], 15, (8, 2))]),
    "Insediamento": np.random.uniform(100, 900, (25, 2)),
    "Santuario": np.random.normal([700, 200], [15, 12], (12, 2)),
}

colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"]

fig, axes = plt.subplots(2, 2, figsize=(11, 10))

for ax, (nome, coords), color in zip(axes.flat, sites.items(), colors):
    ax.scatter(coords[:, 0], coords[:, 1], c=color, s=50, alpha=0.7, edgecolors="white")

    # Centro e cerchio di dispersione
    centro = coords.mean(axis=0)
    disp = np.sqrt(((coords - centro)**2).sum(axis=1)).mean()
    ax.scatter(centro[0], centro[1], c="white", s=100, marker="+", linewidths=2)
    circle = plt.Circle(centro, disp, fill=False, edgecolor="white", linestyle="--", alpha=0.5)
    ax.add_patch(circle)

    # NNI
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    dmat = np.sqrt((diff ** 2).sum(axis=2))
    np.fill_diagonal(dmat, np.inf)
    nn = dmat.min(axis=1).mean()
    bbox = coords.max(axis=0) - coords.min(axis=0)
    area = max(bbox[0] * bbox[1], 1)
    R = nn / (0.5 / np.sqrt(len(coords) / area))

    ax.set_title(nome + " (R=" + str(round(R, 2)) + ", n=" + str(len(coords)) + ")")
    ax.set_aspect("equal")
    ax.grid(True, alpha=0.2)

plt.suptitle("Confronto Pattern Spaziali - 4 Aree di Scavo", fontsize=13)
plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c5-integrazione-di-strumenti-multipli-in-un"] = {
  title: "Report Automatici con Grafici",
  content: [
    { tag: "h2", text: "Generazione Automatica di Report" },
    { tag: "p", text: "Una pipeline completa genera non solo numeri ma anche visualizzazioni. Vediamo come creare un report visuale automatico con piu pannelli." },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter

plt.style.use("dark_background")

# Dati del sito
np.random.seed(42)
n = 80
tipi = np.random.choice(["Ceramica", "Metallo", "Osso", "Vetro", "Litico"], n,
                         p=[0.35, 0.2, 0.15, 0.1, 0.2])
profondita = np.random.gamma(3, 0.3, n)
pesi = np.random.lognormal(3.5, 0.8, n)
settori = np.random.choice(["A", "B", "C", "D"], n)
coords_x = np.random.normal(500, 100, n)
coords_y = np.random.normal(400, 80, n)

# REPORT MULTI-PANNELLO
fig = plt.figure(figsize=(14, 10))
fig.suptitle("Report Automatico: Sito Villa Romana - Campagna 2025", fontsize=14, fontweight="bold")

# 1. Distribuzione per tipo
ax1 = fig.add_subplot(2, 3, 1)
conteggio = Counter(tipi)
nomi_t = list(conteggio.keys())
valori_t = list(conteggio.values())
bars = ax1.barh(nomi_t, valori_t, color=["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"])
ax1.set_xlabel("N. reperti")
ax1.set_title("Distribuzione per Tipo")

# 2. Profondita per settore
ax2 = fig.add_subplot(2, 3, 2)
for s in sorted(set(settori)):
    mask = settori == s
    ax2.hist(profondita[mask], bins=10, alpha=0.5, label="Sett. " + s)
ax2.set_xlabel("Profondita (m)")
ax2.set_ylabel("Frequenza")
ax2.set_title("Profondita per Settore")
ax2.legend(fontsize=7)

# 3. Scatter peso vs profondita
ax3 = fig.add_subplot(2, 3, 3)
colori_tipo = {"Ceramica": "#e74c3c", "Metallo": "#3498db", "Osso": "#2ecc71",
               "Vetro": "#f39c12", "Litico": "#9b59b6"}
for tipo in colori_tipo:
    mask = tipi == tipo
    ax3.scatter(profondita[mask], pesi[mask], c=colori_tipo[tipo], s=20, alpha=0.6, label=tipo)
ax3.set_xlabel("Profondita (m)")
ax3.set_ylabel("Peso (g)")
ax3.set_title("Peso vs Profondita")
ax3.legend(fontsize=6)

# 4. Mappa distribuzione
ax4 = fig.add_subplot(2, 3, 4)
scatter = ax4.scatter(coords_x, coords_y, c=profondita, s=pesi/5, cmap="viridis", alpha=0.6)
plt.colorbar(scatter, ax=ax4, label="Prof. (m)")
ax4.set_xlabel("Est (m)")
ax4.set_ylabel("Nord (m)")
ax4.set_title("Mappa Spaziale")

# 5. Box plot pesi per tipo
ax5 = fig.add_subplot(2, 3, 5)
dati_box = [pesi[tipi == t] for t in sorted(set(tipi))]
bp = ax5.boxplot(dati_box, labels=sorted(set(tipi)), patch_artist=True)
for patch, color in zip(bp["boxes"], ["#e74c3c", "#9b59b6", "#3498db", "#2ecc71", "#f39c12"]):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)
ax5.set_ylabel("Peso (g)")
ax5.set_title("Pesi per Tipo")
ax5.tick_params(axis="x", rotation=30)

# 6. Statistiche testuali
ax6 = fig.add_subplot(2, 3, 6)
ax6.axis("off")
stats_text = (
    "STATISTICHE SOMMARIE\\n"
    "\\n"
    "Reperti totali: " + str(n) + "\\n"
    "Tipi unici: " + str(len(set(tipi))) + "\\n"
    "Prof. media: " + str(round(profondita.mean(), 2)) + " m\\n"
    "Prof. std: " + str(round(profondita.std(), 2)) + " m\\n"
    "Peso medio: " + str(round(pesi.mean(), 1)) + " g\\n"
    "Peso mediano: " + str(round(np.median(pesi), 1)) + " g\\n"
    "Settori: " + str(len(set(settori)))
)
ax6.text(0.1, 0.5, stats_text, fontsize=11, verticalalignment="center",
         fontfamily="monospace", color="white",
         bbox={"facecolor": "#2c3e50", "alpha": 0.8, "pad": 10})

plt.tight_layout()
plt.show()` },
  ]
};

LESSONS["python-c5-packaging-e-distribuzione-del-plugin"] = {
  title: "Funzioni Riutilizzabili e Modularita",
  content: [
    { tag: "h2", text: "Organizzare il Codice in Funzioni Riutilizzabili" },
    { tag: "p", text: "Per rendere le nostre analisi riutilizzabili, organizziamo il codice in funzioni ben documentate che possono essere combinate per creare pipeline diverse." },
    { code: `import numpy as np
from collections import Counter

# Toolkit di funzioni riutilizzabili per l'archeologia

def calcola_statistiche(valori):
    """Calcola statistiche descrittive complete"""
    arr = np.array(valori, dtype=float)
    q1, med, q3 = np.percentile(arr, [25, 50, 75])
    return {
        "n": len(arr),
        "media": round(float(arr.mean()), 3),
        "mediana": round(float(med), 3),
        "std": round(float(arr.std(ddof=1)), 3),
        "min": round(float(arr.min()), 3),
        "max": round(float(arr.max()), 3),
        "q1": round(float(q1), 3),
        "q3": round(float(q3), 3),
        "iqr": round(float(q3 - q1), 3),
    }

def trova_outliers(valori, metodo="iqr"):
    """Identifica outlier con metodo IQR o Z-score"""
    arr = np.array(valori, dtype=float)
    if metodo == "iqr":
        q1, q3 = np.percentile(arr, [25, 75])
        iqr = q3 - q1
        mask = (arr < q1 - 1.5 * iqr) | (arr > q3 + 1.5 * iqr)
    else:
        z = np.abs((arr - arr.mean()) / arr.std())
        mask = z > 2
    return np.where(mask)[0], arr[mask]

def nni_rapido(coords):
    """Calcola Nearest Neighbor Index"""
    pts = np.array(coords, dtype=float)
    n = len(pts)
    diff = pts[:, np.newaxis, :] - pts[np.newaxis, :, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    np.fill_diagonal(dist, np.inf)
    d_obs = dist.min(axis=1).mean()
    bbox = pts.max(axis=0) - pts.min(axis=0)
    area = max(bbox[0] * bbox[1], 1)
    d_exp = 0.5 / np.sqrt(n / area)
    return round(d_obs / d_exp, 3) if d_exp > 0 else 1.0

# Demo: uso combinato delle funzioni
np.random.seed(42)
profondita = np.random.normal(0.8, 0.3, 50).tolist()
profondita.extend([3.5, -0.1])  # outlier intenzionali

coords = np.random.normal([500, 400], [80, 60], (30, 2)).tolist()

print("=== Toolkit Archeologico ===")
print("\\n1. Statistiche profondita:")
stats = calcola_statistiche(profondita)
for k, v in stats.items():
    print("   " + k + ": " + str(v))

print("\\n2. Outlier (IQR):")
idx, vals = trova_outliers(profondita, "iqr")
for i, v in zip(idx, vals):
    print("   Indice " + str(i) + ": " + str(round(v, 2)) + " m")

print("\\n3. Pattern spaziale:")
R = nni_rapido(coords)
print("   NNI = " + str(R))
print("   Pattern: " + ("Cluster" if R < 0.8 else "Random" if R < 1.2 else "Disperso"))` },
  ]
};

LESSONS["python-c5-esempio-di-caso-d-uso-completo"] = {
  title: "Caso d'Uso Completo",
  content: [
    { tag: "h2", text: "Caso d'Uso: Analisi di una Campagna di Scavo" },
    { tag: "p", text: "Mettiamo insieme tutto quello che abbiamo imparato in un esempio completo: dalla lettura dei dati alla generazione del report finale." },
    { code: `import csv
import io
import numpy as np
from collections import Counter

# DATI DELLA CAMPAGNA (simulati come CSV)
campagna_csv = """id,tipo,materiale,profondita,peso,est,nord,strato,settore
R001,Ceramica,Terra sigillata,0.42,85,500.2,400.1,I,A
R002,Ceramica,Comune,0.55,120,501.5,399.8,I,A
R003,Metallo,Bronzo,0.48,25,500.8,400.5,I,A
R004,Osso,Fauna,0.38,12,499.5,401.2,I,A
R005,Ceramica,Terra sigillata,0.85,95,510.3,405.7,II,B
R006,Ceramica,Anfora,0.92,250,511.1,406.2,II,B
R007,Metallo,Ferro,0.78,180,509.8,405.1,II,B
R008,Vetro,Soffiato,1.05,15,510.5,406.8,II,B
R009,Ceramica,Comune,1.25,110,520.0,410.3,III,C
R010,Ceramica,Bucchero,1.45,75,521.2,411.5,III,C
R011,Osso,Umano,1.52,45,520.8,410.8,III,C
R012,Metallo,Bronzo,1.38,35,519.5,411.0,III,C
R013,Ceramica,Impasto,1.85,200,521.5,412.0,IV,C
R014,Litico,Selce,1.92,55,520.3,411.8,IV,C
R015,Ceramica,Impasto,2.05,180,522.0,412.5,IV,C"""

# STEP 1: Lettura e parsing
reader = csv.DictReader(io.StringIO(campagna_csv))
reperti = []
for row in reader:
    row["profondita"] = float(row["profondita"])
    row["peso"] = float(row["peso"])
    row["est"] = float(row["est"])
    row["nord"] = float(row["nord"])
    reperti.append(row)

print("CAMPAGNA DI SCAVO - ANALISI COMPLETA")
print("=" * 50)
print("Reperti caricati: " + str(len(reperti)))

# STEP 2: Analisi per strato
print("\\n--- ANALISI PER STRATO ---")
strati = {}
for r in reperti:
    s = r["strato"]
    if s not in strati:
        strati[s] = []
    strati[s].append(r)

for strato in sorted(strati.keys()):
    reps = strati[strato]
    profs = [r["profondita"] for r in reps]
    tipi = Counter(r["tipo"] for r in reps)
    print("\\nStrato " + strato + " (" + str(len(reps)) + " reperti):")
    print("  Profondita: " + str(round(min(profs), 2)) + " - " + str(round(max(profs), 2)) + " m")
    for t, n in tipi.most_common():
        print("  " + t + ": " + str(n))

# STEP 3: Cronologia
print("\\n--- SEQUENZA CRONOLOGICA ---")
materiali_per_strato = {}
for strato in sorted(strati.keys()):
    mats = Counter(r["materiale"] for r in strati[strato])
    materiali_per_strato[strato] = mats
    mat_str = ", ".join(m + "(" + str(n) + ")" for m, n in mats.most_common(3))
    print("Strato " + strato + ": " + mat_str)

# STEP 4: Pattern spaziale
coords = np.array([[r["est"], r["nord"]] for r in reperti])
centro = coords.mean(axis=0)
print("\\n--- PATTERN SPAZIALE ---")
print("Centro medio: E " + str(round(centro[0], 1)) + " N " + str(round(centro[1], 1)))
print("Estensione E: " + str(round(coords[:, 0].max() - coords[:, 0].min(), 1)) + " m")
print("Estensione N: " + str(round(coords[:, 1].max() - coords[:, 1].min(), 1)) + " m")

# Correlazione profondita-posizione
est_vals = coords[:, 0]
prof_vals = np.array([r["profondita"] for r in reperti])
corr = np.corrcoef(est_vals, prof_vals)[0, 1]
print("Correlazione Est-Profondita: " + str(round(corr, 3)))
if abs(corr) > 0.5:
    print("  -> Forte tendenza: reperti piu profondi verso " + ("Est" if corr > 0 else "Ovest"))` },
    { code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.style.use("dark_background")

# Dati della campagna (riprodotti per il grafico)
strati = {"I": 4, "II": 4, "III": 4, "IV": 3}
profondita = [0.42, 0.55, 0.48, 0.38, 0.85, 0.92, 0.78, 1.05, 1.25, 1.45, 1.52, 1.38, 1.85, 1.92, 2.05]
tipi = ["Ceramica","Ceramica","Metallo","Osso","Ceramica","Ceramica","Metallo","Vetro",
        "Ceramica","Ceramica","Osso","Metallo","Ceramica","Litico","Ceramica"]
est = [500.2,501.5,500.8,499.5,510.3,511.1,509.8,510.5,520.0,521.2,520.8,519.5,521.5,520.3,522.0]
nord = [400.1,399.8,400.5,401.2,405.7,406.2,405.1,406.8,410.3,411.5,410.8,411.0,412.0,411.8,412.5]
pesi = [85,120,25,12,95,250,180,15,110,75,45,35,200,55,180]

colori_tipo = {"Ceramica":"#e74c3c","Metallo":"#3498db","Osso":"#2ecc71","Vetro":"#f39c12","Litico":"#9b59b6"}

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle("Report Campagna di Scavo - Analisi Completa", fontsize=14)

# 1. Scatter spaziale colorato per strato
ax = axes[0, 0]
strato_vals = ["I"]*4 + ["II"]*4 + ["III"]*4 + ["IV"]*3
col_strato = {"I":"#e74c3c","II":"#f39c12","III":"#2ecc71","IV":"#3498db"}
for i in range(len(est)):
    ax.scatter(est[i], nord[i], c=col_strato[strato_vals[i]], s=np.array(pesi[i])*0.8,
               alpha=0.7, edgecolors="white", linewidth=0.5)
for s, c in col_strato.items():
    ax.scatter([], [], c=c, s=60, label="Strato " + s)
ax.legend(fontsize=8)
ax.set_xlabel("Est (m)")
ax.set_ylabel("Nord (m)")
ax.set_title("Distribuzione Spaziale per Strato")

# 2. Profondita vs tipo
ax = axes[0, 1]
for tipo in sorted(set(tipi)):
    mask = [t == tipo for t in tipi]
    prof_tipo = [profondita[i] for i in range(len(tipi)) if mask[i]]
    ax.scatter([tipo]*len(prof_tipo), prof_tipo, c=colori_tipo[tipo], s=60, alpha=0.7)
ax.set_ylabel("Profondita (m)")
ax.set_title("Profondita per Tipo di Reperto")
ax.tick_params(axis="x", rotation=30)

# 3. Profilo stratigrafico
ax = axes[1, 0]
strato_range = {"I": (0.3, 0.6), "II": (0.7, 1.1), "III": (1.2, 1.6), "IV": (1.8, 2.1)}
for s, (top, bot) in strato_range.items():
    ax.barh(s, bot - top, left=top, color=col_strato[s], alpha=0.6, edgecolor="white")
    ax.text(top + (bot-top)/2, s, str(strato_vals.count(s)) + " reperti",
            ha="center", va="center", fontsize=9, color="white")
ax.set_xlabel("Profondita (m)")
ax.set_title("Profilo Stratigrafico")
ax.invert_xaxis()

# 4. Composizione per strato
ax = axes[1, 1]
from collections import Counter
strato_labels = ["I", "II", "III", "IV"]
all_types = sorted(set(tipi))
bottom = np.zeros(4)
for tipo in all_types:
    vals = []
    for s in strato_labels:
        idx = [i for i in range(len(strato_vals)) if strato_vals[i] == s]
        count = sum(1 for i in idx if tipi[i] == tipo)
        vals.append(count)
    ax.bar(strato_labels, vals, bottom=bottom, label=tipo, color=colori_tipo[tipo], alpha=0.7)
    bottom += np.array(vals)
ax.set_xlabel("Strato")
ax.set_ylabel("N. reperti")
ax.set_title("Composizione per Strato")
ax.legend(fontsize=7)

plt.tight_layout()
plt.show()` },
  ]
};

// ─── SLUG TO LESSON MAP ───────────────────────────────────────────────────────

// Map from DB slug to our lesson key
const SLUG_MAP = {
  // Chapter 2
  "python-c2-introduzione": "python-c2-introduzione",
  "python-c2-configurazione-dell-ambiente-pyqgis": "python-c2-configurazione-dell-ambiente-pyqgis",
  "python-c2-concetti-base-di-pyqgis": "python-c2-concetti-base-di-pyqgis",
  "python-c2-operazioni-di-base-con-i-layer": "python-c2-operazioni-di-base-con-i-layer",
  "python-c2-sistemi-di-riferimento-delle-coordinate": "python-c2-sistemi-di-riferimento-delle-coordinate",
  "python-c2-visualizzazione-e-simbolizzazione": "python-c2-visualizzazione-e-simbolizzazione",
  "python-c2-analisi-spaziale-di-base": "python-c2-analisi-spaziale-di-base",
  "python-c2-esportazione-dei-risultati": "python-c2-esportazione-dei-risultati",
  "python-c2-esercizi-pratici-pyqgis": "python-c2-esercizi-pratici-pyqgis",
  // Chapter 3
  "python-c3-introduzione": "python-c3-introduzione",
  "python-c3-statistiche-descrittive-di-base": "python-c3-statistiche-descrittive-di-base",
  "python-c3-identificazione-e-gestione-delle-anomali": "python-c3-identificazione-e-gestione-delle-anomali",
  "python-c3-analisi-della-distribuzione-spaziale": "python-c3-analisi-della-distribuzione-spaziale",
  "python-c3-analisi-della-densita-spaziale": "python-c3-analisi-della-densita-spaziale",
  "python-c3-nearest-neighbor-analysis-nna": "python-c3-nearest-neighbor-analysis-nna",
  "python-c3-hot-spot-analysis-analisi-dei-punti-cal": "python-c3-hot-spot-analysis-analisi-dei-punti-cal",
  "python-c3-analisi-di-autocorrelazione-spaziale": "python-c3-analisi-di-autocorrelazione-spaziale",
  "python-c3-analisi-delle-k-funzioni-di-ripley": "python-c3-analisi-delle-k-funzioni-di-ripley",
  "python-c3-z-score-e-significativita-statistica": "python-c3-z-score-e-significativita-statistica",
  "python-c3-esercizi-pratici": "python-c3-esercizi-pratici",
  // Chapter 4
  "python-c4-introduzione": "python-c4-introduzione",
  "python-c4-analisi-di-visibilita-viewshed": "python-c4-analisi-di-visibilita-viewshed",
  "python-c4-analisi-di-costo-superficie-cost-surfac": "python-c4-analisi-di-costo-superficie-cost-surfac",
  "python-c4-analisi-dei-pattern-di-insediamento": "python-c4-analisi-dei-pattern-di-insediamento",
  "python-c4-analisi-predittiva-per-l-archeologia": "python-c4-analisi-predittiva-per-l-archeologia",
  "python-c4-analisi-della-rete-di-trasporto": "python-c4-analisi-della-rete-di-trasporto",
  "python-c4-analisi-delle-aree-di-influenza-spaziale": "python-c4-analisi-delle-aree-di-influenza-spaziale",
  "python-c4-esercizi-pratici": "python-c4-esercizi-pratici",
  "python-c4-integrazione-dei-risultati-delle-analisi": "python-c4-integrazione-dei-risultati-delle-analisi",
  // Chapter 5
  "python-c5-introduzione": "python-c5-introduzione",
  "python-c5-creazione-di-un-plugin-base-per-l-archeo": "python-c5-creazione-di-un-plugin-base-per-l-archeo",
  "python-c5-implementazione-di-un-tool-per-l-analisi": "python-c5-implementazione-di-un-tool-per-l-analisi",
  "python-c5-integrazione-di-strumenti-multipli-in-un": "python-c5-integrazione-di-strumenti-multipli-in-un",
  "python-c5-packaging-e-distribuzione-del-plugin": "python-c5-packaging-e-distribuzione-del-plugin",
  "python-c5-esempio-di-caso-d-uso-completo": "python-c5-esempio-di-caso-d-uso-completo",
};

// New titles for modules
const MODULE_TITLES = {
  2: "Capitolo 2: Analisi Dati Archeologici con Python",
  3: "Capitolo 3: Analisi Statistiche per l'Archeologia",
  4: "Capitolo 4: Analisi Spaziale Avanzata",
  5: "Capitolo 5: Automazione di Analisi Archeologiche",
};

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\\n=== Rewriting Chapters 2-5 to Pure Python ===\\n");

  let totalLessons = 0;
  let totalBlocks = 0;
  let passCount = 0;
  let failCount = 0;
  const failures = [];

  // First, test all code blocks
  console.log("--- Testing all code blocks ---\\n");

  for (const [slug, lesson] of Object.entries(LESSONS)) {
    const codeBlocks = lesson.content.filter(s => s.code !== undefined);
    for (let i = 0; i < codeBlocks.length; i++) {
      totalBlocks++;
      const label = slug + " block " + (i + 1);
      const result = testCode(codeBlocks[i].code, label);
      if (result.ok) {
        passCount++;
        console.log("  PASS: " + label);
      } else {
        failCount++;
        failures.push({ label, error: result.error });
        console.log("  FAIL: " + label);
        console.log("    " + (result.error || "").split("\\n").slice(-3).join("\\n    "));
      }
    }
  }

  console.log("\\n--- Test Results: " + passCount + "/" + totalBlocks + " passed, " + failCount + " failed ---\\n");

  if (failCount > 0) {
    console.log("FAILURES:");
    for (const f of failures) {
      console.log("  " + f.label + ": " + (f.error || "").split("\\n").filter(l => l.includes("Error")).join("; "));
    }
    console.log("\\nContinuing with DB update despite failures...\\n");
  }

  // Update module titles
  console.log("--- Updating module titles ---");
  const modules = await prisma.interactiveModule.findMany({
    where: { course: { slug: "python-archeologi" } },
    orderBy: { order: "asc" },
  });

  for (const mod of modules) {
    const chNum = mod.order;
    if (MODULE_TITLES[chNum]) {
      await prisma.interactiveModule.update({
        where: { id: mod.id },
        data: { title: MODULE_TITLES[chNum] },
      });
      console.log("  Updated module " + chNum + ": " + MODULE_TITLES[chNum]);
    }
  }

  // Update lessons
  console.log("\\n--- Updating lesson content ---");

  for (const [dbSlug, lessonKey] of Object.entries(SLUG_MAP)) {
    const lesson = LESSONS[lessonKey];
    if (!lesson) {
      console.log("  SKIP: " + dbSlug + " (no content defined)");
      continue;
    }

    // Build HTML
    const html = buildHtml(lesson.content);

    try {
      await prisma.interactiveLesson.update({
        where: { slug: dbSlug },
        data: {
          title: lesson.title,
          content: html,
        },
      });
      totalLessons++;
      console.log("  UPDATED: " + dbSlug + " -> " + lesson.title);
    } catch (e) {
      console.log("  ERROR: " + dbSlug + " - " + e.message);
    }
  }

  console.log("\\n=== SUMMARY ===");
  console.log("Lessons rewritten: " + totalLessons);
  console.log("Code blocks: " + totalBlocks);
  console.log("Tests passed: " + passCount + "/" + totalBlocks + " (" + Math.round(100 * passCount / totalBlocks) + "%)");
  if (failCount > 0) {
    console.log("Tests failed: " + failCount);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
