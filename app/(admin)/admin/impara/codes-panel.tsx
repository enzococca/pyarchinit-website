"use client";

import { useState, useCallback } from "react";
import { Tag, RefreshCw, Copy, Check } from "lucide-react";

interface CodeEntry {
  id: string;
  code: string;
  courseSlug: string;
  available: boolean;
  usedAt: string | null;
  usedBy: { id: string; name: string | null; email: string | null } | null;
  createdAt: string;
}

interface CodesPanelProps {
  courseSlug: string;
  courseTitle: string;
}

export function CodesPanel({ courseSlug, courseTitle }: CodesPanelProps) {
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/learn/codes?courseSlug=${encodeURIComponent(courseSlug)}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data = await res.json();
      setCodes(data);
      setLoaded(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  const generateCodes = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, count }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Errore");
      }
      await loadCodes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const available = codes.filter((c) => c.available).length;
  const used = codes.filter((c) => !c.available).length;

  return (
    <div className="bg-code-bg border border-sand/10 rounded-card p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={15} className="text-ochre" />
        <h4 className="font-mono text-sand text-sm font-semibold">
          Codici di accesso — {courseTitle}
        </h4>
        {loaded && (
          <span className="ml-auto text-xs text-sand/30 font-mono">
            {available} disponibili · {used} usati
          </span>
        )}
      </div>

      {/* Generate controls */}
      <div className="flex items-center gap-2 mb-4">
        {!loaded ? (
          <button
            onClick={loadCodes}
            disabled={loading}
            className="flex items-center gap-2 bg-sand/5 hover:bg-sand/10 border border-sand/15 text-sand/70 font-mono text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Caricamento..." : "Carica codici"}
          </button>
        ) : (
          <button
            onClick={loadCodes}
            disabled={loading}
            className="p-1.5 text-sand/30 hover:text-sand/60 transition-colors"
            title="Aggiorna"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-14 bg-primary border border-sand/20 rounded px-2 py-1.5 text-xs font-mono text-sand focus:outline-none focus:border-teal/40"
          />
          <button
            onClick={generateCodes}
            disabled={generating}
            className="flex items-center gap-1.5 bg-ochre/10 hover:bg-ochre/20 border border-ochre/20 hover:border-ochre/40 text-ochre font-mono text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? <RefreshCw size={11} className="animate-spin" /> : <Tag size={11} />}
            Genera
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs font-mono mb-3">{error}</p>
      )}

      {loaded && codes.length === 0 && (
        <p className="text-sand/30 text-sm text-center py-4">Nessun codice generato.</p>
      )}

      {codes.length > 0 && (
        <div className="overflow-auto max-h-64 rounded-lg border border-sand/10">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-sand/10 bg-primary/40">
                <th className="text-left px-3 py-2 text-teal/50 uppercase tracking-widest">Codice</th>
                <th className="text-left px-3 py-2 text-teal/50 uppercase tracking-widest hidden sm:table-cell">Stato</th>
                <th className="text-left px-3 py-2 text-teal/50 uppercase tracking-widest hidden md:table-cell">Usato da</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/5">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-sand/3 transition-colors">
                  <td className="px-3 py-2 text-sand">{c.code}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <span
                      className={`px-1.5 py-0.5 rounded-full ${
                        c.available ? "bg-teal/10 text-teal" : "bg-sand/10 text-sand/40"
                      }`}
                    >
                      {c.available ? "Disponibile" : "Usato"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sand/40 hidden md:table-cell">
                    {c.usedBy ? (c.usedBy.name ?? c.usedBy.email ?? c.usedBy.id) : "—"}
                    {c.usedAt && (
                      <span className="text-sand/20 ml-1">
                        ({new Date(c.usedAt).toLocaleDateString("it-IT")})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {c.available && (
                      <button
                        onClick={() => copyCode(c.code)}
                        className="p-1 text-sand/30 hover:text-sand transition-colors"
                        title="Copia"
                      >
                        {copiedCode === c.code ? (
                          <Check size={12} className="text-teal" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
