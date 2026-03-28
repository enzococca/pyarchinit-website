export interface LucaConfig {
  x: number;       // center bottom of chair
  y: number;       // baseline (floor level)
  scale: number;   // 1 = normal
}

export class Luca {
  private config: LucaConfig;

  constructor(config: LucaConfig) {
    this.config = config;
  }

  setConfig(config: LucaConfig): void {
    this.config = config;
  }

  getConfig(): LucaConfig {
    return this.config;
  }

  // Returns approximate head center position for bubble spawning
  getHeadCenter(): { x: number; y: number } {
    const { x, y, scale } = this.config;
    return {
      x: x,
      y: y - 200 * scale,
    };
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const { x, y, scale } = this.config;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // ─── DESK ───────────────────────────────────────────────────────────────
    // Desk surface
    ctx.fillStyle = "#2a1f14"; // dark wood
    ctx.beginPath();
    ctx.roundRect(-130, -100, 260, 18, 3);
    ctx.fill();

    // Desk front edge (darker)
    ctx.fillStyle = "#1e1610";
    ctx.beginPath();
    ctx.roundRect(-130, -84, 260, 8, 2);
    ctx.fill();

    // Desk legs (two visible from back view)
    ctx.fillStyle = "#1e1610";
    ctx.fillRect(-120, -76, 14, 80);
    ctx.fillRect(106, -76, 14, 80);

    // ─── CHAIR ───────────────────────────────────────────────────────────────
    // Chair back
    ctx.fillStyle = "#1c2b3a";
    ctx.beginPath();
    ctx.roundRect(-44, -175, 88, 85, 6);
    ctx.fill();

    // Chair back highlight
    ctx.fillStyle = "rgba(45, 212, 191, 0.05)";
    ctx.beginPath();
    ctx.roundRect(-38, -170, 38, 75, 4);
    ctx.fill();

    // Chair seat
    ctx.fillStyle = "#1c2b3a";
    ctx.beginPath();
    ctx.ellipse(0, -90, 54, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chair armrests
    ctx.fillStyle = "#16202a";
    ctx.beginPath();
    ctx.roundRect(-68, -130, 16, 45, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(52, -130, 16, 45, 4);
    ctx.fill();

    // ─── MONITOR GLOW ON BACK ─────────────────────────────────────────────
    // Radial gradient simulating teal monitor glow falling on Luca's back
    const backGlow = ctx.createRadialGradient(0, -160, 10, 0, -160, 80);
    backGlow.addColorStop(0, "rgba(45, 212, 191, 0.08)");
    backGlow.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = backGlow;
    ctx.beginPath();
    ctx.ellipse(0, -160, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // ─── BODY / TORSO ────────────────────────────────────────────────────────
    // Torso (hoodie - dark teal/grey)
    ctx.fillStyle = "#1a2535";
    ctx.beginPath();
    ctx.moveTo(-40, -90);
    ctx.lineTo(-46, -175);
    ctx.lineTo(46, -175);
    ctx.lineTo(40, -90);
    ctx.closePath();
    ctx.fill();

    // Hoodie center seam
    ctx.strokeStyle = "#243040";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -170);
    ctx.lineTo(0, -95);
    ctx.stroke();

    // ─── SHOULDERS ───────────────────────────────────────────────────────────
    ctx.fillStyle = "#1a2535";
    ctx.beginPath();
    ctx.ellipse(0, -172, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // ─── ARMS (typing animation) ──────────────────────────────────────────
    // Left arm
    const leftArmOffset = Math.sin(time * 0.006) * 5;
    ctx.fillStyle = "#1a2535";
    ctx.beginPath();
    ctx.moveTo(-38, -155);
    ctx.quadraticCurveTo(-75, -130 + leftArmOffset, -90, -95 + leftArmOffset);
    ctx.quadraticCurveTo(-88, -88 + leftArmOffset, -82, -88 + leftArmOffset);
    ctx.quadraticCurveTo(-70, -88 + leftArmOffset, -65, -93 + leftArmOffset);
    ctx.quadraticCurveTo(-52, -125 + leftArmOffset, -28, -150);
    ctx.closePath();
    ctx.fill();

    // Left hand (small oval at end of arm)
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(-85, -90 + leftArmOffset, 9, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Right arm
    const rightArmOffset = Math.sin(time * 0.006 + Math.PI * 0.7) * 5;
    ctx.fillStyle = "#1a2535";
    ctx.beginPath();
    ctx.moveTo(38, -155);
    ctx.quadraticCurveTo(75, -130 + rightArmOffset, 90, -95 + rightArmOffset);
    ctx.quadraticCurveTo(88, -88 + rightArmOffset, 82, -88 + rightArmOffset);
    ctx.quadraticCurveTo(70, -88 + rightArmOffset, 65, -93 + rightArmOffset);
    ctx.quadraticCurveTo(52, -125 + rightArmOffset, 28, -150);
    ctx.closePath();
    ctx.fill();

    // Right hand
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(85, -90 + rightArmOffset, 9, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ─── NECK & HEAD ─────────────────────────────────────────────────────────
    // Neck
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.roundRect(-8, -192, 16, 22, 3);
    ctx.fill();

    // Head (seen from behind)
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(0, -212, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // ─── HAIR ────────────────────────────────────────────────────────────────
    ctx.fillStyle = "#1a0e05";
    ctx.beginPath();
    // Top of head
    ctx.ellipse(0, -228, 28, 14, 0, Math.PI, Math.PI * 2);
    // Side hair going down
    ctx.ellipse(-25, -218, 6, 16, -0.2, 0, Math.PI);
    ctx.ellipse(25, -218, 6, 16, 0.2, 0, Math.PI);
    ctx.fill();

    // Hair fill (solid top)
    ctx.fillStyle = "#1a0e05";
    ctx.beginPath();
    ctx.ellipse(0, -220, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // ─── HEADPHONES ──────────────────────────────────────────────────────────
    // Headband arc over head
    ctx.strokeStyle = "#2a3a4a";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -218, 34, Math.PI * 1.1, Math.PI * 0.1, false);
    ctx.stroke();

    // Left ear pad
    ctx.fillStyle = "#2a3a4a";
    ctx.beginPath();
    ctx.ellipse(-34, -218, 10, 13, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Left ear pad highlight
    ctx.fillStyle = "rgba(45, 212, 191, 0.15)";
    ctx.beginPath();
    ctx.ellipse(-34, -220, 5, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right ear pad
    ctx.fillStyle = "#2a3a4a";
    ctx.beginPath();
    ctx.ellipse(34, -218, 10, 13, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right ear pad highlight
    ctx.fillStyle = "rgba(45, 212, 191, 0.15)";
    ctx.beginPath();
    ctx.ellipse(34, -220, 5, 7, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
