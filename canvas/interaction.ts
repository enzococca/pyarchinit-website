import type { MonitorConfig } from "./entities/monitor";

export interface MagnifierConfig {
  activationRadius: number;
  lensRadius: number;
  zoom: number;
}

export class Magnifier {
  private config: MagnifierConfig;
  private mouseX: number = -9999;
  private mouseY: number = -9999;
  private active: boolean = false;
  // Pre-allocated offscreen canvas for zoom rendering
  private zoomCanvas: HTMLCanvasElement;
  private zoomCtx: CanvasRenderingContext2D;
  private lastWidth: number = 0;
  private lastHeight: number = 0;

  constructor(config: MagnifierConfig) {
    this.config = config;
    this.zoomCanvas = document.createElement("canvas");
    const zCtx = this.zoomCanvas.getContext("2d");
    if (!zCtx) throw new Error("Failed to create zoom canvas context");
    this.zoomCtx = zCtx;
  }

  setMouse(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  isActive(monitorConfig: MonitorConfig): boolean {
    const { x, y, width, height } = monitorConfig;
    // Check if mouse is within or near the monitor area
    const left = x - width / 2;
    const top = y - height / 2;
    const margin = this.config.activationRadius * 0.3;

    const inArea =
      this.mouseX >= left - margin &&
      this.mouseX <= left + width + margin &&
      this.mouseY >= top - margin &&
      this.mouseY <= top + height + margin;

    this.active = inArea;
    return this.active;
  }

  /** Returns the pre-allocated zoom canvas for external rendering */
  getZoomCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (width !== this.lastWidth || height !== this.lastHeight) {
      this.zoomCanvas.width = width;
      this.zoomCanvas.height = height;
      this.lastWidth = width;
      this.lastHeight = height;
    }
    return { canvas: this.zoomCanvas, ctx: this.zoomCtx };
  }

  /**
   * Renders the magnifier lens with frosted glass border and barrel distortion.
   */
  draw(ctx: CanvasRenderingContext2D, offscreen: HTMLCanvasElement): void {
    if (!this.active) return;

    const { lensRadius, zoom } = this.config;
    const mx = this.mouseX;
    const my = this.mouseY;

    // ── Frosted glass outer ring ──────────────────────────────────────────
    ctx.save();

    // Outer frosted glow
    const frostGrad = ctx.createRadialGradient(mx, my, lensRadius - 6, mx, my, lensRadius + 12);
    frostGrad.addColorStop(0, "rgba(45, 212, 191, 0.1)");
    frostGrad.addColorStop(0.5, "rgba(45, 212, 191, 0.05)");
    frostGrad.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = frostGrad;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius + 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── Zoomed content with barrel distortion ─────────────────────────────
    ctx.save();

    // Clip to circular lens
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw zoomed portion of offscreen scene
    const srcW = (lensRadius * 2) / zoom;
    const srcH = (lensRadius * 2) / zoom;
    const srcX = mx - srcW / 2;
    const srcY = my - srcH / 2;

    ctx.drawImage(
      offscreen,
      srcX, srcY, srcW, srcH,
      mx - lensRadius, my - lensRadius, lensRadius * 2, lensRadius * 2
    );

    // Barrel distortion simulation: darken edges slightly for lens effect
    const distortGrad = ctx.createRadialGradient(mx, my, lensRadius * 0.6, mx, my, lensRadius);
    distortGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    distortGrad.addColorStop(0.85, "rgba(0, 0, 0, 0)");
    distortGrad.addColorStop(0.95, "rgba(0, 0, 0, 0.15)");
    distortGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = distortGrad;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── Frosted glass border ring ─────────────────────────────────────────
    ctx.save();

    // Thick frosted border
    ctx.strokeStyle = "rgba(200, 210, 220, 0.15)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Main border
    ctx.strokeStyle = "rgba(45, 212, 191, 0.7)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(45, 212, 191, 0.5)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // ── Specular highlight (lens reflection) ─────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(
      mx - lensRadius * 0.25,
      my - lensRadius * 0.3,
      lensRadius * 0.35,
      lensRadius * 0.15,
      -0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // ── Inner glow ring ──────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius - 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
