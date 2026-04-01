"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { SqlPlayground } from "./sql-playground";
import { PythonPlayground } from "./python-playground";

interface InteractiveContentProps {
  html: string;
}

// Syntax highlight SQL keywords in rendered text
function highlightSql(code: string): string {
  const keywords = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
    "ON", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "INSERT", "INTO",
    "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "DROP", "ALTER",
    "ADD", "COLUMN", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE",
    "INDEX", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "DISTINCT",
    "COUNT", "SUM", "AVG", "MIN", "MAX", "BETWEEN", "LIKE", "EXISTS",
    "UNION", "ALL", "INTERSECT", "EXCEPT", "WITH", "CASE", "WHEN", "THEN",
    "ELSE", "END", "IF", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
    "VIEW", "TRIGGER", "PROCEDURE", "FUNCTION", "RETURNS", "RETURN",
    "INTEGER", "TEXT", "VARCHAR", "BOOLEAN", "DATE", "TIMESTAMP", "FLOAT",
    "SERIAL", "DEFAULT", "CONSTRAINT", "CASCADE", "RESTRICT",
  ];

  // Escape HTML first
  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight strings (single quotes) - mark with placeholder
  const strings: string[] = [];
  result = result.replace(/'([^']*)'/g, (_m, s) => {
    const idx = strings.length;
    strings.push(`<span class="sql-string">'${s}'</span>`);
    return `\x00STR${idx}\x00`;
  });

  // Highlight comments
  result = result.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');

  // Highlight keywords (word boundaries)
  const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
  result = result.replace(keywordRegex, (match) => {
    const upper = match.toUpperCase();
    if (keywords.includes(upper)) {
      return `<span class="sql-keyword">${match}</span>`;
    }
    return match;
  });

  // Restore strings
  result = result.replace(/\x00STR(\d+)\x00/g, (_m, idx) => strings[parseInt(idx)]);

  return result;
}

