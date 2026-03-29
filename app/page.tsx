"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/components/public/locale-provider";

/* ═══════════════════════════════════════════
   REAL pyArchInit CODE SNIPPETS
   ═══════════════════════════════════════════ */
const codeSnippets = [
  {
    filename: "pyarchinitPlugin.py",
    lines: [
      { text: "class PyArchInitPlugin(object):", color: "keyword" },
      { text: "    HOME = os.environ['PYARCHINIT_HOME']", color: "normal" },
      { text: "    PARAMS_DICT = {", color: "normal" },
      { text: "        'SERVER': '',", color: "string" },
      { text: "        'HOST': '',", color: "string" },
      { text: "        'DATABASE': '',", color: "string" },
      { text: "        'PASSWORD': '',", color: "string" },
      { text: "        'PORT': '',", color: "string" },
      { text: "        'USER': ''", color: "string" },
      { text: "    }", color: "normal" },
      { text: "", color: "normal" },
      { text: "    def __init__(self, iface):", color: "keyword" },
      { text: "        self.iface = iface", color: "self" },
      { text: "        self.plugin_window = None", color: "self" },
    ],
  },
  {
    filename: "US_USM.py",
    lines: [
      { text: "from ..modules.db.pyarchinit_conn_strings import Connection", color: "import" },
      { text: "from ..modules.db.pyarchinit_db_manager import Pyarchinit_db_management", color: "import" },
      { text: "from ..modules.db.pyarchinit_utility import Utility", color: "import" },
      { text: "from ..modules.gis.pyarchinit_pyqgis import Pyarchinit_pyqgis", color: "import" },
      { text: "from ..modules.utility.pyarchinit_error_check import Error_check", color: "import" },
      { text: "", color: "normal" },
      { text: "class pyarchinit_US(QDialog, MAIN_DIALOG_CLASS):", color: "keyword" },
      { text: '    """Gestione Unità Stratigrafiche"""', color: "comment" },
      { text: "", color: "normal" },
      { text: "    def __init__(self, iface):", color: "keyword" },
      { text: "        super().__init__()", color: "self" },
      { text: "        self.iface = iface", color: "self" },
      { text: "        self.pyQGIS = Pyarchinit_pyqgis(iface)", color: "self" },
      { text: "        self.setupUi(self)", color: "self" },
    ],
  },
  {
    filename: "pyarchinit_db_manager.py",
    lines: [
      { text: "class Pyarchinit_db_management(object):", color: "keyword" },
      { text: "    metadata = MetaData()", color: "normal" },
      { text: "    engine = None", color: "normal" },
      { text: "", color: "normal" },
      { text: "    def connection(self):", color: "keyword" },
      { text: "        cfg = Connection()", color: "normal" },
      { text: "        conn_str = cfg.conn_str()", color: "normal" },
      { text: "        self.engine = create_engine(conn_str)", color: "self" },
      { text: "        self.metadata.create_all(self.engine)", color: "self" },
      { text: "", color: "normal" },
      { text: "    def insert_values(self, *args):", color: "keyword" },
      { text: "        session = sessionmaker(bind=self.engine)()", color: "normal" },
      { text: "        record = self.table(*args)", color: "normal" },
      { text: "        session.add(record)", color: "normal" },
    ],
  },
  {
    filename: "Site.py",
    lines: [
      { text: "class pyarchinit_Site(QDialog, MAIN_DIALOG_CLASS):", color: "keyword" },
      { text: '    """Gestione Scheda Sito Archeologico"""', color: "comment" },
      { text: "    L = QgsSettings().value('locale/userLocale')[0:2]", color: "normal" },
      { text: "", color: "normal" },
      { text: "    def __init__(self, iface):", color: "keyword" },
      { text: "        super().__init__()", color: "self" },
      { text: "        self.iface = iface", color: "self" },
      { text: "        self.pyQGIS = Pyarchinit_pyqgis(iface)", color: "self" },
      { text: "        self.setupUi(self)", color: "self" },
      { text: "        self.currentLayerId = None", color: "self" },
      { text: "", color: "normal" },
      { text: "    def on_pushButton_search_pressed(self):", color: "keyword" },
      { text: "        search_dict = self.compile_search()", color: "normal" },
      { text: "        records = self.DB_MANAGER.query_bool(search_dict)", color: "normal" },
    ],
  },
];

