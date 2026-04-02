"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Trash2, Plus, Loader2, Terminal } from "lucide-react";

// Pyodide types
declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    get: (name: string) => unknown;
  };
}

// Module-level singleton so Pyodide is shared across all playground instances
let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadPromise: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoadPromise) return pyodideLoadPromise;

  pyodideLoadPromise = (async () => {
    // Inject script tag if not already present
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });
    }

    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });

    // Redirect stdout/stderr to our capture object
    pyodide.runPython(`
import sys
from io import StringIO

class _Capture:
    def __init__(self):
        self._buf = []
    def write(self, text):
        self._buf.append(text)
    def flush(self):
        pass
    def getvalue(self):
        return ''.join(self._buf)
    def clear(self):
        self._buf = []

_stdout_cap = _Capture()
_stderr_cap = _Capture()
sys.stdout = _stdout_cap
sys.stderr = _stderr_cap
`);

    // Pre-install common scientific packages
    try {
      await pyodide.runPythonAsync(`
import micropip
await micropip.install(["numpy", "pandas", "scipy", "matplotlib"])
print("Pacchetti scientifici installati")
`);
    } catch {
      // Continue without - not all packages may be available
    }

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadPromise;
}

interface Cell {
  id: string;
  code: string;
  output: string;
  error: string;
  running: boolean;
  executionCount: number | null;
}

let globalExecCounter = 0;

/** Detect Python imports that might need micropip installation */
function detectImports(code: string): string[] {
  const packages = new Set<string>();
  const importRe = /(?:^|\n)\s*(?:import|from)\s+(\w+)/g;
  let m;
  while ((m = importRe.exec(code)) !== null) {
    const pkg = m[1];
    // Only external packages (not builtins)
    const builtins = new Set([
      "sys", "os", "math", "json", "csv", "re", "datetime", "time",
      "collections", "functools", "itertools", "io", "string", "random",
      "statistics", "pathlib", "abc", "typing", "dataclasses", "enum",
      "copy", "operator", "textwrap", "unittest", "ast", "inspect",
      "hashlib", "base64", "struct", "array", "bisect", "heapq",
    ]);
    if (!builtins.has(pkg) && !pkg.startsWith("_")) {
      // Map common aliases
      const pkgMap: Record<string, string> = {
        np: "numpy", pd: "pandas", plt: "matplotlib",
        scipy: "scipy", sklearn: "scikit-learn",
        cv2: "opencv-python", PIL: "Pillow",
      };
      packages.add(pkgMap[pkg] || pkg);
    }
  }
  return Array.from(packages);
}

function makeCell(code = ""): Cell {
  return {
    id: Math.random().toString(36).slice(2),
    code,
    output: "",
    error: "",
    running: false,
    executionCount: null,
  };
}

export interface PythonPlaygroundProps {
  initialCode?: string;
}

