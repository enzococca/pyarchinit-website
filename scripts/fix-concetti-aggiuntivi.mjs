/**
 * Rewrite the lesson "Concetti Python Aggiuntivi per Applicazioni Archeologiche"
 * replacing 29 broken code blocks with 11 clean, working, self-contained blocks.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/fix-concetti-aggiuntivi.mjs
 */

import pg from "pg";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.cygykmizdjusppwlpwwv:bybbeh-8dawqu-racTaj@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── New lesson content ───────────────────────────────────────────────────────

const newContent = `<h2>Concetti Python Aggiuntivi per Applicazioni Archeologiche</h2>
<p>In questa lezione esploriamo concetti Python avanzati particolarmente utili per l'archeologia digitale: funzioni lambda, manipolazione avanzata delle stringhe, validazione dell'input, decoratori, programmazione orientata agli oggetti e parsing di file CSV.</p>

<h3>1.5.1 Funzioni Lambda</h3>
<p>Le funzioni lambda sono funzioni anonime compatte, ideali per operazioni semplici inline. La sintassi \u00e8: <code>lambda argomenti: espressione</code>.</p>

<pre><code class="language-python"># Funzioni Lambda: sintassi base
# lambda argomenti: espressione

# Lambda per calcolare l'area di uno scavo
calcola_area = lambda larghezza, lunghezza: larghezza * lunghezza

area = calcola_area(10, 15)
print("Area scavo:", area, "m2")

# Lambda per classificare profondita
classifica_profondita = lambda p: "superficiale" if p &lt; 50 else ("medio" if p &lt; 150 else "profondo")

for profondita in [30, 80, 200]:
    print("Profondita", profondita, "cm:", classifica_profondita(profondita))

# Lambda per formattare un codice US
formatta_us = lambda numero: "US" + str(numero).zfill(4)
print(formatta_us(42))
print(formatta_us(1024))</code></pre>

<p>Le lambda sono particolarmente utili con <code>sorted()</code>, <code>filter()</code> e <code>map()</code> per elaborare collezioni di reperti.</p>

<pre><code class="language-python"># Lambda per ordinamento e filtri sui reperti

reperti = [
    {"id": 1, "tipo": "ceramica", "periodo": "II sec. d.C.", "peso": 245},
    {"id": 2, "tipo": "moneta", "periodo": "I sec. a.C.", "peso": 8},
    {"id": 3, "tipo": "anfora", "periodo": "III sec. d.C.", "peso": 1200},
    {"id": 4, "tipo": "vetro", "periodo": "II sec. d.C.", "peso": 95},
    {"id": 5, "tipo": "bronzo", "periodo": "I sec. a.C.", "peso": 320},
]

# Ordina per peso
ordinati_peso = sorted(reperti, key=lambda r: r["peso"])
print("Reperti ordinati per peso:")
for r in ordinati_peso:
    print("  " + r["tipo"] + " - " + str(r["peso"]) + "g")

# Filtra solo i reperti pesanti (&gt; 100g)
pesanti = list(filter(lambda r: r["peso"] &gt; 100, reperti))
print("\\nReperti pesanti (&gt; 100g):", len(pesanti))
for r in pesanti:
    print("  " + r["tipo"])

# Mappa per estrarre solo i tipi
tipi = list(map(lambda r: r["tipo"].upper(), reperti))
print("\\nTipi:", tipi)</code></pre>

<h3>1.5.2 Metodi delle Stringhe: Manipolazione Avanzata del Testo</h3>
<p>Python offre numerosi metodi per manipolare stringhe, fondamentali per elaborare descrizioni, codici e dati testuali provenienti dagli scavi.</p>

<pre><code class="language-python"># Metodi avanzati delle stringhe per dati archeologici

descrizione = "  Strato di abbandono - US1042 - periodo: Romano Imperiale  "

# strip, split, replace
print("Originale:", repr(descrizione))
print("Pulita:", descrizione.strip())
print("Maiuscolo:", descrizione.strip().upper())
print("Parti:", descrizione.strip().split(" - "))

# Estrazione informazioni con find e slice
testo = "Reperto: anfora biansata | Sito: Villa dei Papiri | Anno: 2023"
pos_sito = testo.find("Sito:")
pos_anno = testo.find("Anno:")
sito = testo[pos_sito+6:testo.find("|", pos_sito)].strip()
anno = testo[pos_anno+6:].strip()
print("\\nSito estratto:", sito)
print("Anno estratto:", anno)

# join per ricostruire dati
campi = ["US1042", "Romano", "Abbandono", "2023"]
riga_csv = ",".join(campi)
print("\\nRiga CSV:", riga_csv)

# startswith / endswith per validazione
codici = ["US1042", "US0023", "SB999", "US0001", "ABC123"]
codici_us = [c for c in codici if c.startswith("US") and c[2:].isdigit()]
print("Codici US validi:", codici_us)</code></pre>

<p>Le espressioni regolari (modulo <code>re</code>) estendono ulteriormente le capacit\u00e0 di parsing del testo.</p>

<pre><code class="language-python"># Espressioni regolari per parsing di descrizioni archeologiche
import re

# Cerca codici US nel testo
testo = "Nello scavo sono state identificate US1042, US1043 e US1044 con ceramica."
pattern_us = r"US\\d{4}"
codici = re.findall(pattern_us, testo)
print("Codici US trovati:", codici)

# Estrai coordinate GPS dal testo
testo_gps = "Sito localizzato a 41.9028 N, 12.4964 E vicino al centro storico."
pattern_coord = r"\\d+\\.\\d+"
coordinate = re.findall(pattern_coord, testo_gps)
print("Coordinate estratte:", coordinate)

# Valida formato data scavo (GG/MM/AAAA)
date_scavo = ["15/07/2023", "2023-08-01", "30/02/2022", "12/11/2021"]
pattern_data = r"^\\d{2}/\\d{2}/\\d{4}$"
for data in date_scavo:
    valida = bool(re.match(pattern_data, data))
    print("Data " + data + ": " + ("valida" if valida else "non valida"))

# Sostituisci abbreviazioni con testo completo
nota = "Rep. ceramico dt. II sec. d.C., prov. Villa dei Papiri, cons. framm."
nota_espansa = re.sub(r"\\bRep\\.", "Reperto", nota)
nota_espansa = re.sub(r"\\bdt\\.", "datato", nota_espansa)
nota_espansa = re.sub(r"\\bprov\\.", "proveniente da", nota_espansa)
nota_espansa = re.sub(r"\\bcons\\.", "conservazione", nota_espansa)
nota_espansa = re.sub(r"\\bframm\\.", "frammentaria", nota_espansa)
print("\\nNota espansa:", nota_espansa)</code></pre>

<h3>1.5.3 Gestione dell'Input Utente (Simulata)</h3>
<p>La funzione <code>input()</code> legge testo dall'utente. \u00c8 buona pratica validare sempre i dati ricevuti prima di utilizzarli. Qui simuliamo la validazione con valori predefiniti.</p>

<pre><code class="language-python"># Simulazione validazione input (senza input() - valori predefiniti)
# In un contesto reale si userebbe input(), qui usiamo valori di test

def valida_codice_us(codice):
    """Valida un codice Unita Stratigrafica."""
    if not codice:
        return False, "Il codice non puo essere vuoto"
    if not codice.startswith("US"):
        return False, "Il codice deve iniziare con 'US'"
    numero = codice[2:]
    if not numero.isdigit():
        return False, "La parte numerica deve contenere solo cifre"
    if len(numero) &lt; 1 or len(numero) &gt; 6:
        return False, "Il numero deve avere tra 1 e 6 cifre"
    return True, "Codice valido"

def valida_quota(quota_str):
    """Valida una quota altimetrica."""
    try:
        quota = float(quota_str)
        if quota &lt; -500 or quota &gt; 5000:
            return False, "Quota fuori range (-500 a 5000 m)"
        return True, "Quota valida: " + str(quota) + " m"
    except ValueError:
        return False, "La quota deve essere un numero"

# Test con valori predefiniti (simulazione input utente)
test_codici = ["US1042", "us0023", "1042", "US", "USABC", "US123456"]
print("=== Validazione Codici US ===")
for codice in test_codici:
    valido, messaggio = valida_codice_us(codice)
    stato = "OK" if valido else "ERRORE"
    print("[" + stato + "] '" + codice + "': " + messaggio)

print("\\n=== Validazione Quote ===")
test_quote = ["125.5", "-10.2", "abc", "6000", "0"]
for quota_str in test_quote:
    valido, messaggio = valida_quota(quota_str)
    stato = "OK" if valido else "ERRORE"
    print("[" + stato + "] '" + quota_str + "': " + messaggio)</code></pre>

<h3>1.5.4 Decoratori: Potenziare le Funzioni</h3>
<p>Un decoratore \u00e8 una funzione che riceve un'altra funzione come argomento e ne restituisce una versione modificata. Si usa con la sintassi <code>@nome_decoratore</code>.</p>

<pre><code class="language-python"># Decoratori: concetto base
import time

# Un decoratore e una funzione che riceve una funzione e ne restituisce una modificata
def log_chiamata(func):
    """Decoratore che registra ogni chiamata a una funzione."""
    def wrapper(*args, **kwargs):
        print("&gt;&gt;&gt; Chiamata a: " + func.__name__)
        risultato = func(*args, **kwargs)
        print("&lt;&lt;&lt; Fine: " + func.__name__)
        return risultato
    return wrapper

def misura_tempo(func):
    """Decoratore che misura il tempo di esecuzione."""
    def wrapper(*args, **kwargs):
        inizio = time.time()
        risultato = func(*args, **kwargs)
        fine = time.time()
        durata = (fine - inizio) * 1000
        print("[" + func.__name__ + "] Tempo: " + str(round(durata, 3)) + " ms")
        return risultato
    return wrapper

@log_chiamata
def analizza_strato(codice_us, profondita):
    """Analizza un'Unita Stratigrafica."""
    print("  Analisi " + codice_us + " a " + str(profondita) + " cm di profondita")
    return {"us": codice_us, "profondita": profondita}

@misura_tempo
def calcola_volume_scavo(lunghezza, larghezza, profondita):
    """Calcola il volume di terra rimossa."""
    volume = lunghezza * larghezza * profondita
    return volume

# Uso dei decoratori
print("--- Test decoratore log ---")
strato = analizza_strato("US1042", 125)

print("\\n--- Test decoratore tempo ---")
volume = calcola_volume_scavo(10, 5, 2.5)
print("Volume:", volume, "m3")</code></pre>

<p>Un caso pratico molto utile \u00e8 il decoratore di cache: evita di ricalcolare risultati gi\u00e0 ottenuti.</p>

<pre><code class="language-python"># Decoratore pratico: cache dei risultati
def cache_risultati(func):
    """Decoratore che memorizza i risultati gia calcolati."""
    cache = {}
    def wrapper(*args):
        if args in cache:
            print("  [CACHE] Risultato da cache per: " + str(args))
            return cache[args]
        risultato = func(*args)
        cache[args] = risultato
        print("  [CALC] Calcolato e salvato in cache: " + str(args))
        return risultato
    wrapper.cache = cache
    return wrapper

@cache_risultati
def carica_dati_sito(nome_sito, anno):
    """Simula il caricamento dei dati di un sito (operazione lenta)."""
    # Simulazione: in realtà sarebbe una query al database
    dati = {
        "sito": nome_sito,
        "anno": anno,
        "reperti": 150 + len(nome_sito) * 10,
        "us_totali": 42
    }
    return dati

print("=== Test Cache Decoratore ===\\n")

# Prima chiamata: calcola
print("Richiesta 1:")
r1 = carica_dati_sito("Villa dei Papiri", 2023)
print("  Reperti:", r1["reperti"])

# Seconda chiamata stessa: usa cache
print("\\nRichiesta 2 (stessi parametri):")
r2 = carica_dati_sito("Villa dei Papiri", 2023)

# Terza chiamata diversa: calcola
print("\\nRichiesta 3 (parametri diversi):")
r3 = carica_dati_sito("Pompei", 2022)
print("  Reperti:", r3["reperti"])

print("\\nCache attuale:", len(carica_dati_sito.cache), "voci")</code></pre>

<h3>1.5.5 Classi e Metodi: OOP in Archeologia</h3>
<p>La programmazione orientata agli oggetti (OOP) permette di modellare entit\u00e0 del mondo reale come classi Python. Ogni reperto, unit\u00e0 stratigrafica o sito pu\u00f2 diventare un oggetto con attributi e metodi propri.</p>

<pre><code class="language-python"># Classe RepertoCeramico con metodi di istanza
class RepertoCeramico:
    """Rappresenta un reperto ceramico in un contesto archeologico."""

    # Attributo di classe (condiviso da tutte le istanze)
    categoria = "ceramica"

    def __init__(self, codice, tipo, periodo, peso_g, integro=True):
        """Inizializza un nuovo reperto ceramico."""
        self.codice = codice
        self.tipo = tipo
        self.periodo = periodo
        self.peso_g = peso_g
        self.integro = integro
        self.note = []

    def __str__(self):
        """Rappresentazione leggibile del reperto."""
        stato = "integro" if self.integro else "frammentario"
        return self.codice + " | " + self.tipo + " | " + self.periodo + " | " + str(self.peso_g) + "g | " + stato

    def aggiungi_nota(self, testo):
        """Aggiunge una nota di restauro o analisi."""
        self.note.append(testo)
        print("Nota aggiunta a " + self.codice + ": " + testo)

    def calcola_valore_relativo(self):
        """Calcola un indice di valore basato su stato e peso."""
        base = self.peso_g * 0.1
        if self.integro:
            base *= 2.5
        return round(base, 2)

    def report(self):
        """Genera un report dettagliato del reperto."""
        print("=== Report " + self.codice + " ===")
        print("  Tipo: " + self.tipo)
        print("  Periodo: " + self.periodo)
        print("  Peso: " + str(self.peso_g) + "g")
        print("  Stato: " + ("integro" if self.integro else "frammentario"))
        print("  Valore relativo: " + str(self.calcola_valore_relativo()))
        if self.note:
            print("  Note: " + "; ".join(self.note))

# Creare istanze della classe
anfora = RepertoCeramico("REP001", "Anfora biansata", "II sec. d.C.", 1200, True)
coppa = RepertoCeramico("REP002", "Coppa sigillata", "I sec. d.C.", 180, False)

print(anfora)
print(coppa)
print()

anfora.aggiungi_nota("Restaurata nel 2023")
anfora.aggiungi_nota("Analisi XRF completata")
print()

anfora.report()
print()
coppa.report()

print("\\nCategoria (attributo classe):", RepertoCeramico.categoria)</code></pre>

<p>L'ereditariet\u00e0 permette di creare gerarchie di classi: una classe base <code>Reperto</code> con le propriet\u00e0 comuni, e sottoclassi specializzate per ceramica, monete, ecc.</p>

<pre><code class="language-python"># Ereditarieta: classe base Reperto e sottoclassi specializzate

class Reperto:
    """Classe base per tutti i reperti archeologici."""

    def __init__(self, codice, materiale, periodo, sito):
        self.codice = codice
        self.materiale = materiale
        self.periodo = periodo
        self.sito = sito

    def __str__(self):
        return "[" + self.codice + "] " + self.materiale + " - " + self.periodo

    def scheda(self):
        print("Codice: " + self.codice)
        print("Materiale: " + self.materiale)
        print("Periodo: " + self.periodo)
        print("Sito: " + self.sito)


class RepertoCeramicoExt(Reperto):
    """Reperto ceramico con attributi specifici."""

    def __init__(self, codice, periodo, sito, forma, classe_ceramica):
        super().__init__(codice, "ceramica", periodo, sito)
        self.forma = forma
        self.classe_ceramica = classe_ceramica

    def scheda(self):
        super().scheda()
        print("Forma: " + self.forma)
        print("Classe: " + self.classe_ceramica)


class RepertoMonetale(Reperto):
    """Reperto monetale con attributi specifici."""

    def __init__(self, codice, periodo, sito, zecca, nominale, imperatore=""):
        super().__init__(codice, "bronzo/argento", periodo, sito)
        self.zecca = zecca
        self.nominale = nominale
        self.imperatore = imperatore

    def scheda(self):
        super().scheda()
        print("Zecca: " + self.zecca)
        print("Nominale: " + self.nominale)
        if self.imperatore:
            print("Imperatore: " + self.imperatore)


# Creare istanze delle sottoclassi
ceramica = RepertoCeramicoExt(
    "CER042", "II sec. d.C.", "Pompei",
    "anfora", "Terra Sigillata Italica"
)

moneta = RepertoMonetale(
    "MON017", "I sec. d.C.", "Villa dei Papiri",
    "Roma", "Sesterzio", "Traiano"
)

# isinstance verifica la gerarchia
reperti = [ceramica, moneta]
for r in reperti:
    print("=== " + r.codice + " ===")
    r.scheda()
    print("E un Reperto?", isinstance(r, Reperto))
    print()</code></pre>

<h3>1.5.6 Parsing di File CSV per Dati Archeologici</h3>
<p>Il modulo <code>csv</code> di Python permette di leggere e scrivere file CSV facilmente. Usando <code>io.StringIO</code> possiamo lavorare con dati CSV direttamente da stringhe, senza necessit\u00e0 di file su disco.</p>

<pre><code class="language-python"># Parsing CSV da stringa (no file necessario - usa io.StringIO)
import csv
import io

# Dati CSV incorporati come stringa
dati_csv = """codice_us,tipo,profondita_cm,materiale_dominante,data_scavo
US1001,strato,45,ceramica,15/03/2023
US1002,buca,120,carbone,16/03/2023
US1003,pavimento,15,laterizi,17/03/2023
US1004,strato,67,ceramica,17/03/2023
US1005,taglio,200,sterile,18/03/2023
US1006,strato,38,ossa,19/03/2023"""

# Leggi il CSV con csv.DictReader
reader = csv.DictReader(io.StringIO(dati_csv))

unita_stratigrafiche = []
for riga in reader:
    unita_stratigrafiche.append({
        "codice": riga["codice_us"],
        "tipo": riga["tipo"],
        "profondita": int(riga["profondita_cm"]),
        "materiale": riga["materiale_dominante"],
        "data": riga["data_scavo"]
    })

print("US caricate:", len(unita_stratigrafiche))
print()

# Stampa tabella
print("{:&lt;10} {:&lt;12} {:&lt;8} {:&lt;15}".format("Codice", "Tipo", "Prof.", "Materiale"))
print("-" * 50)
for us in unita_stratigrafiche:
    print("{:&lt;10} {:&lt;12} {:&lt;8} {:&lt;15}".format(
        us["codice"], us["tipo"],
        str(us["profondita"]) + " cm", us["materiale"]
    ))</code></pre>

<p>Con i dati caricati possiamo eseguire analisi statistiche, contare i tipi di US, trovare le strutture pi\u00f9 profonde e molto altro.</p>

<pre><code class="language-python"># Analisi dati CSV archeologici
import csv
import io
from collections import Counter

dati_csv = """codice_us,tipo,profondita_cm,materiale_dominante,data_scavo
US1001,strato,45,ceramica,15/03/2023
US1002,buca,120,carbone,16/03/2023
US1003,pavimento,15,laterizi,17/03/2023
US1004,strato,67,ceramica,17/03/2023
US1005,taglio,200,sterile,18/03/2023
US1006,strato,38,ossa,19/03/2023
US1007,strato,52,ceramica,20/03/2023
US1008,buca,88,carbone,21/03/2023"""

reader = csv.DictReader(io.StringIO(dati_csv))
us_list = list(reader)

# Analisi statistica delle profondita
profondita_vals = [int(r["profondita_cm"]) for r in us_list]
media = sum(profondita_vals) / len(profondita_vals)
minima = min(profondita_vals)
massima = max(profondita_vals)

print("=== Analisi Profondita ===")
print("Totale US:", len(us_list))
print("Profondita media: " + str(round(media, 1)) + " cm")
print("Minima: " + str(minima) + " cm | Massima: " + str(massima) + " cm")

# Distribuzione per tipo
print("\\n=== Distribuzione per Tipo ===")
tipi = Counter(r["tipo"] for r in us_list)
for tipo, conta in sorted(tipi.items(), key=lambda x: -x[1]):
    barra = "#" * conta
    print(tipo.ljust(12) + ": " + barra + " (" + str(conta) + ")")

# Materiali dominanti
print("\\n=== Materiali Dominanti ===")
materiali = Counter(r["materiale_dominante"] for r in us_list)
for mat, conta in materiali.most_common():
    print("  " + mat + ": " + str(conta) + " US")

# US piu profonde
print("\\n=== Top 3 US piu profonde ===")
ordinate = sorted(us_list, key=lambda r: int(r["profondita_cm"]), reverse=True)
for us in ordinate[:3]:
    print("  " + us["codice_us"] + ": " + us["profondita_cm"] + " cm (" + us["tipo"] + ")")</code></pre>

<h3>Riepilogo</h3>
<p>In questa lezione abbiamo esplorato:</p>
<ul>
  <li><strong>Lambda</strong>: funzioni anonime compatte per operazioni inline con <code>sorted()</code>, <code>filter()</code>, <code>map()</code></li>
  <li><strong>Metodi delle stringhe</strong>: <code>strip()</code>, <code>split()</code>, <code>join()</code>, <code>find()</code>, <code>startswith()</code> e le espressioni regolari con <code>re</code></li>
  <li><strong>Validazione input</strong>: pattern per verificare codici US e quote altimetriche</li>
  <li><strong>Decoratori</strong>: <code>@log_chiamata</code>, <code>@misura_tempo</code>, <code>@cache_risultati</code></li>
  <li><strong>OOP</strong>: classi con <code>__init__</code>, <code>__str__</code>, metodi di istanza ed ereditariet\u00e0</li>
  <li><strong>CSV</strong>: lettura con <code>csv.DictReader</code> e <code>io.StringIO</code>, analisi statistica</li>
</ul>`;

