"use client";

import { useState } from "react";

interface SqlPlaygroundProps {
  initialQuery?: string;
}

// Simple simulated query results based on SQL keywords
function simulateQuery(sql: string): {
  success: boolean;
  message: string;
  columns?: string[];
  rows?: string[][];
} {
  const upper = sql.trim().toUpperCase();

  if (!upper) {
    return { success: false, message: "Scrivi una query SQL" };
  }

  if (upper.startsWith("SELECT")) {
    // Generate mock results based on common patterns
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    const table = fromMatch ? fromMatch[1].toLowerCase() : "tabella";

    const mockData: Record<string, { columns: string[]; rows: string[][] }> = {
      reperto: {
        columns: ["id", "tipo", "materiale", "periodo", "us_id"],
        rows: [
          ["1", "ceramica", "terracotta", "età del ferro", "US42"],
          ["2", "osso", "fauna", "età del bronzo", "US38"],
          ["3", "selce", "pietra", "neolitico", "US51"],
          ["4", "vetro", "vetro soffiato", "età romana", "US29"],
          ["5", "moneta", "bronzo", "età medievale", "US17"],
        ],
      },
      us: {
        columns: ["id", "tipo", "descrizione", "quota_top", "quota_bot"],
        rows: [
          ["US42", "strato", "strato antropico ricco di carboni", "-0.45", "-0.78"],
          ["US38", "riempimento", "riempimento di buca", "-0.92", "-1.34"],
          ["US51", "struttura", "muro in pietra a secco", "-1.10", "-2.20"],
        ],
      },
      sito: {
        columns: ["id", "nome", "comune", "regione", "tipo"],
        rows: [
          ["1", "Poggio delle Rocche", "Scarlino", "Toscana", "insediamento"],
          ["2", "Grotta dei Cervi", "Porto Badisco", "Puglia", "grotta"],
          ["3", "Sito di Murlo", "Murlo", "Toscana", "santuario"],
        ],
      },
    };

    const result = mockData[table] ?? {
      columns: ["id", "valore", "descrizione"],
      rows: [
        ["1", "dato_a", "esempio di risultato"],
        ["2", "dato_b", "risultato simulato"],
        ["3", "dato_c", "query eseguita correttamente"],
      ],
    };

    // Check for WHERE clause to filter
    const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:ORDER|GROUP|LIMIT|$)/i);
    let rows = result.rows;
    if (whereMatch) {
      // Simulated filter: just return first 2 rows
      rows = rows.slice(0, 2);
    }

    // Check for LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      rows = rows.slice(0, parseInt(limitMatch[1]));
    }

    return {
      success: true,
      message: `${rows.length} riga${rows.length !== 1 ? "e" : ""} trovata${rows.length !== 1 ? "e" : ""}`,
      columns: result.columns,
      rows,
    };
  }

  if (upper.startsWith("INSERT")) {
    return { success: true, message: "1 riga inserita con successo" };
  }

  if (upper.startsWith("UPDATE")) {
    return { success: true, message: "3 righe aggiornate con successo" };
  }

  if (upper.startsWith("DELETE")) {
    return { success: true, message: "1 riga eliminata con successo" };
  }

  if (upper.startsWith("CREATE")) {
    const nameMatch = sql.match(/CREATE\s+TABLE\s+(\w+)/i);
    return {
      success: true,
      message: `Tabella "${nameMatch?.[1] ?? "nuova_tabella"}" creata con successo`,
    };
  }

  if (upper.startsWith("DROP")) {
    return {
      success: true,
      message: "Oggetto eliminato con successo",
    };
  }

  return {
    success: true,
    message: "Query eseguita con successo",
  };
}

export function SqlPlayground({ initialQuery = "" }: SqlPlaygroundProps) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<ReturnType<typeof simulateQuery> | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    // Simulate async execution
    setTimeout(() => {
      setResult(simulateQuery(query));
      setRunning(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleRun();
    }
    // Tab support
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = query.substring(0, start) + "  " + query.substring(end);
      setQuery(newVal);
      // Re-focus with cursor after tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="bg-[#0a0f1a] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-teal/60 uppercase tracking-widest">
          SQL Playground
        </span>
        <span className="text-xs text-sand/20 font-mono">(simulato)</span>
        <span className="ml-auto text-xs text-sand/20 font-mono hidden sm:inline">
          Ctrl+Enter per eseguire
        </span>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-28 bg-[#0d1117] border border-sand/15 rounded-lg px-4 py-3 text-sm font-mono text-sand/80 focus:outline-none focus:border-teal/40 resize-y placeholder:text-sand/20"
        placeholder="Scrivi la tua query SQL..."
        spellCheck={false}
      />

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleRun}
          disabled={running || !query.trim()}
          className="flex items-center gap-2 bg-teal text-primary font-mono text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full" />
              Eseguendo...
            </>
          ) : (
            <>
              ▶ Esegui
            </>
          )}
        </button>
        {result && (
          <button
            onClick={() => setResult(null)}
            className="text-xs font-mono text-sand/30 hover:text-sand/60 transition-colors"
          >
            Pulisci
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-3">
          <div
            className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg ${
              result.success
                ? "bg-teal/10 text-teal border border-teal/20"
                : "bg-terracotta/10 text-terracotta border border-terracotta/20"
            }`}
          >
            <span>{result.success ? "✓" : "✗"}</span>
            <span>{result.message}</span>
          </div>

          {result.success && result.columns && result.rows && result.rows.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-sand/10">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-2 bg-sand/5 text-teal/70 uppercase tracking-widest border-b border-sand/10 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-sand/5 hover:bg-sand/3">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-sand/60 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