export function PythonPlayground({ initialCode = "" }: PythonPlaygroundProps) {
  const [cells, setCells] = useState<Cell[]>(() => [makeCell(initialCode)]);
  const [pyodideStatus, setPyodideStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [pyodideError, setPyodideError] = useState<string>("");
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Auto-resize textarea helper
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const ensurePyodide = useCallback(async () => {
    if (pyodideStatus === "ready") return true;
    if (pyodideStatus === "loading") {
      // Wait for it
      try {
        await getPyodide();
        return true;
      } catch {
        return false;
      }
    }
    setPyodideStatus("loading");
    try {
      await getPyodide();
      setPyodideStatus("ready");
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPyodideError(msg);
      setPyodideStatus("error");
      return false;
    }
  }, [pyodideStatus]);

  // Sync status once Pyodide is already loaded (e.g. second instance)
  useEffect(() => {
    if (pyodideInstance) setPyodideStatus("ready");
  }, []);

  const runCell = useCallback(
    async (cellId: string) => {
      const ready = await ensurePyodide();
      if (!ready) return;

      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId ? { ...c, running: true, output: "", error: "" } : c
        )
      );

      try {
        const pyodide = await getPyodide();

        // Clear capture buffers
        pyodide.runPython(`_stdout_cap.clear(); _stderr_cap.clear()`);

        const cell = cells.find((c) => c.id === cellId);
        if (!cell) return;

        // Auto-install packages if code imports them
        const importedPackages = detectImports(cell.code);
        if (importedPackages.length > 0) {
          try {
            await pyodide.runPythonAsync(
              `import micropip\nawait micropip.install([${importedPackages.map(p => `"${p}"`).join(",")}])`
            );
          } catch {
            // Package might already be installed or not available - continue anyway
          }
        }

        // Setup matplotlib to save to base64 instead of showing
        try {
          await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
plt.close('all')
_plot_data = None
_original_show = plt.show
def _capture_show(*args, **kwargs):
    global _plot_data
    import io, base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                facecolor='#0d1117', edgecolor='none')
    buf.seek(0)
    _plot_data = base64.b64encode(buf.read()).decode('utf-8')
    plt.close('all')
plt.show = _capture_show
`);
        } catch {
          // matplotlib might not be installed yet - ok
        }

        let returnVal: unknown = undefined;
        let execError = "";
        try {
          returnVal = await pyodide.runPythonAsync(cell.code);
        } catch (e: unknown) {
          execError = e instanceof Error ? e.message : String(e);
        }

        const stdout = String(
          (pyodide.globals.get("_stdout_cap") as { getvalue: () => string }).getvalue()
        );
        const stderr = String(
          (pyodide.globals.get("_stderr_cap") as { getvalue: () => string }).getvalue()
        );

        // Check for matplotlib plot output
        let plotBase64 = "";
        try {
          const plotData = pyodide.globals.get("_plot_data");
          if (plotData && String(plotData) !== "None") {
            plotBase64 = String(plotData);
            pyodide.runPython("_plot_data = None");
          }
        } catch {
          // no plot
        }

        globalExecCounter += 1;
        const count = globalExecCounter;

        // Build output string
        let outputStr = stdout;
        if (stderr) outputStr += (outputStr ? "\n" : "") + stderr;
        if (plotBase64) {
          outputStr += (outputStr ? "\n" : "") + "%%PLOT%%" + plotBase64;
        }
        if (
          returnVal !== undefined &&
          returnVal !== null &&
          String(returnVal) !== "undefined"
        ) {
          if (returnVal !== null) {
            outputStr += (outputStr ? "\n" : "") + String(returnVal);
          }
        }

        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  running: false,
                  output: outputStr,
                  error: execError,
                  executionCount: count,
                }
              : c
          )
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? { ...c, running: false, error: msg }
              : c
          )
        );
      }
    },
    [cells, ensurePyodide]
  );

  const addCell = useCallback(() => {
    setCells((prev) => [...prev, makeCell()]);
  }, []);

  const clearCell = useCallback((cellId: string) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId ? { ...c, output: "", error: "", executionCount: null } : c
      )
    );
  }, []);

  const updateCellCode = useCallback((cellId: string, code: string) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, code } : c))
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, cellId: string) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCell(cellId);
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const cell = cells.find((c) => c.id === cellId);
        if (!cell) return;
        const newCode =
          cell.code.substring(0, start) + "    " + cell.code.substring(end);
        updateCellCode(cellId, newCode);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 4;
        });
      }
    },
    [cells, runCell, updateCellCode]
  );

  return (
    <div className="bg-[#0a0f1a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Terminal size={14} className="text-amber-400/60" />
        <span className="text-xs font-mono text-amber-400/60 uppercase tracking-widest">
          Python (Pyodide)
        </span>
        {pyodideStatus === "loading" && (
          <span className="flex items-center gap-1.5 text-xs text-sand/40 font-mono ml-2">
            <Loader2 size={11} className="animate-spin" />
            Caricamento Python + numpy/pandas/scipy...
          </span>
        )}
        {pyodideStatus === "ready" && (
          <span className="text-xs text-teal/60 font-mono ml-2">
            ● Pronto
          </span>
        )}
        {pyodideStatus === "error" && (
          <span className="text-xs text-red-400/80 font-mono ml-2 truncate max-w-xs">
            Errore: {pyodideError}
          </span>
        )}
        <span className="ml-auto text-xs text-sand/20 font-mono hidden sm:inline">
          Ctrl+Enter per eseguire
        </span>
      </div>

      {/* Cells */}
      {cells.map((cell, idx) => (
        <div
          key={cell.id}
          className="border border-sand/15 rounded-lg overflow-hidden"
        >
          {/* Cell toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sand/5 border-b border-sand/10">
            <span className="text-xs font-mono text-sand/30 w-16">
              {cell.executionCount !== null
                ? `In [${cell.executionCount}]:`
                : `In [${idx + 1}]:`}
            </span>
            <div className="flex-1" />
            {(cell.output || cell.error) && (
              <button
                onClick={() => clearCell(cell.id)}
                className="flex items-center gap-1 text-xs font-mono text-sand/30 hover:text-sand/60 transition-colors px-1.5 py-0.5 rounded hover:bg-sand/10"
                title="Pulisci output"
              >
                <Trash2 size={11} />
                Pulisci
              </button>
            )}
            <button
              onClick={() => runCell(cell.id)}
              disabled={cell.running || pyodideStatus === "error"}
              className="flex items-center gap-1.5 bg-amber-500 text-[#0a0f1a] font-mono text-xs font-bold px-3 py-1 rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cell.running ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Eseguendo...
                </>
              ) : (
                <>
                  <Play size={11} />
                  Esegui
                </>
              )}
            </button>
          </div>

          {/* Code textarea */}
          <textarea
            ref={(el) => {
              textareaRefs.current[cell.id] = el;
              if (el) autoResize(el);
            }}
            value={cell.code}
            onChange={(e) => {
              updateCellCode(cell.id, e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={(e) => handleKeyDown(e, cell.id)}
            className="w-full min-h-[80px] bg-[#0d1117] px-4 py-3 text-sm font-mono text-sand/80 focus:outline-none resize-none placeholder:text-sand/20"
            placeholder="Scrivi il tuo codice Python..."
            spellCheck={false}
            style={{ overflow: "hidden" }}
          />

          {/* Output */}
          {(cell.output || cell.error) && (
            <div className="border-t border-sand/10">
              <div className="px-3 py-1.5 bg-sand/3 border-b border-sand/8">
                <span className="text-xs font-mono text-sand/30">
                  {cell.executionCount !== null
                    ? `Out [${cell.executionCount}]:`
                    : "Output:"}
                </span>
              </div>
              <div className="bg-[#0d1117] px-4 py-3 font-mono text-sm">
                {cell.error ? (
                  <pre className="text-red-400 whitespace-pre-wrap text-xs leading-relaxed">
                    {cell.error}
                  </pre>
                ) : cell.output ? (
                  <div>
                    {cell.output.split("%%PLOT%%").map((part, idx) => {
                      if (idx === 0) {
                        return part ? (
                          <pre key={idx} className="text-sand/80 whitespace-pre-wrap text-xs leading-relaxed">
                            {part}
                          </pre>
                        ) : null;
                      }
                      // This part is a base64 PNG image
                      const nextTextIdx = part.indexOf("\n");
                      const imgData = nextTextIdx > 0 ? part.substring(0, nextTextIdx) : part;
                      const remaining = nextTextIdx > 0 ? part.substring(nextTextIdx + 1) : "";
                      return (
                        <div key={idx}>
                          <img
                            src={`data:image/png;base64,${imgData}`}
                            alt="matplotlib plot"
                            className="max-w-full rounded-lg my-2 border border-sand/10"
                          />
                          {remaining && (
                            <pre className="text-sand/80 whitespace-pre-wrap text-xs leading-relaxed">
                              {remaining}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sand/30 text-xs">// nessun output</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add cell */}
      <button
        onClick={addCell}
        className="flex items-center gap-2 text-xs font-mono text-sand/30 hover:text-sand/60 transition-colors border border-dashed border-sand/15 hover:border-sand/30 rounded-lg px-4 py-2 w-full justify-center"
      >
        <Plus size={12} />
        Aggiungi cella
      </button>
    </div>
  );
}
