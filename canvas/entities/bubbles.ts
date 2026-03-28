import { smoothNoise2D } from "../noise";

type BubbleContent = "text" | "diagram" | "flowchart" | "harris" | "architecture";

interface Bubble {
  x: number;
  y: number;
  baseX: number;
  width: number;
  height: number;
  opacity: number;
  state: "in" | "visible" | "out";
  stateStart: number;
  content: BubbleContent;
  contentIndex: number;
  noiseOffset: number;
  wobblePhase: number;
}

const FADE_IN_DURATION = 800;
const VISIBLE_DURATION = 4500;
const FADE_OUT_DURATION = 800;

// Text thoughts - mix of Italian and technical
const THOUGHT_TEXTS = [
  "Struttura DB per le US...",
  "Matrice di Harris \u2192 grafo diretto",
  "Plugin QGIS: tabs \u2192 modules \u2192 db",
  "Export PDF schede US",
  "Periodizzazione stratigrafica...",
  "Query spaziale sui reperti...",
];

export class BubbleSystem {
  private bubbles: Bubble[] = [];
  private lastSpawn: number = 0;
  private spawnInterval: number = 5000 + Math.random() * 1500;
  private originX: number;
  private originY: number;
  private contentCycle: number = 0;

  constructor(originX: number, originY: number) {
    this.originX = originX;
    this.originY = originY;
  }

  setOrigin(x: number, y: number): void {
    this.originX = x;
    this.originY = y;
  }

  private spawnBubble(time: number): void {
    const contentTypes: BubbleContent[] = ["text", "diagram", "flowchart", "harris", "architecture"];
    const content = contentTypes[this.contentCycle % contentTypes.length];
    this.contentCycle++;

    let w: number, h: number;
    switch (content) {
      case "text":
        w = 240; h = 70;
        break;
      case "diagram":
        w = 200; h = 120;
        break;
      case "flowchart":
        w = 280; h = 80;
        break;
      case "harris":
        w = 200; h = 140;
        break;
      case "architecture":
        w = 240; h = 110;
        break;
    }

    const contentIndex = content === "text"
      ? Math.floor(Math.random() * THOUGHT_TEXTS.length)
      : 0;

    // Spawn to the left or right of head alternately
    const side = this.contentCycle % 2 === 0 ? -1 : 1;

    this.bubbles.push({
      x: this.originX + side * (80 + Math.random() * 40),
      y: this.originY - 40,
      baseX: this.originX + side * (80 + Math.random() * 40),
      width: w,
      height: h,
      opacity: 0,
      state: "in",
      stateStart: time,
      content,
      contentIndex,
      noiseOffset: Math.random() * 1000,
      wobblePhase: Math.random() * Math.PI * 2,
    });
  }

