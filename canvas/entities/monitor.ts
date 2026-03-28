export interface MonitorConfig {
  x: number;       // center x
  y: number;       // center y
  width: number;
  height: number;
}

// ── Real pyArchInit source code screens ─────────────────────────────────────

interface CodeToken {
  text: string;
  type: "keyword" | "builtin" | "string" | "comment" | "decorator" | "self" | "normal" | "class" | "function" | "operator";
}

interface CodeLine {
  tokens: CodeToken[];
}

interface Screen {
  name: string;
  filename: string;
  lines: CodeLine[];
}

function t(text: string, type: CodeToken["type"]): CodeToken {
  return { text, type };
}

const SCREENS: Screen[] = [
  {
    name: "plugin",
    filename: "pyarchinitPlugin.py",
    lines: [
      { tokens: [t("class ", "keyword"), t("PyArchInitPlugin", "class"), t("(", "normal"), t("object", "builtin"), t("):", "normal")] },
      { tokens: [t("    HOME = ", "normal"), t("os", "builtin"), t(".", "normal"), t("environ", "builtin"), t("[", "normal"), t("'PYARCHINIT_HOME'", "string"), t("]", "normal")] },
      { tokens: [t("    PARAMS_DICT = {", "normal"), t("'SERVER'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'HOST'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'DATABASE'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'PASSWORD'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'PORT'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'USER'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'THUMB_PATH'", "string"), t(": ", "normal"), t("''", "string"), t(",", "normal")] },
      { tokens: [t("                   ", "normal"), t("'THUMB_RESIZE'", "string"), t(": ", "normal"), t("''", "string"), t("}", "normal")] },
      { tokens: [t("    ", "normal"), t("def ", "keyword"), t("__init__", "function"), t("(", "normal"), t("self", "self"), t(", iface):", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".iface = iface", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".plugin_window = ", "normal"), t("None", "keyword")] },
    ],
  },
  {
    name: "imports",
    filename: "US_USM.py",
    lines: [
      { tokens: [t("from ", "keyword"), t("..modules.db.pyarchinit_conn_strings ", "normal"), t("import ", "keyword"), t("Connection", "class")] },
      { tokens: [t("from ", "keyword"), t("..modules.db.pyarchinit_db_manager ", "normal"), t("import ", "keyword"), t("Pyarchinit_db_management", "class")] },
      { tokens: [t("from ", "keyword"), t("..modules.db.pyarchinit_utility ", "normal"), t("import ", "keyword"), t("Utility", "class")] },
      { tokens: [t("from ", "keyword"), t("..modules.gis.pyarchinit_pyqgis ", "normal"), t("import ", "keyword"), t("Pyarchinit_pyqgis", "class")] },
      { tokens: [t("from ", "keyword"), t("..modules.utility.pyarchinit_error_check ", "normal"), t("import ", "keyword"), t("Error_check", "class")] },
      { tokens: [t("from ", "keyword"), t("..modules.utility.pyarchinit_exp_USsheet_pdf ", "normal"), t("import ", "keyword"), t("generate_US_pdf", "function")] },
    ],
  },
  {
    name: "site",
    filename: "Site.py",
    lines: [
      { tokens: [t("class ", "keyword"), t("pyarchinit_Site", "class"), t("(", "normal"), t("QDialog", "class"), t(", ", "normal"), t("MAIN_DIALOG_CLASS", "class"), t("):", "normal")] },
      { tokens: [t("    ", "normal"), t('"""This class provides to manage the Site Sheet"""', "comment")] },
      { tokens: [t("    L = ", "normal"), t("QgsSettings", "class"), t("().", "normal"), t("value", "function"), t("(", "normal"), t('"locale/userLocale"', "string"), t(")[0:2]", "normal")] },
      { tokens: [] },
      { tokens: [t("    ", "normal"), t("def ", "keyword"), t("__init__", "function"), t("(", "normal"), t("self", "self"), t(", iface):", "normal")] },
      { tokens: [t("        ", "normal"), t("super", "builtin"), t("().", "normal"), t("__init__", "function"), t("()", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".iface = iface", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".pyQGIS = ", "normal"), t("Pyarchinit_pyqgis", "class"), t("(iface)", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".", "normal"), t("setupUi", "function"), t("(", "normal"), t("self", "self"), t(")", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".currentLayerId = ", "normal"), t("None", "keyword")] },
    ],
  },
  {
    name: "db",
    filename: "pyarchinit_db_manager.py",
    lines: [
      { tokens: [t("class ", "keyword"), t("Pyarchinit_db_management", "class"), t("(", "normal"), t("object", "builtin"), t("):", "normal")] },
      { tokens: [t("    metadata = ", "normal"), t("MetaData", "class"), t("()", "normal")] },
      { tokens: [t("    engine = ", "normal"), t("None", "keyword")] },
      { tokens: [] },
      { tokens: [t("    ", "normal"), t("def ", "keyword"), t("connection", "function"), t("(", "normal"), t("self", "self"), t("):", "normal")] },
      { tokens: [t("        cfg = ", "normal"), t("Connection", "class"), t("()", "normal")] },
      { tokens: [t("        conn_str = cfg.", "normal"), t("conn_str", "function"), t("()", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".engine = ", "normal"), t("create_engine", "function"), t("(conn_str)", "normal")] },
      { tokens: [t("        ", "normal"), t("self", "self"), t(".metadata.", "normal"), t("create_all", "function"), t("(", "normal"), t("self", "self"), t(".engine)", "normal")] },
    ],
  },
];