// Syntax highlight Python keywords in rendered text
function highlightPython(code: string): string {
  const keywords = [
    "False", "None", "True", "and", "as", "assert", "async", "await",
    "break", "class", "continue", "def", "del", "elif", "else", "except",
    "finally", "for", "from", "global", "if", "import", "in", "is",
    "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
    "while", "with", "yield",
  ];
  const builtins = [
    "print", "len", "range", "int", "float", "str", "list", "dict",
    "tuple", "set", "bool", "type", "isinstance", "enumerate", "zip",
    "map", "filter", "sorted", "reversed", "open", "sum", "min", "max",
    "abs", "round", "input", "super", "self",
  ];

  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const strings: string[] = [];
  result = result.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (_m, s) => {
    const idx = strings.length;
    strings.push(`<span class="py-string">"${s}"</span>`);
    return `\x00STR${idx}\x00`;
  });
  result = result.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (_m, s) => {
    const idx = strings.length;
    strings.push(`<span class="py-string">'${s}'</span>`);
    return `\x00STR${idx}\x00`;
  });

  result = result.replace(/(#[^\n]*)/g, '<span class="py-comment">$1</span>');
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="py-number">$1</span>');

  const kwRe = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  result = result.replace(kwRe, '<span class="py-keyword">$1</span>');

  const builtinRe = new RegExp(`\\b(${builtins.join("|")})\\b`, "g");
  result = result.replace(builtinRe, '<span class="py-builtin">$1</span>');

  result = result.replace(/\x00STR(\d+)\x00/g, (_m, idx) => strings[parseInt(idx)]);
  return result;
}

interface PythonBlockProps {
  code: string;
}

function PythonBlock({ code }: PythonBlockProps) {
  const [showPlayground, setShowPlayground] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-card border border-sand/15 bg-[#0d1117] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-sand/5 border-b border-sand/10">
        <span className="text-xs font-mono text-amber-400/50 uppercase tracking-widest">Python</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-mono text-sand/40 hover:text-sand transition-colors px-2 py-1 rounded hover:bg-sand/10"
          >
            {copied ? "Copiato!" : "Copia"}
          </button>
          <button
            onClick={() => setShowPlayground((v) => !v)}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded hover:bg-amber-400/10 border border-amber-400/20"
          >
            {showPlayground ? "Chiudi" : "▶ Esegui nel browser"}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed font-mono"
        dangerouslySetInnerHTML={{ __html: highlightPython(code) }}
      />

      {/* Playground */}
      {showPlayground && (
        <div className="border-t border-sand/10">
          <PythonPlayground initialCode={code} />
        </div>
      )}
    </div>
  );
}

interface ExerciseBlockProps {
  titleHtml: string;
  bodyHtml: string;
  solutionHtml: string;
}

function ExerciseBlock({ titleHtml, bodyHtml, solutionHtml }: ExerciseBlockProps) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="my-6 rounded-card border border-ochre/25 bg-ochre/5 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-ochre/10 border-b border-ochre/20">
        <span className="text-ochre font-mono text-xs uppercase tracking-widest font-semibold">
          Esercizio
        </span>
      </div>
      <div
        className="px-5 py-4 prose prose-invert prose-sm max-w-none lesson-prose"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {solutionHtml && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setShowSolution((v) => !v)}
            className="text-xs font-mono text-ochre border border-ochre/30 px-3 py-1.5 rounded-lg hover:bg-ochre/10 transition-colors"
          >
            {showSolution ? "Nascondi soluzione" : "Mostra soluzione"}
          </button>
          {showSolution && (
            <div
              className="mt-3 prose prose-invert prose-sm max-w-none lesson-prose"
              dangerouslySetInnerHTML={{ __html: solutionHtml }}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface SqlBlockProps {
  code: string;
}

function SqlBlock({ code }: SqlBlockProps) {
  const [showPlayground, setShowPlayground] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-card border border-sand/15 bg-[#0d1117] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-sand/5 border-b border-sand/10">
        <span className="text-xs font-mono text-sand/30 uppercase tracking-widest">SQL</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-mono text-sand/40 hover:text-sand transition-colors px-2 py-1 rounded hover:bg-sand/10"
          >
            {copied ? "Copiato!" : "Copia"}
          </button>
          <button
            onClick={() => setShowPlayground((v) => !v)}
            className="text-xs font-mono text-teal hover:text-teal/80 transition-colors px-2 py-1 rounded hover:bg-teal/10 border border-teal/20"
          >
            {showPlayground ? "Chiudi" : "Prova →"}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed font-mono"
        dangerouslySetInnerHTML={{ __html: highlightSql(code) }}
      />

      {/* Playground */}
      {showPlayground && (
        <div className="border-t border-sand/10">
          <SqlPlayground initialQuery={code} />
        </div>
      )}
    </div>
  );
}

interface QuizBlockProps {
  questionHtml: string;
  answerHtml: string;
}

function QuizBlock({ questionHtml, answerHtml }: QuizBlockProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-6 rounded-card border border-teal/20 bg-teal/5 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-teal/10 border-b border-teal/15">
        <span className="text-teal font-mono text-xs uppercase tracking-widest font-semibold">
          Domanda
        </span>
      </div>
      <div
        className="px-5 py-4 prose prose-invert prose-sm max-w-none lesson-prose"
        dangerouslySetInnerHTML={{ __html: questionHtml }}
      />
      {answerHtml && (
        <div className="px-5 pb-4">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="text-xs font-mono text-teal border border-teal/30 px-3 py-1.5 rounded-lg hover:bg-teal/10 transition-colors"
            >
              Mostra risposta
            </button>
          ) : (
            <div
              className="mt-2 p-3 bg-teal/10 border border-teal/20 rounded-lg prose prose-invert prose-sm max-w-none lesson-prose"
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function InteractiveContent({ html }: InteractiveContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedHtml, setProcessedHtml] = useState("");
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  useEffect(() => {
    // We process on client side using DOM parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    // Track what we'll need to mount
    const mountPoints: Array<{
      placeholder: HTMLElement;
      component: React.ReactNode;
    }> = [];

    // --- Process SQL and Python code blocks ---
    const codeBlocks = body.querySelectorAll("pre code.language-sql, pre code.language-python, pre code");
    codeBlocks.forEach((codeEl, idx) => {
      const cls = codeEl.className ?? "";
      const isSql = cls.includes("language-sql") || cls.includes("language-SQL");
      const isPython = cls.includes("language-python") || cls.includes("language-Python");
      const pre = codeEl.parentElement;
      if (!pre || pre.tagName !== "PRE") return;

      const code = codeEl.textContent ?? "";

      if (isSql || (!isPython && detectSql(code))) {
        const placeholder = doc.createElement("div");
        placeholder.setAttribute("data-react-id", `sql-${idx}`);
        pre.replaceWith(placeholder);
        mountPoints.push({
          placeholder,
          component: <SqlBlock code={code} />,
        });
      } else if (isPython || detectPython(code)) {
        const placeholder = doc.createElement("div");
        placeholder.setAttribute("data-react-id", `python-${idx}`);
        pre.replaceWith(placeholder);
        mountPoints.push({
          placeholder,
          component: <PythonBlock code={code} />,
        });
      }
    });

    // --- Process Exercise sections ---
    // Look for headings containing "Esercizio" or "Exercise"
    const headings = body.querySelectorAll("h2, h3, h4");
    headings.forEach((heading, idx) => {
      const text = heading.textContent ?? "";
      const isExercise = /esercizio|exercise|lab:/i.test(text);
      const isQuiz = /domanda|quiz|question/i.test(text);

      if (!isExercise && !isQuiz) return;

      // Collect siblings until next heading of same or higher level
      const tag = heading.tagName;
      const siblings: Element[] = [];
      let solutionSiblings: Element[] = [];
      let inSolution = false;
      let el = heading.nextElementSibling;

      while (el) {
        if (el.tagName === tag || el.tagName < tag) break;
        const elText = el.textContent ?? "";
        if (/soluzione|solution|risposta|answer/i.test(elText) && el.tagName.startsWith("H")) {
          inSolution = true;
          el = el.nextElementSibling;
          continue;
        }
        if (inSolution) {
          solutionSiblings.push(el);
        } else {
          siblings.push(el);
        }
        el = el.nextElementSibling;
      }

      if (siblings.length === 0 && solutionSiblings.length === 0) return;

      // Build HTML strings
      const bodyHtml = siblings.map((s) => s.outerHTML).join("");
      const solutionHtml = solutionSiblings.map((s) => s.outerHTML).join("");
      const titleHtml = heading.innerHTML;

      // Replace heading + siblings with placeholder
      const placeholder = doc.createElement("div");
      placeholder.setAttribute("data-react-id", `exercise-${idx}`);
      heading.replaceWith(placeholder);
      siblings.forEach((s) => s.remove());
      solutionSiblings.forEach((s) => s.remove());

      if (isExercise) {
        mountPoints.push({
          placeholder,
          component: (
            <ExerciseBlock
              titleHtml={titleHtml}
              bodyHtml={bodyHtml}
              solutionHtml={solutionHtml}
            />
          ),
        });
      } else if (isQuiz) {
        mountPoints.push({
          placeholder,
          component: (
            <QuizBlock questionHtml={bodyHtml} answerHtml={solutionHtml} />
          ),
        });
      }
    });

    setProcessedHtml(body.innerHTML);

    // Schedule mount points
    setTimeout(() => {
      // Cleanup old roots
      rootsRef.current.forEach((r) => {
        try {
          r.unmount();
        } catch {
          // ignore
        }
      });
      rootsRef.current = [];

      if (!containerRef.current) return;

      mountPoints.forEach(({ placeholder, component }) => {
        const id = placeholder.getAttribute("data-react-id");
        if (!id) return;
        const el = containerRef.current!.querySelector(`[data-react-id="${id}"]`);
        if (!el) return;
        const root = createRoot(el);
        root.render(component);
        rootsRef.current.push(root);
      });
    }, 0);

    return () => {
      rootsRef.current.forEach((r) => {
        try {
          r.unmount();
        } catch {
          // ignore
        }
      });
    };
  }, [html]);

  return (
    <>
      <style>{`
        .lesson-prose h1 { font-family: ui-monospace, monospace; font-weight: 700; font-size: 1.5rem; color: #e8dcc8; margin-bottom: 1rem; margin-top: 2rem; }
        .lesson-prose h2 { font-family: ui-monospace, monospace; font-weight: 700; font-size: 1.25rem; color: #e8dcc8; margin-bottom: 0.75rem; margin-top: 1.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid rgba(232,220,200,0.1); }
        .lesson-prose h3 { font-family: ui-monospace, monospace; font-weight: 600; font-size: 1rem; color: #e8dcc8; margin-bottom: 0.5rem; margin-top: 1.25rem; }
        .lesson-prose p { color: rgba(232,220,200,0.7); line-height: 1.75; margin-bottom: 1rem; }
        .lesson-prose ul, .lesson-prose ol { color: rgba(232,220,200,0.7); padding-left: 1.5rem; margin-bottom: 1rem; }
        .lesson-prose li { margin-bottom: 0.25rem; line-height: 1.7; }
        .lesson-prose code { font-family: ui-monospace, monospace; font-size: 0.85em; background: rgba(232,220,200,0.08); padding: 0.15em 0.4em; border-radius: 4px; color: #00D4AA; }
        .lesson-prose pre code { background: transparent; padding: 0; color: inherit; font-size: 0.875rem; }
        .lesson-prose blockquote { border-left: 3px solid rgba(0,212,170,0.4); padding-left: 1rem; margin-left: 0; color: rgba(232,220,200,0.5); font-style: italic; }
        .lesson-prose table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .lesson-prose th { background: rgba(0,212,170,0.1); color: #00D4AA; font-mono: monospace; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 0.75rem; border: 1px solid rgba(232,220,200,0.1); text-align: left; }
        .lesson-prose td { padding: 0.5rem 0.75rem; border: 1px solid rgba(232,220,200,0.08); color: rgba(232,220,200,0.65); font-size: 0.875rem; }
        .lesson-prose tr:hover td { background: rgba(232,220,200,0.03); }
        .lesson-prose strong { color: #e8dcc8; font-weight: 600; }
        .lesson-prose a { color: #00D4AA; text-decoration: underline; text-decoration-color: rgba(0,212,170,0.3); }
        .lesson-prose a:hover { color: #00efc0; }
        .lesson-prose hr { border: none; border-top: 1px solid rgba(232,220,200,0.1); margin: 2rem 0; }
        .lesson-prose img { max-width: 100%; border-radius: 0.5rem; }
        /* SQL syntax highlight */
        .sql-keyword { color: #79c0ff; font-weight: 600; }
        .sql-string { color: #a5d6a7; }
        .sql-comment { color: rgba(232,220,200,0.35); font-style: italic; }
        /* Python syntax highlight */
        .py-keyword { color: #ff7b72; font-weight: 600; }
        .py-builtin { color: #d2a8ff; }
        .py-string { color: #a5d6a7; }
        .py-comment { color: rgba(232,220,200,0.35); font-style: italic; }
        .py-number { color: #f8c555; }
      `}</style>
      <article
        ref={containerRef}
        className="lesson-prose"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  );
}

/** Heuristic: does this code block look like SQL? */
function detectSql(code: string): boolean {
  const sqlPattern = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i;
  return sqlPattern.test(code);
}

/** Heuristic: does this code block look like Python? */
function detectPython(code: string): boolean {
  const pyPattern = /\b(def |import |from |print\(|class |elif |for .* in |while |try:|except |lambda |None|True|False)\b/;
  return pyPattern.test(code);
}
