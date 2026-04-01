"use client";

import { useState, useMemo } from "react";
import { PythonPlayground } from "./python-playground";
import { SqlPlayground } from "./sql-playground";

interface InteractiveContentProps {
  html: string;
}

interface CodeBlock {
  language: "python" | "sql" | "other";
  code: string;
  index: number;
}

function PythonBlock({ code }: { code: string }) {
  const [showPlayground, setShowPlayground] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-4 rounded-xl border border-teal/20 bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-teal/5 border-b border-teal/10">
        <span className="text-xs font-mono text-teal/60 uppercase tracking-widest">Python</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs font-mono text-sand/40 hover:text-sand transition px-2 py-1 rounded hover:bg-sand/10"
          >
            {copied ? "✓ Copiato" : "Copia"}
          </button>
          <button
            onClick={() => setShowPlayground(v => !v)}
            className="text-xs font-mono font-bold text-teal bg-teal/10 hover:bg-teal/20 transition px-3 py-1 rounded-lg border border-teal/30"
          >
            {showPlayground ? "✕ Chiudi" : "▶ Esegui nel browser"}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-sand/80">
        <code>{code}</code>
      </pre>
      {showPlayground && (
        <div className="border-t border-teal/10">
          <PythonPlayground initialCode={code} />
        </div>
      )}
    </div>
  );
}

function SqlBlock({ code }: { code: string }) {
  const [showPlayground, setShowPlayground] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-4 rounded-xl border border-[#79c0ff]/20 bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#79c0ff]/5 border-b border-[#79c0ff]/10">
        <span className="text-xs font-mono text-[#79c0ff]/60 uppercase tracking-widest">SQL</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs font-mono text-sand/40 hover:text-sand transition px-2 py-1 rounded hover:bg-sand/10"
          >
            {copied ? "✓ Copiato" : "Copia"}
          </button>
          <button
            onClick={() => setShowPlayground(v => !v)}
            className="text-xs font-mono font-bold text-[#79c0ff] bg-[#79c0ff]/10 hover:bg-[#79c0ff]/20 transition px-3 py-1 rounded-lg border border-[#79c0ff]/30"
          >
            {showPlayground ? "✕ Chiudi" : "▶ Prova"}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-sand/80">
        <code>{code}</code>
      </pre>
      {showPlayground && (
        <div className="border-t border-[#79c0ff]/10">
          <SqlPlayground initialQuery={code} />
        </div>
      )}
    </div>
  );
}

function GenericCodeBlock({ code }: { code: string }) {
  return (
    <div className="my-4 rounded-xl border border-sand/10 bg-[#0d1117] overflow-hidden">
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-sand/70">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Parse HTML string and extract code blocks, replacing them with placeholders */
function parseContent(html: string): { segments: Array<{ type: "html" | "python" | "sql" | "code"; content: string }>} {
  const segments: Array<{ type: "html" | "python" | "sql" | "code"; content: string }> = [];

  // Split HTML by <pre><code> blocks
  const regex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(html)) !== null) {
    // Add HTML before this code block
    if (match.index > lastIndex) {
      segments.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }

    const language = match[1] || "";
    const code = match[2]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'");

    if (language === "python" || (!language && detectPython(code))) {
      segments.push({ type: "python", content: code });
    } else if (language === "sql" || (!language && detectSql(code))) {
      segments.push({ type: "sql", content: code });
    } else {
      segments.push({ type: "code", content: code });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining HTML
  if (lastIndex < html.length) {
    segments.push({ type: "html", content: html.slice(lastIndex) });
  }

  return { segments };
}

function detectPython(code: string): boolean {
  return /\b(def |import |from |print\(|class |elif |for .* in |while |try:|except |lambda |None|True|False)\b/.test(code);
}

function detectSql(code: string): boolean {
  return /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i.test(code);
}

export function InteractiveContent({ html }: InteractiveContentProps) {
  const { segments } = useMemo(() => parseContent(html), [html]);

  return (
    <>
      <style>{`
        .lesson-prose h1 { font-family: ui-monospace, monospace; font-weight: 700; font-size: 1.5rem; color: #e8dcc8; margin-bottom: 1rem; margin-top: 2rem; }
        .lesson-prose h2 { font-family: ui-monospace, monospace; font-weight: 700; font-size: 1.25rem; color: #00D4AA; margin-bottom: 0.75rem; margin-top: 1.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,212,170,0.15); }
        .lesson-prose h3 { font-family: ui-monospace, monospace; font-weight: 600; font-size: 1.05rem; color: #e8dcc8; margin-bottom: 0.5rem; margin-top: 1.25rem; }
        .lesson-prose p { color: rgba(232,220,200,0.7); line-height: 1.75; margin-bottom: 1rem; }
        .lesson-prose ul, .lesson-prose ol { color: rgba(232,220,200,0.7); padding-left: 1.5rem; margin-bottom: 1rem; }
        .lesson-prose li { margin-bottom: 0.25rem; line-height: 1.7; }
        .lesson-prose code { font-family: ui-monospace, monospace; font-size: 0.85em; background: rgba(0,212,170,0.08); padding: 0.15em 0.4em; border-radius: 4px; color: #00D4AA; }
        .lesson-prose strong { color: #e8dcc8; font-weight: 600; }
        .lesson-prose a { color: #00D4AA; text-decoration: underline; text-decoration-color: rgba(0,212,170,0.3); }
        .lesson-prose blockquote { border-left: 3px solid rgba(0,212,170,0.4); padding-left: 1rem; margin-left: 0; color: rgba(232,220,200,0.5); font-style: italic; }
        .lesson-prose hr { border: none; border-top: 1px solid rgba(232,220,200,0.1); margin: 2rem 0; }
        .lesson-prose table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .lesson-prose th { background: rgba(0,212,170,0.08); color: #00D4AA; font-family: ui-monospace, monospace; font-size: 0.8rem; padding: 0.5rem; border: 1px solid rgba(232,220,200,0.1); text-align: left; }
        .lesson-prose td { padding: 0.5rem; border: 1px solid rgba(232,220,200,0.08); color: rgba(232,220,200,0.65); font-size: 0.875rem; }
      `}</style>
      <div className="lesson-prose">
        {segments.map((seg, i) => {
          if (seg.type === "html") {
            return <div key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />;
          }
          if (seg.type === "python") {
            return <PythonBlock key={i} code={seg.content} />;
          }
          if (seg.type === "sql") {
            return <SqlBlock key={i} code={seg.content} />;
          }
          return <GenericCodeBlock key={i} code={seg.content} />;
        })}
      </div>
    </>
  );
}
