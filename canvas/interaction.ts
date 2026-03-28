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

  constructor(config: MagnifierConfig) {
    this.config = config;
  }

  setMouse(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  isActive(monitorConfig: MonitorConfig): boolean {
    const { x, y } = monitorConfig;
    const dx = this.mouseX - x;
    const dy = this.mouseY - y;
    this.active = Math.sqrt(dx * dx + dy * dy) < this.config.activationRadius;
    return this.active;
  }

  /**
   * Renders the magnifier lens by zooming into the offscreen canvas.
   * Call this AFTER rendering the full scene to an offscreen canvas.
   *
   * @param ctx         - Main (display) canvas context
   * @param offscreen   - Canvas that has the already-rendered scene (without magnifier)
   */
  draw(ctx: CanvasRenderingContext2D, offscreen: HTMLCanvasElement): void {
    if (!this.active) return;

    const { lensRadius, zoom } = this.config;
    const mx = this.mouseX;
    const my = this.mouseY;

    ctx.save();

    // Clip to circular lens
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw zoomed portion of offscreen scene
    // Source region: area of offscreen that corresponds to the lens, but scaled down
    const srcW = (lensRadius * 2) / zoom;
    const srcH = (lensRadius * 2) / zoom;
    const srcX = mx - srcW / 2;
    const srcY = my - srcH / 2;

    ctx.drawImage(
      offscreen,
      srcX, srcY, srcW, srcH,
      mx - lensRadius, my - lensRadius, lensRadius * 2, lensRadius * 2
    );

    ctx.restore();

    // Lens border ring
    ctx.save();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.8)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(45, 212, 191, 0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner glow ring
    ctx.save();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx, my, lensRadius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