  update(time: number): void {
    // Spawn logic
    if (time - this.lastSpawn > this.spawnInterval) {
      this.spawnBubble(time);
      this.lastSpawn = time;
      this.spawnInterval = 5000 + Math.random() * 1500;
    }

    // Update each bubble
    this.bubbles = this.bubbles.filter((b) => {
      const elapsed = time - b.stateStart;

      if (b.state === "in") {
        // Ease out (decelerate) for smooth entry
        const t = Math.min(1, elapsed / FADE_IN_DURATION);
        b.opacity = 1 - (1 - t) * (1 - t);
        if (elapsed >= FADE_IN_DURATION) {
          b.state = "visible";
          b.stateStart = time;
        }
      } else if (b.state === "visible") {
        b.opacity = 1;
        if (elapsed >= VISIBLE_DURATION) {
          b.state = "out";
          b.stateStart = time;
        }
      } else if (b.state === "out") {
        const t = Math.min(1, elapsed / FADE_OUT_DURATION);
        b.opacity = (1 - t) * (1 - t); // Ease in (accelerate) for exit
        if (elapsed >= FADE_OUT_DURATION) {
          return false;
        }
      }

      // Float upward gently
      b.y -= 0.3;

      // Noise-based horizontal wobble
      const noiseVal = smoothNoise2D(b.noiseOffset + time * 0.0003, 0);
      b.x = b.baseX + (noiseVal - 0.5) * 30;

      // Slight wobble rotation (used in draw)
      b.wobblePhase = Math.sin(time * 0.002 + b.noiseOffset) * 0.02;

      return true;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.opacity;

      // Apply subtle wobble rotation
      ctx.translate(b.x, b.y - b.height / 2);
      ctx.rotate(b.wobblePhase);
      ctx.translate(-b.x, -(b.y - b.height / 2));

      const cx = b.x;
      const cy = b.y - b.height / 2;

      // ── Trailing thought circles (from head to cloud) ────────────────────
      const trailCount = 3;
      const headX = this.originX;
      const headY = this.originY;
      for (let i = 0; i < trailCount; i++) {
        const t = (i + 1) / (trailCount + 1);
        const tx = headX + (cx - headX) * t * 0.6;
        const ty = headY + (cy + b.height / 2 - headY) * t * 0.7;
        const radius = 3 + i * 3;

        ctx.fillStyle = "rgba(10, 16, 32, 0.85)";
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(45, 212, 191, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Cloud shape (overlapping circles) ─────────────────────────────────
      this.drawCloudShape(ctx, cx, cy, b.width, b.height);

      // ── Content ───────────────────────────────────────────────────────────
      this.drawContent(ctx, b, cx, cy);

      ctx.restore();
    }
  }

  private drawCloudShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    // Generate cloud outline from overlapping circles
    const hw = w / 2;
    const hh = h / 2;

    // Cloud bumps along the perimeter
    const bumps: { x: number; y: number; r: number }[] = [];

    // Top bumps
    const topBumpCount = Math.ceil(w / 35);
    for (let i = 0; i < topBumpCount; i++) {
      const t = (i + 0.5) / topBumpCount;
      bumps.push({
        x: cx - hw + t * w,
        y: cy - hh + 8,
        r: 18 + Math.sin(i * 2.3) * 6,
      });
    }

    // Right bumps
    const rightBumpCount = Math.ceil(h / 40);
    for (let i = 0; i < rightBumpCount; i++) {
      const t = (i + 0.5) / rightBumpCount;
      bumps.push({
        x: cx + hw - 8,
        y: cy - hh + t * h,
        r: 16 + Math.sin(i * 3.1) * 5,
      });
    }

    // Bottom bumps
    for (let i = topBumpCount - 1; i >= 0; i--) {
      const t = (i + 0.5) / topBumpCount;
      bumps.push({
        x: cx - hw + t * w,
        y: cy + hh - 8,
        r: 16 + Math.sin(i * 1.7) * 5,
      });
    }

    // Left bumps
    for (let i = rightBumpCount - 1; i >= 0; i--) {
      const t = (i + 0.5) / rightBumpCount;
      bumps.push({
        x: cx - hw + 8,
        y: cy - hh + t * h,
        r: 16 + Math.sin(i * 2.7) * 5,
      });
    }

    // Draw filled cloud with overlapping circles
    ctx.fillStyle = "rgba(10, 16, 32, 0.92)";
    for (const bump of bumps) {
      ctx.beginPath();
      ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fill center
    ctx.fillRect(cx - hw + 10, cy - hh + 10, w - 20, h - 20);

    // Draw cloud border (same circles but stroked)
    ctx.strokeStyle = "rgba(45, 212, 191, 0.45)";
    ctx.lineWidth = 1.5;

    // We draw a combined path for the cloud outline
    // Simplified: just stroke the outer arcs
    for (const bump of bumps) {
      ctx.beginPath();
      ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cover internal stroke lines with fill
    ctx.fillStyle = "rgba(10, 16, 32, 0.92)";
    ctx.fillRect(cx - hw + 12, cy - hh + 12, w - 24, h - 24);

    // Inner subtle gradient for depth
    const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(hw, hh));
    innerGlow.addColorStop(0, "rgba(45, 212, 191, 0.04)");
    innerGlow.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = innerGlow;
    ctx.fillRect(cx - hw + 10, cy - hh + 10, w - 20, h - 20);
  }

  private drawContent(
    ctx: CanvasRenderingContext2D,
    b: Bubble,
    cx: number,
    cy: number
  ): void {
    switch (b.content) {
      case "text":
        this.drawTextThought(ctx, cx, cy, b.contentIndex);
        break;
      case "harris":
        this.drawHarrisMatrix(ctx, cx, cy, b.width, b.height);
        break;
      case "diagram":
        this.drawArchitectureDiagram(ctx, cx, cy, b.width, b.height);
        break;
      case "flowchart":
        this.drawFlowchart(ctx, cx, cy, b.width);
        break;
      case "architecture":
        this.drawPluginArchitecture(ctx, cx, cy, b.width, b.height);
        break;
    }
  }

  private drawTextThought(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    index: number
  ): void {
    const text = THOUGHT_TEXTS[index % THOUGHT_TEXTS.length];

    // Handwriting-style: slightly wobbly text
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Use a slightly larger font for readability
    const fontSize = 13;
    ctx.font = `italic ${fontSize}px "Georgia", "Times New Roman", serif`;
    ctx.fillStyle = "#c8b89a";

    // Draw each character with slight position variation for handwriting effect
    const totalWidth = ctx.measureText(text).width;
    let xPos = cx - totalWidth / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      const wobbleY = Math.sin(i * 0.8) * 1.2;
      const wobbleRot = Math.sin(i * 1.1) * 0.02;

      ctx.save();
      ctx.translate(xPos + charWidth / 2, cy + wobbleY);
      ctx.rotate(wobbleRot);
      ctx.fillText(char, 0, 0);
      ctx.restore();

      xPos += charWidth;
    }

    ctx.restore();
  }

  private drawHarrisMatrix(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    // Title
    ctx.fillStyle = "rgba(45, 212, 191, 0.7)";
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("Matrice di Harris", cx, cy - h * 0.35);

    const nodes = [
      { x: cx, y: cy - h * 0.18, label: "US 42" },
      { x: cx - w * 0.22, y: cy + h * 0.02, label: "US 40" },
      { x: cx + w * 0.22, y: cy + h * 0.02, label: "US 41" },
      { x: cx, y: cy + h * 0.22, label: "US 38" },
    ];
    const edges: [number, number][] = [
      [0, 1], [0, 2], [1, 3], [2, 3],
    ];

    // Edges with arrows
    ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
    ctx.lineWidth = 1;
    for (const [a, bi] of edges) {
      const from = nodes[a];
      const to = nodes[bi];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y + 8);
      ctx.lineTo(to.x, to.y - 8);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(to.y - 8 - (from.y + 8), to.x - from.x);
      const arrowLen = 5;
      ctx.beginPath();
      ctx.moveTo(to.x, to.y - 8);
      ctx.lineTo(
        to.x - Math.cos(angle - 0.4) * arrowLen,
        to.y - 8 - Math.sin(angle - 0.4) * arrowLen
      );
      ctx.moveTo(to.x, to.y - 8);
      ctx.lineTo(
        to.x - Math.cos(angle + 0.4) * arrowLen,
        to.y - 8 - Math.sin(angle + 0.4) * arrowLen
      );
      ctx.stroke();
    }

    // Nodes
    for (const node of nodes) {
      ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(node.x - 22, node.y - 9, 44, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2dd4bf";
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x, node.y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  private drawArchitectureDiagram(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    // Small boxes connected with arrows
    const boxes = [
      { x: cx - w * 0.3, y: cy - h * 0.25, label: "Scavo", color: "#e07b54" },
      { x: cx, y: cy - h * 0.25, label: "Dati", color: "#2dd4bf" },
      { x: cx + w * 0.3, y: cy - h * 0.25, label: "Analisi", color: "#c586c0" },
      { x: cx, y: cy + h * 0.15, label: "Report", color: "#c8b89a" },
    ];

    // Draw connections
    ctx.strokeStyle = "rgba(200, 184, 154, 0.4)";
    ctx.lineWidth = 1;

    // Horizontal connections
    for (let i = 0; i < boxes.length - 2; i++) {
      ctx.beginPath();
      ctx.moveTo(boxes[i].x + 24, boxes[i].y);
      ctx.lineTo(boxes[i + 1].x - 24, boxes[i + 1].y);
      ctx.stroke();

      // Arrow
      ctx.beginPath();
      ctx.moveTo(boxes[i + 1].x - 24, boxes[i + 1].y);
      ctx.lineTo(boxes[i + 1].x - 30, boxes[i + 1].y - 3);
      ctx.moveTo(boxes[i + 1].x - 24, boxes[i + 1].y);
      ctx.lineTo(boxes[i + 1].x - 30, boxes[i + 1].y + 3);
      ctx.stroke();
    }

    // Connection from Analisi down to Report
    ctx.beginPath();
    ctx.moveTo(boxes[2].x, boxes[2].y + 10);
    ctx.lineTo(boxes[3].x + 24, boxes[3].y);
    ctx.stroke();

    // Connection from Dati down to Report
    ctx.beginPath();
    ctx.moveTo(boxes[1].x, boxes[1].y + 10);
    ctx.lineTo(boxes[3].x, boxes[3].y - 10);
    ctx.stroke();

    // Draw boxes
    for (const box of boxes) {
      ctx.fillStyle = "rgba(10, 16, 32, 0.8)";
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(box.x - 24, box.y - 10, 48, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = box.color;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(box.label, box.x, box.y);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  private drawFlowchart(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number
  ): void {
    // Flowchart: Scavo -> Dati -> Analisi -> Report
    const steps = ["Scavo", "\u2192", "Dati", "\u2192", "Analisi", "\u2192", "Report"];
    const colors = ["#e07b54", "#555", "#2dd4bf", "#555", "#c586c0", "#555", "#c8b89a"];

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const totalWidth = steps.reduce((sum, s) => sum + ctx.measureText(s).width + 8, 0);
    let xPos = cx - totalWidth / 2;

    for (let i = 0; i < steps.length; i++) {
      const stepW = ctx.measureText(steps[i]).width;

      if (i % 2 === 0) {
        // Box around text
        ctx.fillStyle = "rgba(10, 16, 32, 0.6)";
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(xPos - 2, cy - 10, stepW + 8, 20, 3);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = colors[i];
      ctx.fillText(steps[i], xPos + stepW / 2 + 2, cy);
      xPos += stepW + 10;
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  private drawPluginArchitecture(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    // Plugin QGIS architecture: tabs -> modules -> db
    const layers = [
      { label: "QGIS Plugin", y: cy - h * 0.28, color: "#4ec9b0", w: w * 0.7 },
      { label: "Tabs / UI", y: cy - h * 0.05, color: "#dcdcaa", w: w * 0.55 },
      { label: "Modules", y: cy + h * 0.15, color: "#c586c0", w: w * 0.4 },
      { label: "Database", y: cy + h * 0.32, color: "#e07b54", w: w * 0.3 },
    ];

    for (const layer of layers) {
      // Box
      ctx.fillStyle = "rgba(10, 16, 32, 0.6)";
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - layer.w / 2, layer.y - 8, layer.w, 16, 3);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = layer.color;
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.label, cx, layer.y);
    }

    // Connecting lines
    ctx.strokeStyle = "rgba(200, 184, 154, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < layers.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, layers[i].y + 8);
      ctx.lineTo(cx, layers[i + 1].y - 8);
      ctx.stroke();

      // Arrow
      ctx.beginPath();
      ctx.moveTo(cx, layers[i + 1].y - 8);
      ctx.lineTo(cx - 3, layers[i + 1].y - 13);
      ctx.moveTo(cx, layers[i + 1].y - 8);
      ctx.lineTo(cx + 3, layers[i + 1].y - 13);
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}
