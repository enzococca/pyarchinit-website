"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  GraduationCap,
  PenSquare,
  MessageSquare,
  PlayCircle,
  X,
  Loader2,
} from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";

/* ── type → icon + label ────────────────────────────────── */
const typeConfig: Record<
  SearchResult["type"],
  { icon: React.ElementType; label: string; color: string }
> = {
  doc: { icon: BookOpen, label: "Documentazione", color: "text-teal" },
  course: { icon: GraduationCap, label: "Corsi", color: "text-ochre" },
  blog: { icon: PenSquare, label: "Blog", color: "text-terracotta" },
  forum: { icon: MessageSquare, label: "Forum", color: "text-sand/70" },
  video: { icon: PlayCircle, label: "Video", color: "text-red-400" },
};

/* ── grouped results helper ─────────────────────────────── */
function groupResults(results: SearchResult[]) {
  const order: SearchResult["type"][] = ["doc", "course", "blog", "forum", "video"];
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return order.filter((t) => groups[t]?.length).map((t) => ({ type: t, items: groups[t] }));
}

/* ══════════════════════════════════════════════════════════
   SmartSearch — modal overlay
   ══════════════════════════════════════════════════════════ */
interface SmartSearchProps {
  open: boolean;
  onClose: () => void;
}

export function SmartSearch({ open, onClose }: SmartSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* focus input when modal opens */
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* fetch results */
  const fetchResults = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setActiveIdx(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  /* keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigateTo(results[activeIdx]);
    }
  };

  const navigateTo = (result: SearchResult) => {
    onClose();
    if (result.type === "video") {
      window.open(result.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.href);
    }
  };

  if (!open) return null;

  const grouped = groupResults(results);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] bg-primary/80 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="w-full max-w-2xl bg-[#0d1117] border border-sand/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sand/10">
          {loading ? (
            <Loader2 size={18} className="text-teal animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-sand/40 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca documentazione, corsi, blog…"
            className="flex-1 bg-transparent text-sand placeholder-sand/30 font-mono text-sm outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-sand/30 hover:text-sand/60 transition-colors"
            aria-label="Chiudi ricerca"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && !loading && query && (
            <div className="px-4 py-10 text-center text-sand/30 text-sm font-mono">
              Nessun risultato per &ldquo;{query}&rdquo;
            </div>
          )}

          {results.length === 0 && !loading && !query && (
            <div className="px-4 py-6 text-center text-sand/20 text-xs font-mono">
              Digita per cercare in documentazione, corsi, blog e forum
            </div>
          )}

          {grouped.map(({ type, items }) => {
            const cfg = typeConfig[type as SearchResult["type"]];
            const Icon = cfg.icon;
            return (
              <div key={type} className="py-2">
                {/* Group header */}
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <Icon size={12} className={`${cfg.color} shrink-0`} />
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {/* Items */}
                {items.map((result, _i) => {
                  const globalIdx = results.indexOf(result);
                  const isActive = globalIdx === activeIdx;
                  return (
                    <button
                      key={result.id}
                      onClick={() => navigateTo(result)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                        isActive ? "bg-teal/10" : "hover:bg-sand/5"
                      }`}
                    >
                      <Icon
                        size={14}
                        className={`${cfg.color} shrink-0 mt-0.5`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-mono truncate ${
                            isActive ? "text-teal" : "text-sand/80"
                          }`}
                        >
                          {result.title}
                        </p>
                        <p className="text-[11px] text-sand/30 truncate mt-0.5">
                          {result.breadcrumb}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-sand/10 flex items-center gap-4 text-[10px] text-sand/20 font-mono">
          <span>↑↓ naviga</span>
          <span>↵ apri</span>
          <span>Esc chiudi</span>
          <span className="ml-auto">⌘K per aprire</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SmartSearchTrigger — icon button for the navbar
   ══════════════════════════════════════════════════════════ */
export function SmartSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-card border border-sand/15 text-sand/40 hover:text-sand/70 hover:border-sand/30 transition-colors text-xs font-mono"
      aria-label="Cerca (Cmd+K)"
    >
      <Search size={13} />
      <span>Cerca</span>
      <kbd className="ml-1 text-[10px] bg-sand/10 px-1.5 py-0.5 rounded text-sand/30">⌘K</kbd>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   SmartSearchInline — prominent search box for the homepage
   ══════════════════════════════════════════════════════════ */
export function SmartSearchInline({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full max-w-xl flex items-center gap-3 px-4 py-3 rounded-card bg-[#0d1117]/60 border border-sand/10 hover:border-teal/30 transition-colors text-left group"
      aria-label="Apri ricerca"
    >
      <Search size={16} className="text-sand/30 group-hover:text-teal/60 transition-colors shrink-0" />
      <span className="text-sand/30 text-sm font-mono group-hover:text-sand/50 transition-colors flex-1">
        Cerca in documentazione, corsi, blog…
      </span>
      <kbd className="text-[10px] bg-sand/10 px-1.5 py-0.5 rounded text-sand/25 font-mono shrink-0">
        ⌘K
      </kbd>
    </button>
  );
}