/* ═══════════════════════════════════════════
   THOUGHT BUBBLES - Real dev thoughts (keys resolved at runtime)
   ═══════════════════════════════════════════ */
const thoughtKeys = [
  { key: "thought.harris", icon: "🔗" },
  { key: "thought.gis_layer", icon: "🗺️" },
  { key: "thought.us_relations", icon: "📐" },
  { key: "thought.postgres", icon: "🗄️" },
  { key: "thought.plugin", icon: "🧩" },
  { key: "thought.photogrammetry", icon: "📷" },
  { key: "thought.pdf_export", icon: "📄" },
  { key: "thought.gna", icon: "📋" },
  { key: "thought.period", icon: "⏳" },
  { key: "thought.webodm", icon: "🛸" },
];

/* ═══════════════════════════════════════════
   KEYBOARD LAYOUT (Italian ISO)
   ═══════════════════════════════════════════ */
const keyboardRows = [
  ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "ì", "⌫"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "è", "+", "\\"],
  ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ò", "à", "ù", "⏎"],
  ["⇧", "<", "z", "x", "c", "v", "b", "n", "m", ",", ".", "-", "⇧"],
  ["Ctrl", "⌘", "Alt", " ", "Alt", "Fn", "Ctrl"],
];

const specialWidths: Record<string, string> = {
  Esc: "w-10", "⌫": "w-14", Tab: "w-14", "\\": "w-10",
  Caps: "w-16", "⏎": "w-14", "⇧": "w-14", " ": "w-48",
  Ctrl: "w-12", "⌘": "w-10", Alt: "w-10", Fn: "w-10", "<": "w-8",
};

/* ═══════════════════════════════════════════
   SYNTAX HIGHLIGHTING COLORS
   ═══════════════════════════════════════════ */
const syntaxColors: Record<string, string> = {
  keyword: "#c792ea",
  string: "#c3e88d",
  comment: "#546e7a",
  import: "#89ddff",
  self: "#f78c6c",
  normal: "#d4d4d4",
};

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */

function MonitorScreen({
  snippet,
  charIndex,
}: {
  snippet: (typeof codeSnippets)[0];
  charIndex: number;
}) {
  let totalChars = 0;

  return (
    <div className="monitor-screen">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border-b border-[#333] rounded-t-lg">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-[10px] text-[#888] font-mono ml-2">{snippet.filename}</span>
        <div className="flex-1" />
        <span className="text-[9px] text-[#555] font-mono">pyArchInit</span>
      </div>

      {/* Code area */}
      <div className="bg-[#1e1e1e] p-3 rounded-b-lg font-mono text-[11px] md:text-xs leading-[1.6] min-h-[220px] md:min-h-[280px] overflow-hidden">
        {snippet.lines.map((line, lineIdx) => {
          const lineStart = totalChars;
          totalChars += line.text.length + 1;
          const visibleChars = Math.max(0, Math.min(line.text.length, charIndex - lineStart));
          const visibleText = line.text.substring(0, visibleChars);
          const showCursor = charIndex >= lineStart && charIndex < lineStart + line.text.length + 1;

          return (
            <div key={lineIdx} className="flex">
              <span className="w-6 text-right mr-3 text-[#444] select-none text-[10px]">
                {lineIdx + 1}
              </span>
              <span style={{ color: syntaxColors[line.color] || "#d4d4d4" }}>
                {visibleText}
                {showCursor && (
                  <span className="inline-block w-[7px] h-[14px] bg-[#00D4AA] animate-blink align-middle ml-px" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Keyboard({ activeKey }: { activeKey: string }) {
  return (
    <div className="keyboard-container perspective-[800px]">
      <div className="transform rotateX(12deg) space-y-[3px] md:space-y-1">
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-[3px] md:gap-1 justify-center">
            {row.map((key, keyIdx) => {
              const isActive = activeKey.toLowerCase() === key.toLowerCase() ||
                (key === " " && activeKey === " ") ||
                (key === "⇧" && activeKey === "Shift") ||
                (key === "⏎" && activeKey === "Enter");
              const width = specialWidths[key] || "w-7 md:w-8";

              return (
                <div
                  key={`${rowIdx}-${keyIdx}`}
                  className={`
                    ${width} h-7 md:h-8 rounded-[4px] flex items-center justify-center
                    text-[8px] md:text-[9px] font-mono select-none
                    transition-all duration-75
                    ${isActive
                      ? "bg-[#00D4AA] text-[#0a0e17] shadow-[0_0_12px_rgba(0,212,170,0.6),inset_0_-1px_0_rgba(0,0,0,0.2)] scale-95 translate-y-[1px]"
                      : "bg-[#2a2a3a] text-[#666] shadow-[0_2px_0_#1a1a2a,inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#333347]"
                    }
                  `}
                >
                  {key === " " ? "" : key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThoughtCloud({
  thought,
  side,
  topPct,
  visible,
}: {
  thought: { text: string; icon: string };
  side: "left" | "right";
  topPct: number;
  visible: boolean;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: side === "left" ? undefined : undefined,
        right: side === "right" ? "12px" : undefined,
        ...(side === "left" ? { left: "12px" } : {}),
        top: `${topPct}%`,
        transition: "opacity 0.8s ease, transform 0.8s ease",
        opacity: visible ? 0.9 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.92)",
      }}
    >
      <div
        className={`
          relative bg-[#0d1117]/90 backdrop-blur-sm
          border border-[#00D4AA]/15
          rounded-2xl px-4 py-2.5 max-w-[200px] md:max-w-[240px]
          shadow-[0_4px_20px_rgba(0,212,170,0.08)]
        `}
      >
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0 mt-0.5">{thought.icon}</span>
          <p className="text-[11px] text-[#a0b0c0] leading-relaxed font-mono">
            {thought.text}
          </p>
        </div>
        {/* Tail dots */}
        <div
          className={`absolute top-1/2 ${side === "left" ? "-right-2" : "-left-2"}`}
        >
          <div className="w-2 h-2 rounded-full bg-[#0d1117]/80 border border-[#00D4AA]/10" />
        </div>
        <div
          className={`absolute top-1/2 ${side === "left" ? "-right-4" : "-left-4"} mt-1`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#0d1117]/60 border border-[#00D4AA]/5" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════ */

interface BubbleState {
  thoughtIdx: number;
  side: "left" | "right";
  topPct: number;
  visible: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [activeKey, setActiveKey] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [bubble, setBubble] = useState<BubbleState>({
    thoughtIdx: 0,
    side: "left",
    topPct: 30,
    visible: false,
  });
  const bubbleIdxRef = useRef(0);

  // Build translated thoughts from keys
  const allThoughts = useMemo(
    () => thoughtKeys.map((item) => ({ text: t(item.key), icon: item.icon })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const currentSnippet = codeSnippets[snippetIdx];
  const totalChars = useMemo(
    () => currentSnippet.lines.reduce((sum, l) => sum + l.text.length + 1, 0),
    [currentSnippet]
  );

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Bubble cycling: one at a time, random side & position
  useEffect(() => {
    const sides: ("left" | "right")[] = ["left", "right"];
    const topPositions = [18, 28, 38, 48, 58, 68];

    function showNext() {
      const idx = bubbleIdxRef.current % allThoughts.length;
      const side = sides[Math.floor(Math.random() * 2)];
      const topPct = topPositions[Math.floor(Math.random() * topPositions.length)];
      setBubble({ thoughtIdx: idx, side, topPct, visible: true });

      // Hide after 4 seconds
      const hideTimer = setTimeout(() => {
        setBubble((prev) => ({ ...prev, visible: false }));
        bubbleIdxRef.current += 1;
        // Show next after brief pause
        const nextTimer = setTimeout(showNext, 1200);
        return () => clearTimeout(nextTimer);
      }, 4000);

      return () => clearTimeout(hideTimer);
    }

    // Start first bubble after 1.5s
    const startTimer = setTimeout(showNext, 1500);
    return () => clearTimeout(startTimer);
  }, []);

  // Typing engine
  useEffect(() => {
    const speed = 60 + Math.random() * 40; // 60-100ms per char, natural variance
    intervalRef.current = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= totalChars) {
          // Move to next snippet after a pause
          setTimeout(() => {
            setSnippetIdx((s) => (s + 1) % codeSnippets.length);
            setCharIndex(0);
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalChars, snippetIdx]);

  // Map charIndex to the actual character being typed for keyboard highlight
  useEffect(() => {
    const allText = currentSnippet.lines.map((l) => l.text).join("\n");
    const char = allText[charIndex] || "";
    setActiveKey(char === "\n" ? "⏎" : char);

    // Clear key highlight after brief flash
    const t = setTimeout(() => setActiveKey(""), 50);
    return () => clearTimeout(t);
  }, [charIndex, currentSnippet]);

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => router.push("/home"), 1000);
  }, [transitioning, router]);

  return (
    <div className="fixed inset-0 bg-[#080c14] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        {/* Radial glow from monitor */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00D4AA]/[0.03] rounded-full blur-[100px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#00D4AA 1px, transparent 1px), linear-gradient(90deg, #00D4AA 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Single cycling thought bubble */}
      <ThoughtCloud
        thought={allThoughts[bubble.thoughtIdx]}
        side={bubble.side}
        topPct={bubble.topPct}
        visible={bubble.visible}
      />

      {/* Main content - Monitor + Keyboard */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Monitor */}
        <div className="w-[340px] md:w-[520px] lg:w-[600px] mb-3">
          {/* Monitor bezel */}
          <div className="bg-[#1a1a2e] rounded-xl p-1.5 shadow-[0_0_60px_rgba(0,212,170,0.08),0_20px_60px_rgba(0,0,0,0.5)]">
            <MonitorScreen snippet={currentSnippet} charIndex={charIndex} />
          </div>
          {/* Monitor stand */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-4 bg-gradient-to-b from-[#2a2a3a] to-[#1a1a2a] rounded-b" />
            <div className="w-28 h-1.5 bg-[#1a1a2a] rounded-full shadow-md" />
          </div>
        </div>

        {/* Keyboard */}
        <div
          className={`transition-all duration-1000 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Keyboard activeKey={activeKey} />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6 md:pb-10 z-20">
        <div
          className={`transition-all duration-1000 delay-[1.5s] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/images/logo_pyarchinit_official.png"
              alt="pyArchInit"
              width={36}
              height={36}
              className="drop-shadow-[0_0_8px_rgba(0,212,170,0.3)]"
            />
            <h1 className="text-xl md:text-2xl font-mono font-bold text-[#d4d4d4] tracking-tight">
              py<span className="text-[#00D4AA]">ArchInit</span>
            </h1>
          </div>

          <button
            onClick={handleEnter}
            className="group flex flex-col items-center gap-1.5 mx-auto"
          >
            <span className="text-[#546e7a] text-[10px] font-mono tracking-[0.25em] uppercase group-hover:text-[#00D4AA] transition-colors duration-300">
              {t("landing.enter")}
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[#00D4AA]/40 group-hover:text-[#00D4AA] transition-colors animate-gentle-bounce"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Click/scroll to enter */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleEnter}
        onWheel={handleEnter}
        style={{ pointerEvents: transitioning ? "none" : "auto" }}
      />

      {/* Transition overlay */}
      <div
        className={`fixed inset-0 bg-[#080c14] transition-opacity pointer-events-none z-30 ${
          transitioning ? "opacity-100 duration-800" : "opacity-0 duration-500"
        }`}
      />

      {/* Animations */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .animate-gentle-bounce {
          animation: gentle-bounce 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
