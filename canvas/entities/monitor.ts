export interface MonitorConfig {
  x: number;       // center x
  y: number;       // center y
  width: number;
  height: number;
}

const SCREENS = [
  {
    name: "python",
    lines: [
      { text: "class UnitaStratigrafica:", color: "keyword" },
      { text: '    """Stratigraphic Unit model"""', color: "comment" },
      { text: "    def __init__(self):", color: "keyword" },
      { text: "        self.id = None", color: "self" },
      { text: "        self.numero_us = 0", color: "self" },
      { text: "        self.tipo = ''", color: "self" },
      { text: "        self.descrizione = ''", color: "self" },
      { text: "        self.interpretazione = ''", color: "self" },
      { text: "    def save(self):", color: "keyword" },
      { text: "        db.session.add(self)", color: "normal" },
      { text: "        db.session.commit()", color: "normal" },
    ],
  },
  {
    name: "ui",
    lines: [
      { text: "╔══════════════════════════╗", color: "border" },
      { text: "║  SCHEDA US  #0042        ║", color: "header" },
      { text: "╠══════════════════════════╣", color: "border" },
      { text: "║ Tipo:  Strato            ║", color: "normal" },
      { text: "║ Quota: -1.45 m s.l.m.   ║", color: "normal" },
      { text: "║ Mat.:  Terra grigia      ║", color: "normal" },
      { text: "║ Inc.:  US 0040, US 0041  ║", color: "teal" },
      { text: "║ Cop.:  US 0043           ║", color: "teal" },
      { text: "║ Period: Romano           ║", color: "sand" },
      { text: "╚══════════════════════════╝", color: "border" },
    ],
  },
  {
    name: "gis",
    lines: [
      { text: "import geopandas as gpd", color: "keyword" },
      { text: "import pyarchinit as pa", color: "keyword" },
      { text: "", color: "normal" },
      { text: "# Load excavation data", color: "comment" },
      { text: "scavo = pa.load_site('RMF_2024')", color: "normal" },
      { text: "gdf = scavo.to_geodataframe()", color: "normal" },
      { text: "", color: "normal" },
      { text: "# Spatial analysis", color: "comment" },
      { text: "gdf.plot(column='periodo',", color: "normal" },
      { text: "    cmap='viridis',", color: "self" },
      { text: "    figsize=(12, 8))", color: "self" },
    ],
  },
];

const SCREEN_DURATION = 8000; // ms per screen

export class Monitor {
  private config: MonitorConfig;
  private currentScreen: number = 0;
  private charIndex: number = 0;
  private lastCharTime: number = 0;
  private charDelay: number = 40;
  private cursorVisible: boolean = true;
  private lastCursorBlink: number = 0;
  private screenStartTime: number = 0;
  private totalChars: number = 0;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.totalChars = this.countScreenChars(0);
  }

  private countScreenChars(screenIdx: number): number {
    return SCREENS[screenIdx].lines.reduce((sum, l) => sum + l.text.length, 0);
  }

  update(time: number): void {
    // Cursor blink
    if (time - this.lastCursorBlink > 500) {
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
    }
  }

  getConfig(): MonitorConfig {
    return this.config;
  }

  setConfig(config: MonitorConfig): void {
    this.config = config;
  }

  private getColorForToken(color: string): string {
    switch (color) {
      case "keyword": return "#2dd4bf"; // teal
      case "comment": return "#6b7280"; // muted
      case "self":    return "#e07b54"; // terracotta
      case "teal":    return "#2dd4bf";
      case "sand":    return "#c8b89a";
      case "border":  return "#4b5563";
      case "header":  return "#2dd4bf";
      default:        return "#c8b89a"; // sand
    }
  }

  draw(ctx: CanvasRenderingContext2D, detailLevel: number = 0): void {
    const { x, y, width, height } = this.config;
    const left = x - width / 2;
    const top = y - height / 2;

    // Monitor stand
    const standW = width * 0.12;
    const standH = height * 0.12;
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.moveTo(x - standW / 2, top + height);
    ctx.lineTo(x + standW / 2, top + height);
    ctx.lineTo(x + standW * 0.8, top + height + standH);
    ctx.lineTo(x - standW * 0.8, top + height + standH);
    ctx.closePath();
    ctx.fill();

    // Stand base
    ctx.fillStyle = "#252540";
    ctx.beginPath();
    ctx.roundRect(x - standW * 1.2, top + height + standH - 4, standW * 2.4, 8, 3);
    ctx.fill();

    // Monitor bezel
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.roundRect(left - 6, top - 6, width + 12, height + 12, 8);
    ctx.fill();

    // Screen background
    ctx.fillStyle = "#0d1117";
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4);
    ctx.fill();

    // Screen glow (blue-ish ambient)
    const glow = ctx.createRadialGradient(x, y, 0, x, y, width * 0.7);
    glow.addColorStop(0, "rgba(45, 212, 191, 0.06)");
    glow.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(left, top, width, height);

    // Clip to screen area for code
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(left + 2, top + 2, width - 4, height - 4, 3);
    ctx.clip();

    // Draw code lines
    const fontSize = Math.round(8 + detailLevel * 6);
    ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
    const lineHeight = fontSize * 1.5;
    const paddingX = 10;
    const paddingY = 12;

    const screen = SCREENS[this.currentScreen];
    let charsDrawn = 0;
    let cursorDrawn = false;

    for (let i = 0; i < screen.lines.length; i++) {
      const line = screen.lines[i];
      const lineY = top + paddingY + i * lineHeight + fontSize;

      if (lineY > top + height - 4) break;

      const charsInLine = line.text.length;
      const charsToShow = Math.max(0, Math.min(charsInLine, this.charIndex - charsDrawn));
      const visible = line.text.substring(0, charsToShow);

      ctx.fillStyle = this.getColorForToken(line.color);
      ctx.fillText(visible, left + paddingX, lineY);

      // Draw cursor at current typing position
      if (!cursorDrawn && charsDrawn + charsInLine >= this.charIndex && this.cursorVisible) {
        const cursorX = left + paddingX + ctx.measureText(visible).width;
        ctx.fillStyle = "#2dd4bf";
        ctx.fillRect(cursorX, lineY - fontSize + 2, 2, fontSize);
        cursorDrawn = true;
      }

      charsDrawn += charsInLine;
    }

    ctx.restore();

    // Monitor thin glow border
    ctx.save();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 4);
    ctx.stroke();
    ctx.restore();
  }
}
