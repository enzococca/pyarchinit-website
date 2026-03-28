import { noise2D } from "../noise";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  radius: number;
  speed: number;
  opacity: number;
  noiseOffset: number;
  hue: number; // slight color variation
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private count: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, count: number = 80) {
    this.width = width;
    this.height = height;
    this.count = count;
    this.init();
  }

  private init(): void {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY: boolean = false): Particle {
    const baseX = Math.random() * this.width;
    return {
      x: baseX,
      y: randomY ? Math.random() * this.height : this.height + 10,
      baseX,
      radius: 0.8 + Math.random() * 2,
      speed: 0.2 + Math.random() * 0.6,
      opacity: 0.1 + Math.random() * 0.5,
      noiseOffset: Math.random() * 1000,
      hue: Math.random() > 0.7 ? 180 : 0, // mostly teal, some white
    };
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.init();
  }

  update(time: number): void {
    for (const p of this.particles) {
      // Noise-based horizontal drift
      const noiseVal = noise2D(p.noiseOffset + time * 0.0003, p.y * 0.003);
      p.x = p.baseX + (noiseVal - 0.5) * 60;
      p.y -= p.speed;

      // Wrap around
      if (p.y < -10) {
        const fresh = this.createParticle(false);
        Object.assign(p, fresh);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (p.hue === 180) {
        ctx.fillStyle = `hsl(180, 80%, 70%)`; // teal
      } else {
        ctx.fillStyle = `rgba(220, 210, 190, 0.9)`; // sand-ish
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
