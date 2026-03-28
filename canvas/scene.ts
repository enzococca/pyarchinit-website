import { ParticleSystem } from "./entities/particles";
import { Monitor } from "./entities/monitor";
import { Luca } from "./entities/luca";
import { BubbleSystem } from "./entities/bubbles";
import { Magnifier } from "./interaction";
import { smoothNoise2D } from "./noise";

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

  // Logo image for hoodie back
  private logoImage: HTMLImageElement;

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

    // Load logo image
    this.logoImage = new Image();
    this.logoImage.src = "/images/logo_pyarchinit.png";
    this.logoImage.onload = () => {
      this.luca.setLogoImage(this.logoImage);
    };

    // Placeholder sizes - will be set in resize()
    this.particles = new ParticleSystem(800, 600);
    this.monitor = new Monitor({ x: 400, y: 200, width: 280, height: 180 });
    this.luca = new Luca({ x: 400, y: 500, scale: 1 });
    this.bubbles = new BubbleSystem(400, 260);
    this.magnifier = new Magnifier({
      activationRadius: 200,
      lensRadius: 120,
      zoom: 3,
    });

    this.resize();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseleave", this.onMouseLeave);
  }

  private unbindEvents(): void {
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseleave", this.onMouseLeave);
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (e.clientX - rect.left) * this.dpr;
    this.mouseY = (e.clientY - rect.top) * this.dpr;
    this.magnifier.setMouse(this.mouseX, this.mouseY);
  };

  private onMouseLeave = (): void => {
    this.mouseX = -9999;
    this.mouseY = -9999;
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

    // Luca sits center, lower portion - takes up ~45% viewport height
    const lucaX = physW * 0.5;
    const lucaY = physH * 0.92;
    const lucaScale = Math.min(physW / 700, physH / 550) * this.dpr * 0.85;

    this.luca.setConfig({ x: lucaX, y: lucaY, scale: lucaScale });

    // Monitor sits above Luca - larger
    const monW = Math.min(physW * 0.35, 400 * this.dpr);
    const monH = monW * 0.6;
    const monX = lucaX;
    const monY = lucaY - 300 * lucaScale - monH / 2;

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
    grad.addColorStop(0, "#050c1a");
    grad.addColorStop(0.5, "#0a1020");
    grad.addColorStop(1, "#111720");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, physW, physH);
  }

  private drawRoomSilhouette(ctx: CanvasRenderingContext2D, time: number): void {
    const physW = this.canvas.width;
    const physH = this.canvas.height;

    ctx.save();

    // ── Window on the right with moonlight ─────────────────────────────────
    const winX = physW * 0.85;
    const winY = physH * 0.15;
    const winW = physW * 0.1;
    const winH = physH * 0.25;

    // Window frame silhouette
    ctx.strokeStyle = "rgba(30, 40, 55, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 2);
    ctx.stroke();

    // Cross bars
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY);
    ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.moveTo(winX, winY + winH / 2);
    ctx.lineTo(winX + winW, winY + winH / 2);
    ctx.stroke();

    // Moonlight through window
    const moonGlow = ctx.createRadialGradient(
      winX + winW / 2, winY + winH / 2, 0,
      winX + winW / 2, winY + winH / 2, winH * 1.5
    );
    moonGlow.addColorStop(0, "rgba(180, 200, 230, 0.04)");
    moonGlow.addColorStop(0.5, "rgba(150, 170, 200, 0.02)");
    moonGlow.addColorStop(1, "rgba(100, 120, 150, 0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(winX - winW, winY - winH * 0.5, winW * 3, winH * 3);

    // Moon-ish light inside window panes
    ctx.fillStyle = "rgba(140, 160, 190, 0.06)";
    ctx.fillRect(winX + 2, winY + 2, winW / 2 - 3, winH / 2 - 3);
    ctx.fillRect(winX + winW / 2 + 1, winY + 2, winW / 2 - 3, winH / 2 - 3);
    ctx.fillRect(winX + 2, winY + winH / 2 + 1, winW / 2 - 3, winH / 2 - 3);
    ctx.fillRect(winX + winW / 2 + 1, winY + winH / 2 + 1, winW / 2 - 3, winH / 2 - 3);

    // ── Bookshelf on the left ──────────────────────────────────────────────
    const shelfX = physW * 0.03;
    const shelfY = physH * 0.1;
    const shelfW = physW * 0.08;
    const shelfH = physH * 0.55;

    // Bookshelf frame
    ctx.strokeStyle = "rgba(25, 35, 50, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(shelfX, shelfY, shelfW, shelfH);
    ctx.stroke();

    // Shelves
    const shelfCount = 4;
    for (let s = 0; s < shelfCount; s++) {
      const sy = shelfY + ((s + 1) / (shelfCount + 1)) * shelfH;
      ctx.beginPath();
      ctx.moveTo(shelfX, sy);
      ctx.lineTo(shelfX + shelfW, sy);
      ctx.stroke();

      // Books on shelf (silhouettes)
      const bookCount = 3 + Math.floor(Math.random() * 3);
      let bx = shelfX + 3;
      for (let bi = 0; bi < bookCount; bi++) {
        const bw = 4 + (Math.sin(s * 3 + bi * 7) * 0.5 + 0.5) * 6;
        const bh = 12 + (Math.cos(s * 5 + bi * 3) * 0.5 + 0.5) * 10;

        ctx.fillStyle = `rgba(${20 + bi * 5}, ${25 + bi * 3}, ${35 + bi * 4}, 0.4)`;
        ctx.fillRect(bx, sy - bh - 2, bw, bh);
        bx += bw + 2;
        if (bx > shelfX + shelfW - 5) break;
      }
    }

    ctx.restore();
  }

  private drawMonitorLightRays(ctx: CanvasRenderingContext2D, time: number): void {
    const monConfig = this.monitor.getConfig();
    const gc = this.monitor.getGlowColor();

    ctx.save();

    // Ambient light rays emanating from monitor
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLen = Math.min(monConfig.width, monConfig.height) * 1.5;
      const wobble = Math.sin(time * 0.001 + i * 1.5) * 0.1;

      const grad = ctx.createLinearGradient(
        monConfig.x, monConfig.y,
        monConfig.x + Math.cos(angle + wobble) * rayLen,
        monConfig.y + Math.sin(angle + wobble) * rayLen
      );
      grad.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.03)`);
      grad.addColorStop(1, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      const spread = 0.15;
      ctx.moveTo(monConfig.x, monConfig.y);
      ctx.lineTo(
        monConfig.x + Math.cos(angle + wobble - spread) * rayLen,
        monConfig.y + Math.sin(angle + wobble - spread) * rayLen
      );
      ctx.lineTo(
        monConfig.x + Math.cos(angle + wobble + spread) * rayLen,
        monConfig.y + Math.sin(angle + wobble + spread) * rayLen
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCTA(ctx: CanvasRenderingContext2D, time: number): void {
    const physW = this.canvas.width;
    const physH = this.canvas.height;

    ctx.save();
    ctx.textAlign = "center";

    // "Scopri pyArchInit" text with elegant fade
    const fontSize = Math.round(15 * this.dpr);
    ctx.font = `300 ${fontSize}px "JetBrains Mono", monospace`;

    // Subtle breathing glow
    const breathe = 0.6 + 0.2 * Math.sin(time * 0.002);
    ctx.fillStyle = `rgba(200, 184, 154, ${breathe})`;
    ctx.letterSpacing = `${3 * this.dpr}px`;
    ctx.fillText("S C O P R I   p y A r c h I n i t", physW / 2, physH - 55 * this.dpr);

    // Reset letter spacing
    ctx.letterSpacing = "0px";

    // Underline animation
    const lineWidth = 120 * this.dpr;
    const lineY = physH - 45 * this.dpr;
    const lineGrad = ctx.createLinearGradient(
      physW / 2 - lineWidth / 2, 0,
      physW / 2 + lineWidth / 2, 0
    );
    lineGrad.addColorStop(0, "rgba(45, 212, 191, 0)");
    lineGrad.addColorStop(0.5, `rgba(45, 212, 191, ${breathe * 0.5})`);
    lineGrad.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(physW / 2 - lineWidth / 2, lineY);
    ctx.lineTo(physW / 2 + lineWidth / 2, lineY);
    ctx.stroke();

    // Pulsing arrow (chevron down)
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.003);
    const arrowY = physH - 25 * this.dpr + pulse * 6 * this.dpr;
    const arrowSize = 10 * this.dpr;
    const arrowX = physW / 2;

    ctx.globalAlpha = 0.3 + pulse * 0.5;
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 1.5 * this.dpr;
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
    const gc = this.monitor.getGlowColor();

    // ── Render scene to offscreen canvas ──────────────────────────────────
    const oCtx = this.offscreenCtx;
    oCtx.clearRect(0, 0, physW, physH);

    this.drawBackground(oCtx);
    this.drawRoomSilhouette(oCtx, time);
    this.particles.draw(oCtx);
    this.drawMonitorLightRays(oCtx, time);
    this.drawFloorShadow(oCtx);
    this.monitor.draw(oCtx, 0);
    this.luca.draw(oCtx, time, gc);
    this.bubbles.draw(oCtx);
    this.drawCTA(oCtx, time);

    // ── Blit offscreen to main canvas ─────────────────────────────────────
    const ctx = this.ctx;
    ctx.clearRect(0, 0, physW, physH);
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    // ── Magnifier overlay ─────────────────────────────────────────────────
    if (isMagnifierActive) {
      // Use pre-allocated zoom canvas
      const { canvas: zoomCanvas, ctx: zCtx } = this.magnifier.getZoomCanvas(physW, physH);
      zCtx.clearRect(0, 0, physW, physH);

      this.drawBackground(zCtx);
      this.particles.draw(zCtx);
      this.drawFloorShadow(zCtx);
      this.monitor.draw(zCtx, 1); // detail level 1 for zoom
      this.luca.draw(zCtx, time, gc);
      this.drawCTA(zCtx, time);

      this.magnifier.draw(ctx, zoomCanvas);
    }
  }

  private drawFloorShadow(ctx: CanvasRenderingContext2D): void {
    const lucaConfig = this.luca.getConfig();
    const { x, y, scale } = lucaConfig;

    ctx.save();
    ctx.globalAlpha = 0.3;
    const shadowGrad = ctx.createRadialGradient(x, y + 5, 0, x, y + 5, 180 * scale);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.5)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 180 * scale, 35 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
