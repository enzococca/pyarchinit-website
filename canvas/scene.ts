import { ParticleSystem } from "./entities/particles";
import { Monitor } from "./entities/monitor";
import { Luca } from "./entities/luca";
import { BubbleSystem } from "./entities/bubbles";
import { Magnifier } from "./interaction";

export class LandingScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private dpr: number = 1;
  private cssWidth: number = 0;
  private cssHeight: number = 0;

  private particles: ParticleSystem;
  private monitor: Monitor;
  private luca: Luca;
  private bubbles: BubbleSystem;
  private magnifier: Magnifier;

  private animFrameId: number = 0;
  private startTime: number = 0;
  private lastTime: number = 0;

  private mouseX: number = -9999;
  private mouseY: number = -9999;

  private onTransition: () => void;

  // Pulsing arrow animation
  private arrowPulse: number = 0;

  constructor(canvas: HTMLCanvasElement, onTransition: () => void) {
    this.canvas = canvas;
    this.onTransition = onTransition;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;

    // Create offscreen canvas for magnifier rendering
    this.offscreenCanvas = document.createElement("canvas");
    const offCtx = this.offscreenCanvas.getContext("2d");
    if (!offCtx) throw new Error("Failed to get offscreen 2D context");
    this.offscreenCtx = offCtx;

    // Placeholder sizes – will be set in resize()
    this.particles = new ParticleSystem(800, 600);
    this.monitor = new Monitor({ x: 400, y: 200, width: 280, height: 180 });
    this.luca = new Luca({ x: 400, y: 500, scale: 1 });
    this.bubbles = new BubbleSystem(400, 260);
    this.magnifier = new Magnifier({
      activationRadius: 150,
      lensRadius: 80,
      zoom: 3,
    });

    this.resize();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
  }

  private unbindEvents(): void {
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (e.clientX - rect.left) * this.dpr;
    this.mouseY = (e.clientY - rect.top) * this.dpr;
    this.magnifier.setMouse(this.mouseX, this.mouseY);
  };

  private resize = (): void => {
    this.dpr = window.devicePixelRatio || 1;
    this.cssWidth = this.canvas.clientWidth;
    this.cssHeight = this.canvas.clientHeight;

    const physW = Math.round(this.cssWidth * this.dpr);
    const physH = Math.round(this.cssHeight * this.dpr);

    this.canvas.width = physW;
    this.canvas.height = physH;
    this.offscreenCanvas.width = physW;
    this.offscreenCanvas.height = physH;

    this.updateLayout();
    this.particles.resize(physW, physH);
  };

  private updateLayout(): void {
    const physW = Math.round(this.cssWidth * this.dpr);
    const physH = Math.round(this.cssHeight * this.dpr);

    // Luca sits at center-right, lower portion of screen
    const lucaX = physW * 0.58;
    const lucaY = physH * 0.88;
    const lucaScale = Math.min(physW / 900, physH / 700) * this.dpr * 0.85;

    this.luca.setConfig({ x: lucaX, y: lucaY, scale: lucaScale });

    // Monitor sits above Luca
    const monW = Math.min(physW * 0.28, 320 * this.dpr);
    const monH = monW * 0.62;
    const monX = lucaX;
    const monY = lucaY - 240 * lucaScale - monH / 2;

    this.monitor.setConfig({ x: monX, y: monY, width: monW, height: monH });

    // Bubbles originate near Luca's head
    const head = this.luca.getHeadCenter();
    this.bubbles.setOrigin(head.x, head.y);
  }

  start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.loop(this.startTime);
  }

  stop(): void {
    cancelAnimationFrame(this.animFrameId);
    this.unbindEvents();
  }

  private loop = (timestamp: number): void => {
    const time = timestamp - this.startTime;
    this.lastTime = timestamp;

    this.update(time);
    this.render(time);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(time: number): void {
    this.particles.update(time);
    this.monitor.update(time);
    this.bubbles.update(time);
    this.arrowPulse = time;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const physW = this.canvas.width;
    const physH = this.canvas.height;

    // Dark gradient: blu notte -> grigio antracite
    const grad = ctx.createLinearGradient(0, 0, physW * 0.3, physH);
    grad.addColorStop(0, "#050c1a");   // blu notte
    grad.addColorStop(0.5, "#0a1020"); // deep navy
    grad.addColorStop(1, "#111720");   // grigio antracite
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, physW, physH);
  }

  private drawCTA(ctx: CanvasRenderingContext2D, time: number): void {
    const physW = this.canvas.width;
    const physH = this.canvas.height;

    ctx.save();
    ctx.textAlign = "center";

    // "Scopri pyArchInit" text
    const fontSize = Math.round(14 * this.dpr);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = "rgba(200, 184, 154, 0.7)";
    ctx.letterSpacing = `${2 * this.dpr}px`;
    ctx.fillText("Scopri pyArchInit", physW / 2, physH - 50 * this.dpr);

    // Pulsing arrow (chevron down)
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.003);
    const arrowY = physH - 30 * this.dpr + pulse * 6 * this.dpr;
    const arrowSize = 10 * this.dpr;
    const arrowX = physW / 2;

    ctx.globalAlpha = 0.4 + pulse * 0.4;
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2 * this.dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize * 0.5);
    ctx.lineTo(arrowX, arrowY + arrowSize * 0.5);
    ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  private render(time: number): void {
    const physW = this.canvas.width;
    const physH = this.canvas.height;

    const monConfig = this.monitor.getConfig();
    const isMagnifierActive = this.magnifier.isActive(monConfig);

    // ── Render scene to offscreen canvas (for magnifier source) ─────────────
    const oCtx = this.offscreenCtx;
    oCtx.clearRect(0, 0, physW, physH);

    this.drawBackground(oCtx);
    this.particles.draw(oCtx);
    this.drawDesk(oCtx);
    this.monitor.draw(oCtx, 0); // detail level 0 for normal view
    this.luca.draw(oCtx, time);
    this.bubbles.draw(oCtx);
    this.drawCTA(oCtx, time);

    // ── Blit offscreen to main canvas ────────────────────────────────────────
    const ctx = this.ctx;
    ctx.clearRect(0, 0, physW, physH);
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    // ── Magnifier overlay (reads from offscreen) ──────────────────────────────
    if (isMagnifierActive) {
      // For the zoomed view, draw a higher-detail monitor into a second offscreen
      // We use the same offscreen but with detail level 1
      const zoomCanvas = document.createElement("canvas");
      zoomCanvas.width = physW;
      zoomCanvas.height = physH;
      const zCtx = zoomCanvas.getContext("2d");
      if (zCtx) {
        this.drawBackground(zCtx);
        this.particles.draw(zCtx);
        this.drawDesk(zCtx);
        this.monitor.draw(zCtx, 1); // detail level 1 for zoom
        this.luca.draw(zCtx, time);
        this.drawCTA(zCtx, time);
      }
      this.magnifier.draw(ctx, zoomCanvas);
    }
  }

  private drawDesk(ctx: CanvasRenderingContext2D): void {
    // The desk is drawn as part of the Luca entity, but we can add a subtle
    // floor shadow / ambient glow under the desk area here if desired.
    const lucaConfig = this.luca.getConfig();
    const { x, y, scale } = lucaConfig;

    // Floor shadow ellipse
    ctx.save();
    ctx.globalAlpha = 0.3;
    const shadowGrad = ctx.createRadialGradient(x, y + 5, 0, x, y + 5, 140 * scale);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.5)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 140 * scale, 30 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