// ─── Test each code block before updating ────────────────────────────────────

function extractCodeBlocks(html) {
  const blocks = [];
  const re = /<pre><code class="language-python">([\s\S]*?)<\/code><\/pre>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

function decodeHtml(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function testBlock(code, index) {
  writeFileSync("/tmp/test_block.py", code);
  const result = spawnSync("python3", ["/tmp/test_block.py"], {
    encoding: "utf8",
    timeout: 10000,
  });
  const passed = result.status === 0;
  const output = passed ? result.stdout : (result.stderr || result.stdout || "unknown error");
  return { passed, output: output.trim() };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Fix: Concetti Python Aggiuntivi ===\n");

  const rawBlocks = extractCodeBlocks(newContent);
  console.log("Found " + rawBlocks.length + " code blocks to test\n");

  let allPassed = true;
  for (let i = 0; i < rawBlocks.length; i++) {
    const code = decodeHtml(rawBlocks[i]);
    const { passed, output } = testBlock(code, i + 1);
    const status = passed ? "PASS" : "FAIL";
    console.log("Block " + (i + 1) + "/" + rawBlocks.length + ": [" + status + "]");
    if (!passed) {
      allPassed = false;
      console.log("  ERROR:", output.split("\n").slice(-3).join("\n  "));
    } else {
      const lines = output.split("\n").filter(l => l.trim()).slice(0, 2);
      lines.forEach(l => console.log("  > " + l));
    }
  }

  if (!allPassed) {
    console.error("\n\nABORTED: Some blocks failed.");
    process.exit(1);
  }

  console.log("\nAll " + rawBlocks.length + " blocks passed!\n");

  const client = await pool.connect();
  try {
    const courseRes = await client.query(
      `SELECT id FROM "InteractiveCourse" WHERE slug = 'python-archeologi'`
    );
    if (courseRes.rows.length === 0) throw new Error("Course not found");
    const courseId = courseRes.rows[0].id;

    const lessonRes = await client.query(
      `SELECT l.id, l.title, l.content
       FROM "InteractiveLesson" l
       JOIN "InteractiveModule" m ON l."moduleId" = m.id
       WHERE m."courseId" = $1
         AND l.title ILIKE '%Concetti Python Aggiuntivi%'`,
      [courseId]
    );

    if (lessonRes.rows.length === 0) throw new Error("Lesson not found!");

    const lesson = lessonRes.rows[0];
    const oldBlockCount = (lesson.content.match(/<pre><code/g) || []).length;
    console.log("Lesson: " + lesson.title);
    console.log("Old: " + lesson.content.length + " chars, " + oldBlockCount + " blocks");

    await client.query(
      `UPDATE "InteractiveLesson" SET content = $1 WHERE id = $2`,
      [newContent, lesson.id]
    );

    console.log("New: " + newContent.length + " chars, " + rawBlocks.length + " blocks");
    console.log("\nDone! Lesson updated successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
