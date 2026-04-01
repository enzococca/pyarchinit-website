"use client";

import { useState } from "react";

interface PythonPlaygroundProps {
  initialCode?: string;
}

interface ExecResult {
  success: boolean;
  output: string[];
}

/** Parse simple Python code and simulate output */
function simulatePython(code: string): ExecResult {
  if (!code.trim()) {
    return { success: false, output: ["Scrivi del codice Python..."] };
  }

  const lines = code.split("\n");
  const output: string[] = [];
  let hasError = false;

  // Track defined variables (simple)
  const variables: Record<string, string> = {};
  const defined_functions: string[] = [];
  const imported_modules: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("#")) continue;

    // Import statement
    if (/^(?:import|from)\s+(\w+)/.test(line)) {
      const m = line.match(/^(?:import|from)\s+(\w+)/);
      const modName = m?.[1] ?? "modulo";
      if (!imported_modules.includes(modName)) {
        imported_modules.push(modName);
        output.push(`✓ Modulo '${modName}' importato`);
      }
      continue;
    }

    // Function definition
    if (/^def\s+(\w+)\s*\(/.test(line)) {
      const m = line.match(/^def\s+(\w+)\s*\(/);
      const fnName = m?.[1] ?? "funzione";
      defined_functions.push(fnName);
      output.push(`✓ Funzione '${fnName}' definita`);
      continue;
    }

    // Class definition
    if (/^class\s+(\w+)/.test(line)) {
      const m = line.match(/^class\s+(\w+)/);
      output.push(`✓ Classe '${m?.[1] ?? "Classe"}' definita`);
      continue;
    }

    // Variable assignment
    if (/^([a-zA-Z_]\w*)\s*=\s*(.+)$/.test(line) && !line.startsWith("if ") && !line.startsWith("while ")) {
      const m = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (m) {
        const varName = m[1];
        const valExpr = m[2].trim();

        // Evaluate simple literals
        let displayVal = valExpr;
        if (/^["'](.*)["']$/.test(valExpr)) {
          displayVal = valExpr.replace(/^["']|["']$/g, "");
        } else if (/^\d+(\.\d+)?$/.test(valExpr)) {
          displayVal = valExpr;
        } else if (/^\[/.test(valExpr)) {
          displayVal = valExpr;
        } else if (/^\{/.test(valExpr)) {
          displayVal = valExpr;
        }
        variables[varName] = displayVal;
        output.push(`  ${varName} = ${displayVal}`);
      }
      continue;
    }

    // print() call — handle various forms
    if (/^print\s*\(/.test(line)) {
      const printed = parsePrint(line, variables);
      output.push(printed);
      continue;
    }

    // For loop
    if (/^for\s+\w+\s+in\s+/.test(line)) {
      output.push(`→ Esecuzione ciclo for...`);
      continue;
    }

    // If statement
    if (/^if\s+/.test(line)) {
      output.push(`→ Valutazione condizione if...`);
      continue;
    }

    // Try/except
    if (line === "try:") {
      output.push(`→ Esecuzione blocco try...`);
      continue;
    }

    // Return
    if (/^return\s+/.test(line)) {
      const val = line.replace(/^return\s+/, "");
      output.push(`  → return ${val}`);
      continue;
    }

    // Method calls (layer., qgs., iface., etc.)
    if (/^(?:layer|qgs|iface|canvas|vlayer|rlayer|result)\s*[.=]/.test(line)) {
      output.push(`  ✓ Operazione PyQGIS eseguita`);
      continue;
    }

    // Generic expression or function call
    if (/\w+\s*\(/.test(line)) {
      const m = line.match(/^(\w+)\s*\(/);
      const fnName = m?.[1] ?? "";
      if (defined_functions.includes(fnName)) {
        output.push(`  ✓ ${fnName}() chiamata`);
      } else {
        output.push(`  ✓ Istruzione eseguita`);
      }
      continue;
    }
  }

  if (output.length === 0) {
    output.push("Codice eseguito con successo!");
  }

  return { success: !hasError, output };
}

/** Parse a print() call and extract the string to display */
function parsePrint(line: string, variables: Record<string, string>): string {
  // Extract content between outermost parentheses
  const inner = line.replace(/^print\s*\(/, "").replace(/\)\s*$/, "");

  // f-string: f"text {var} more"
  const fstringMatch = inner.match(/^f["'](.*)["']$/);
  if (fstringMatch) {
    let text = fstringMatch[1];
    // Replace {varname} with variable values
    text = text.replace(/\{([^}]+)\}/g, (_m, expr) => {
      const varName = expr.trim();
      return variables[varName] ?? `{${varName}}`;
    });
    return text;
  }

  // Simple string
  const strMatch = inner.match(/^["'](.*)["']$/);
  if (strMatch) return strMatch[1];

  // Concatenation: "text" + var or var + "text"
  if (inner.includes("+")) {
    const parts = inner.split("+").map((p) => {
      const pt = p.trim();
      if (/^["'](.*)["']$/.test(pt)) return pt.replace(/^["']|["']$/g, "");
      if (variables[pt]) return variables[pt];
      return pt;
    });
    return parts.join("");
  }

  // Just a variable
  if (variables[inner.trim()]) return variables[inner.trim()];

  // Multiple args separated by comma
  if (inner.includes(",")) {
    const parts = inner.split(",").map((p) => {
      const pt = p.trim();
      if (/^["'](.*)["']$/.test(pt)) return pt.replace(/^["']|["']$/g, "");
      if (variables[pt]) return variables[pt];
      return pt;
    });
    return parts.join(" ");
  }

  return inner;
}

/** Syntax-highlight Python code for display */
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

  // Escape HTML
  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Protect strings (single and double quotes)
  const strings: string[] = [];
  // Double-quoted strings
  result = result.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (_m, s) => {
    const idx = strings.length;
    strings.push(`<span class="py-string">"${s}"</span>`);
    return `\x00STR${idx}\x00`;
  });
  // Single-quoted strings
  result = result.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (_m, s) => {
    const idx = strings.length;
    strings.push(`<span class="py-string">'${s}'</span>`);
    return `\x00STR${idx}\x00`;
  });

  // Comments
  result = result.replace(/(#[^\n]*)/g, '<span class="py-comment">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="py-number">$1</span>');

  // Keywords
  const kwRe = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  result = result.replace(kwRe, '<span class="py-keyword">$1</span>');

  // Built-ins
  const builtinRe = new RegExp(`\\b(${builtins.join("|")})\\b`, "g");
  result = result.replace(builtinRe, '<span class="py-builtin">$1</span>');

  // Restore strings
  result = result.replace(/\x00STR(\d+)\x00/g, (_m, idx) => strings[parseInt(idx)]);

  return result;
}

export function PythonPlayground({ initialCode = "" }: PythonPlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(simulatePython(code));
      setRunning(false);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleRun();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = code.substring(0, start) + "    " + code.substring(end);
      setCode(newVal);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div className="bg-[#0a0f1a] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-amber-400/60 uppercase tracking-widest">
          Python Playground
        </span>
        <span className="text-xs text-sand/20 font-mono">(simulato)</span>
        <span className="ml-auto text-xs text-sand/20 font-mono hidden sm:inline">
          Ctrl+Enter per eseguire
        </span>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-36 bg-[#0d1117] border border-sand/15 rounded-lg px-4 py-3 text-sm font-mono text-sand/80 focus:outline-none focus:border-amber-400/40 resize-y placeholder:text-sand/20"
        placeholder="Scrivi il tuo codice Python..."
        spellCheck={false}
      />

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleRun}
          disabled={running || !code.trim()}
          className="flex items-center gap-2 bg-amber-500 text-[#0a0f1a] font-mono text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-[#0a0f1a]/30 border-t-[#0a0f1a] rounded-full" />
              Eseguendo...
            </>
          ) : (
            <>▶ Esegui</>
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

      {/* Output */}
      {result && (
        <div className="mt-3">
          <div className="text-xs font-mono text-sand/30 uppercase tracking-widest mb-1 px-1">
            Output
          </div>
          <div
            className={`rounded-lg border font-mono text-sm p-3 space-y-0.5 ${
              result.success
                ? "bg-[#0d1117] border-amber-500/20"
                : "bg-terracotta/5 border-terracotta/20"
            }`}
          >
            {result.output.length === 0 ? (
              <span className="text-sand/30">// nessun output</span>
            ) : (
              result.output.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("✓") || line.startsWith("→")
                      ? "text-amber-400/70"
                      : line.startsWith("  ")
                      ? "text-teal/80 pl-2"
                      : "text-sand/80"
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
