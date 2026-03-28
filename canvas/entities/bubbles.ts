import { noise2D } from "../noise";

type BubbleContent = "code" | "harris" | "artifact" | "chart";

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
  noiseOffset: number;
}

const FADE_IN_DURATION = 500;
const VISIBLE_DURATION = 3000;
const FADE_OUT_DURATION = 500;

const CODE_SNIPPETS = [
  ["us.periodo = 'Romano'", "us.quota_top = -1.45", "us.save()"],
  ["cursor.execute(", "  'SELECT * FROM us'", "  ' WHERE sito=%s'", ")"],
  ["for us in queryset:", "  print(us.numero)", "  harris.add(us)"],
];

export class BubbleSystem {
  private bubbles: Bubble[] = [];
  private lastSpawn: number = 0;
  private spawnInterval: number = 4000 + Math.random() * 1000;
  private originX: number;
  private originY: number;

  constructor(originX: number, originY: number) {
    this.originX = originX;
    this.originY = originY;
  }

  setOrigin(x: number, y: number): void {
    this.originX = x;
    this.originY = y;
  }

  private spawnBubble(time: number): void {
    const contentTypes: BubbleContent[] = ["code", "harris", "artifact", "chart"];
    const content = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const w = content === "code" ? 180 : 140;
    const h = content === "code" ? 80 : 100;

    this.bubbles.push({
      x: this.originX + (Math.random() - 0.5) * 30,
      y: this.originY - 20,
      baseX: this.originX,
      width: w,
      height: h,
      opacity: 0,
      state: "in",
      stateStart: time,
      content,
      noiseOffset: Math.random() * 1000,
    });
  }

  update(time: number): void {
    // Spawn logic
    if (time - this.lastSpawn > this.spawnInterval) {
      this.spawnBubble(time);
      this.lastSpawn = time;
      this.spawnInterval = 4000 + Math.random() * 1000;
    }

    // Update each bubble
    this.bubbles = this.bubbles.filter((b) => {
      const elapsed = time - b.stateStart;

      if (b.state === "in") {
        b.opacity = Math.min(1, elapsed / FADE_IN_DURATION);
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
        b.opacity = Math.max(0, 1 - elapsed / FADE_OUT_DURATION);
        if (elapsed >= FADE_OUT_DURATION) {
          return false; // remove
        }
      }

      // Float upward
      b.y -= 0.4;

      // Noise-based horizontal wobble
      const noiseVal = noise2D(b.noiseOffset + time * 0.0004, 0);
      b.x = b.baseX + (noiseVal - 0.5) * 40;

      return true;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.opacity;

      const left = b.x - b.width / 2;
      const top = b.y - b.height;

      // Background
      ctx.fillStyle = "rgba(10, 16, 32, 0.88)";
      ctx.beginPath();
      ctx.roundRect(left, top, b.width, b.height, 10);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(45, 212, 191, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(left, top, b.width, b.height, 10);
      ctx.stroke();

      // Tail (small triangle pointing down toward head)
      ctx.fillStyle = "rgba(10, 16, 32, 0.88)";
      ctx.beginPath();
      ctx.moveTo(b.x - 8, top + b.height);
      ctx.lineTo(b.x + 8, top + b.height);
      ctx.lineTo(b.x, top + b.height + 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(45, 212, 191, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - 8, top + b.height - 1);
      ctx.lineTo(b.x, top + b.height + 12);
      ctx.lineTo(b.x + 8, top + b.height - 1);
      ctx.stroke();

      // Draw content
      this.drawContent(ctx, b, left, top);

      ctx.restore();
    }
  }

  private drawContent(
    ctx: CanvasRenderingContext2D,
    b: Bubble,
    left: number,
    top: number
  ): void {
    const cx = left + b.width / 2;
    const cy = top + b.height / 2;

    switch (b.content) {
      case "code":
        this.drawCode(ctx, left + 10, top + 12);
        break;
      case "harris":
        this.drawHarris(ctx, cx, cy, b.width, b.height);
        break;
      case "artifact":
        this.drawArtifact(ctx, cx, cy, b.height * 0.7);
        break;
      case "chart":
        this.drawChart(ctx, left + 10, top + 10, b.width - 20, b.height - 20);
        break;
    }
  }

  private drawCode(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const snippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    ctx.font = '9px "JetBrains Mono", monospace';
    for (let i = 0; i < snippet.length; i++) {
      const colors = ["#2dd4bf", "#e07b54", "#c8b89a"];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(snippet[i], x, y + i * 13);
    }
  }

  private drawHarris(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    const nodes = [
      { x: cx, y: cy - h * 0.3, label: "US 42" },
      { x: cx - w * 0.25, y: cy, label: "US 40" },
      { x: cx + w * 0.25, y: cy, label: "US 41" },
      { x: cx, y: cy + h * 0.28, label: "US 38" },
    ];
    const edges = [
      [0, 1], [0, 2], [1, 3], [2, 3],
    ];

    // Edges
    ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    }

    // Nodes
    for (const node of nodes) {
      ctx.fillStyle = "rgba(45, 212, 191, 0.15)";
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(node.x - 18, node.y - 8, 36, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2dd4bf";
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x, node.y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  private drawArtifact(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number
  ): void {
    // Simple amphora outline
    ctx.strokeStyle = "#e07b54";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(224, 123, 84, 0.08)";
    ctx.beginPath();
    // Body
    ctx.moveTo(cx, cy - size * 0.45);
    ctx.bezierCurveTo(
      cx + size * 0.3, cy - size * 0.35,
      cx + size * 0.38, cy + size * 0.1,
      cx + size * 0.22, cy + size * 0.42
    );
    ctx.lineTo(cx - size * 0.22, cy + size * 0.42);
    ctx.bezierCurveTo(
      cx - size * 0.38, cy + size * 0.1,
      cx - size * 0.3, cy - size * 0.35,
      cx, cy - size * 0.45
    );
    ctx.fill();
    ctx.stroke();

    // Neck
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.08, cy - size * 0.45);
    ctx.lineTo(cx - size * 0.06, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.06, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.08, cy - size * 0.45);
    ctx.stroke();

    // Handles
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy - size * 0.12, size * 0.12, Math.PI * 0.6, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.3, cy - size * 0.12, size * 0.12, Math.PI * 1.6, Math.PI * 0.4);
    ctx.stroke();
  }

  private drawChart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const bars = [0.4, 0.7, 0.55, 0.9, 0.65, 0.3];
    const barW = (w - 10) / bars.length - 3;

    for (let i = 0; i < bars.length; i++) {
      const bh = bars[i] * (h - 15);
      const bx = x + 5 + i * (barW + 3);
      const by = y + h - 10 - bh;

      // Bar fill
      const grad = ctx.createLinearGradient(bx, by + bh, bx, by);
      grad.addColorStop(0, "rgba(45, 212, 191, 0.3)");
      grad.addColorStop(1, "rgba(45, 212, 191, 0.7)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, 2);
      ctx.fill();
    }

    // X axis
    ctx.strokeStyle = "rgba(200, 184, 154, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h - 10);
    ctx.lineTo(x + w - 3, y + h - 10);
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(200, 184, 154, 0.5)";
    ctx.font = "7px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("periodi", x + w / 2, y + h);
    ctx.textAlign = "left";
  }
}
