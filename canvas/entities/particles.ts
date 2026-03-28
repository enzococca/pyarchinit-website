import { noise2D, smoothNoise2D } from "../noise";

// ── Floating luminous dots ──────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  baseX: number;
  radius: number;
  speed: number;
  opacity: number;
  noiseOffset: number;
  color: "teal" | "terracotta" | "warm";
}

// ── Code rain characters ────────────────────────────────────────────────────

interface CodeRainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string;
  charIndex: number;
  opacity: number;
  fontSize: number;
  lastCharTime: number;
  charInterval: number;
  trail: { char: string; y: number; opacity: number }[];
}

const CODE_FRAGMENTS = [
  "def __init__(self):",
  "import pyarchinit",
  "class US(Model):",
  "db.session.commit()",
  "harris.add_node(us)",
  "self.iface = iface",
  "QgsSettings()",
  "create_engine()",
  "MetaData()",
  "conn_str()",
  "setupUi(self)",
  "01001010",
  "10110010",
  "for us in query:",
  "layer.addFeature()",
  "gdf.plot()",
  "pdf.generate()",
  "export_matrix()",
];

export class ParticleSystem {
  private particles: Particle[] = [];
  private codeRain: CodeRainDrop[] = [];
  private count: number;
  private rainCount: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, count: number = 60, rainCount: number = 25) {
    this.width = width;
    this.height = height;
    this.count = count;
    this.rainCount = rainCount;
    this.init();
  }

  private init(): void {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.createParticle(true));
    }
    this.codeRain = [];
    for (let i = 0; i < this.rainCount; i++) {
      this.codeRain.push(this.createRainDrop(true));
    }
  }

  private createParticle(randomY: boolean = false): Particle {
    const baseX = Math.random() * this.width;
    const rng = Math.random();
    let color: "teal" | "terracotta" | "warm";
    if (rng < 0.45) color = "teal";
    else if (rng < 0.75) color = "terracotta";
    else color = "warm";

    return {
      x: baseX,
      y: randomY ? Math.random() * this.height : this.height + 10,
      baseX,
      radius: 0.6 + Math.random() * 2.2,
      speed: 0.15 + Math.random() * 0.5,
      opacity: 0.08 + Math.random() * 0.4,
      noiseOffset: Math.random() * 1000,
      color,
    };
  }

  private createRainDrop(randomY: boolean = false): CodeRainDrop {
    const fragment = CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)];
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -20,
      speed: 0.3 + Math.random() * 0.8,
      chars: fragment,
      charIndex: randomY ? Math.floor(Math.random() * fragment.length) : 0,
      opacity: 0.04 + Math.random() * 0.1,
      fontSize: 8 + Math.random() * 4,
      lastCharTime: 0,
      charInterval: 80 + Math.random() * 120,
      trail: [],
    };
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.init();
  }

  update(time: number): void {
    // Update floating particles
    for (const p of this.particles) {
      const noiseVal = smoothNoise2D(p.noiseOffset + time * 0.0003, p.y * 0.002);
      p.x = p.baseX + (noiseVal - 0.5) * 80;
      p.y -= p.speed;

      if (p.y < -10) {
        Object.assign(p, this.createParticle(false));
      }
    }

    // Update code rain
    for (const drop of this.codeRain) {
      drop.y += drop.speed;

      // Advance character
      if (time - drop.lastCharTime > drop.charInterval) {
        if (drop.charIndex < drop.chars.length) {
          drop.trail.push({
            char: drop.chars[drop.charIndex],
            y: drop.y,
            opacity: drop.opacity,
          });
          drop.charIndex++;
        }
        drop.lastCharTime = time;
      }

      // Fade trail
      for (const t of drop.trail) {
        t.opacity *= 0.997;
      }
      drop.trail = drop.trail.filter((t) => t.opacity > 0.005);

      // Reset when off screen
      if (drop.y > this.height + 50 && drop.trail.length === 0) {
        Object.assign(drop, this.createRainDrop(false));
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw code rain first (behind particles)
    for (const drop of this.codeRain) {
      ctx.save();
      ctx.font = `${drop.fontSize}px "JetBrains Mono", "Courier New", monospace`;

      for (const t of drop.trail) {
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = "rgba(45, 212, 191, 0.8)";
        ctx.fillText(t.char, drop.x, t.y);
      }

      ctx.restore();
    }

    // Draw floating luminous dots
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;

      let fillColor: string;
      switch (p.color) {
        case "teal":
          fillColor = "hsl(174, 70%, 65%)";
          break;
        case "terracotta":
          fillColor = "hsl(16, 65%, 55%)";
          break;
        case "warm":
          fillColor = "rgba(220, 200, 170, 0.9)";
          break;
      }
      ctx.fillStyle = fillColor;

      // Soft glow
      if (p.radius > 1.2) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glow.addColorStop(0, fillColor);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.globalAlpha = p.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = fillColor;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