const SCREEN_DURATION = 10000; // ms per screen

export class Monitor {
  private config: MonitorConfig;
  private currentScreen: number = 0;
  private charIndex: number = 0;
  private lastCharTime: number = 0;
  private charDelay: number = 35;
  private cursorVisible: boolean = true;
  private lastCursorBlink: number = 0;
  private screenStartTime: number = 0;
  private totalChars: number = 0;
  // Glow color shifts based on current screen content
  private glowHue: number = 174;
  private targetGlowHue: number = 174;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.totalChars = this.countScreenChars(0);
  }

  private countScreenChars(screenIdx: number): number {
    return SCREENS[screenIdx].lines.reduce(
      (sum, line) => sum + line.tokens.reduce((s, tok) => s + tok.text.length, 0),
      0
    );
  }

  update(time: number): void {
    // Cursor blink
    if (time - this.lastCursorBlink > 530) {
      this.cursorVisible = !this.cursorVisible;
      this.lastCursorBlink = time;
    }

    // Type characters
    if (this.charIndex < this.totalChars && time - this.lastCharTime > this.charDelay) {
      this.charIndex += 1;
      this.lastCharTime = time;
    }

    // Cycle screen after SCREEN_DURATION
    if (this.screenStartTime === 0) this.screenStartTime = time;
    if (time - this.screenStartTime > SCREEN_DURATION) {
      this.currentScreen = (this.currentScreen + 1) % SCREENS.length;
      this.charIndex = 0;
      this.totalChars = this.countScreenChars(this.currentScreen);
      this.screenStartTime = time;

      // Shift glow color per screen
      const hues = [174, 200, 30, 280];
      this.targetGlowHue = hues[this.currentScreen % hues.length];
    }

    // Smooth glow hue transition
    this.glowHue += (this.targetGlowHue - this.glowHue) * 0.02;
  }

  getConfig(): MonitorConfig {
    return this.config;
  }

  setConfig(config: MonitorConfig): void {
    this.config = config;
  }

  getGlowColor(): { r: number; g: number; b: number } {
    // HSL to RGB approximation for glow
    const h = this.glowHue / 360;
    const s = 0.7;
    const l = 0.6;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    const hi = Math.floor(h * 6) % 6;
    if (hi === 0) { r = c; g = x; b = 0; }
    else if (hi === 1) { r = x; g = c; b = 0; }
    else if (hi === 2) { r = 0; g = c; b = x; }
    else if (hi === 3) { r = 0; g = x; b = c; }
    else if (hi === 4) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  private getColorForToken(type: CodeToken["type"]): string {
    switch (type) {
      case "keyword":   return "#c586c0"; // purple - Python keywords
      case "builtin":   return "#4ec9b0"; // teal - builtins
      case "string":    return "#ce9178"; // warm orange - strings
      case "comment":   return "#6a9955"; // green - comments
      case "decorator": return "#dcdcaa"; // yellow
      case "self":      return "#9cdcfe"; // light blue
      case "class":     return "#4ec9b0"; // teal - class names
      case "function":  return "#dcdcaa"; // yellow - function names
      case "operator":  return "#d4d4d4"; // white
      default:          return "#d4d4d4"; // light grey - normal
    }
  }

  draw(ctx: CanvasRenderingContext2D, detailLevel: number = 0): void {
    const { x, y, width, height } = this.config;
    const left = x - width / 2;
    const top = y - height / 2;

    // ── Monitor stand ──────────────────────────────────────────────────────
    const standW = width * 0.08;
    const standH = height * 0.14;
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.moveTo(x - standW / 2, top + height);
    ctx.lineTo(x + standW / 2, top + height);
    ctx.lineTo(x + standW * 0.9, top + height + standH);
    ctx.lineTo(x - standW * 0.9, top + height + standH);
    ctx.closePath();
    ctx.fill();

    // Stand base
    ctx.fillStyle = "#252540";
    ctx.beginPath();
    ctx.roundRect(x - standW * 1.5, top + height + standH - 4, standW * 3, 6, 3);
    ctx.fill();

    // ── Monitor bezel ──────────────────────────────────────────────────────
    ctx.fillStyle = "#111122";
    ctx.beginPath();
    ctx.roundRect(left - 8, top - 8, width + 16, height + 16, 10);
    ctx.fill();

    // Bezel edge highlight
    ctx.save();
    ctx.strokeStyle = "rgba(60, 60, 90, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left - 8, top - 8, width + 16, height + 16, 10);
    ctx.stroke();
    ctx.restore();

    // ── Screen background ──────────────────────────────────────────────────
    ctx.fillStyle = "#1e1e1e"; // VS Code dark theme background
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4);
    ctx.fill();

    // Title bar
    const titleBarH = Math.max(12, height * 0.07);
    ctx.fillStyle = "#323233";
    ctx.beginPath();
    ctx.roundRect(left, top, width, titleBarH, [4, 4, 0, 0]);
    ctx.fill();

    // Title bar dots (traffic lights)
    const dotR = Math.max(2, titleBarH * 0.15);
    const dotY = top + titleBarH / 2;
    const dotStartX = left + 10;
    const dotColors = ["#ff5f57", "#febc2e", "#28c840"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = dotColors[i];
      ctx.beginPath();
      ctx.arc(dotStartX + i * (dotR * 3), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Filename in title bar
    const screen = SCREENS[this.currentScreen];
    const titleFontSize = Math.max(6, Math.round(titleBarH * 0.6));
    ctx.fillStyle = "#999";
    ctx.font = `${titleFontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(screen.filename, x, dotY + titleFontSize * 0.35);
    ctx.textAlign = "left";

    // Line number gutter
    const gutterW = Math.max(20, width * 0.08);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(left, top + titleBarH, gutterW, height - titleBarH);

    // ── Screen glow (ambient light from monitor) ───────────────────────────
    const gc = this.getGlowColor();
    const glow = ctx.createRadialGradient(x, y, 0, x, y, width * 0.8);
    glow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.07)`);
    glow.addColorStop(1, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(left - width * 0.3, top - height * 0.3, width * 1.6, height * 1.6);

    // ── Clip to screen area for code ───────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top + titleBarH, width, height - titleBarH);
    ctx.clip();

    // Draw code lines with syntax highlighting
    const baseFontSize = detailLevel === 0
      ? Math.max(6, Math.round(height * 0.045))
      : Math.max(10, Math.round(height * 0.065));

    ctx.font = `${baseFontSize}px "JetBrains Mono", "Courier New", monospace`;
    const lineHeight = baseFontSize * 1.55;
    const paddingX = gutterW + 6;
    const paddingY = titleBarH + 8;

    let charsDrawn = 0;
    let cursorDrawn = false;

    for (let i = 0; i < screen.lines.length; i++) {
      const line = screen.lines[i];
      const lineY = top + paddingY + i * lineHeight + baseFontSize;

      if (lineY > top + height - 4) break;

      // Line number
      ctx.fillStyle = "#555";
      const lineNumFontSize = Math.max(5, baseFontSize * 0.85);
      ctx.font = `${lineNumFontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${i + 1}`, left + gutterW - 4, lineY);
      ctx.textAlign = "left";
      ctx.font = `${baseFontSize}px "JetBrains Mono", "Courier New", monospace`;

      // Draw tokens
      let xOffset = left + paddingX;
      for (const token of line.tokens) {
        const tokenLen = token.text.length;
        const charsToShow = Math.max(0, Math.min(tokenLen, this.charIndex - charsDrawn));
        const visible = token.text.substring(0, charsToShow);

        if (visible.length > 0) {
          ctx.fillStyle = this.getColorForToken(token.type);
          ctx.fillText(visible, xOffset, lineY);
        }

        // Cursor at current typing position
        if (!cursorDrawn && charsDrawn + tokenLen >= this.charIndex && this.cursorVisible) {
          const cursorX = xOffset + ctx.measureText(visible).width;
          ctx.fillStyle = "#aeafad";
          ctx.fillRect(cursorX, lineY - baseFontSize + 2, Math.max(1, baseFontSize * 0.1), baseFontSize);
          cursorDrawn = true;
        }

        xOffset += ctx.measureText(token.text).width;
        charsDrawn += tokenLen;
      }
    }

    ctx.restore();

    // ── Monitor thin glow border ──────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.25)`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.3)`;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4);
    ctx.stroke();
    ctx.restore();
  }
}
