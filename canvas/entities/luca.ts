export interface LucaConfig {
  x: number;       // center bottom of chair
  y: number;       // baseline (floor level)
  scale: number;   // 1 = normal
}

export class Luca {
  private config: LucaConfig;
  private logoImage: HTMLImageElement | null = null;
  private logoLoaded: boolean = false;

  constructor(config: LucaConfig) {
    this.config = config;
  }

  setConfig(config: LucaConfig): void {
    this.config = config;
  }

  getConfig(): LucaConfig {
    return this.config;
  }

  setLogoImage(img: HTMLImageElement): void {
    this.logoImage = img;
    this.logoLoaded = true;
  }

  // Returns approximate head center position for bubble spawning
  getHeadCenter(): { x: number; y: number } {
    const { x, y, scale } = this.config;
    return {
      x: x,
      y: y - 310 * scale,
    };
  }

  draw(ctx: CanvasRenderingContext2D, time: number, glowColor?: { r: number; g: number; b: number }): void {
    const { x, y, scale } = this.config;
    // Default glow is now blue-ish to match the royal blue hoodie
    const gc = glowColor || { r: 37, g: 99, b: 235 };

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // ─── DESK ───────────────────────────────────────────────────────────────
    this.drawDesk(ctx, time);

    // ─── CHAIR ──────────────────────────────────────────────────────────────
    this.drawChair(ctx);

    // ─── MONITOR GLOW ON BACK ───────────────────────────────────────────────
    const backGlow = ctx.createRadialGradient(0, -220, 20, 0, -200, 140);
    backGlow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.12)`);
    backGlow.addColorStop(0.5, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.05)`);
    backGlow.addColorStop(1, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);
    ctx.fillStyle = backGlow;
    ctx.beginPath();
    ctx.ellipse(0, -200, 130, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder rim light from monitor
    const rimGlow = ctx.createLinearGradient(-60, -250, 60, -250);
    rimGlow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);
    rimGlow.addColorStop(0.3, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.08)`);
    rimGlow.addColorStop(0.5, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.15)`);
    rimGlow.addColorStop(0.7, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.08)`);
    rimGlow.addColorStop(1, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);
    ctx.fillStyle = rimGlow;
    ctx.fillRect(-70, -260, 140, 20);

    // ─── BODY / TORSO (hoodie) ──────────────────────────────────────────────
    this.drawTorso(ctx, gc);

    // ─── ARMS (typing animation) ────────────────────────────────────────────
    this.drawArms(ctx, time);

    // ─── NECK & HEAD ────────────────────────────────────────────────────────
    this.drawHead(ctx, time);

    // ─── HEADPHONES ─────────────────────────────────────────────────────────
    this.drawHeadphones(ctx);

    ctx.restore();
  }

  private drawDesk(ctx: CanvasRenderingContext2D, time: number): void {
    // Desk surface - wider, more detailed
    const deskW = 320;
    const deskH = 20;
    const deskY = -120;

    // Main desk surface with wood grain gradient
    const woodGrad = ctx.createLinearGradient(-deskW / 2, deskY, deskW / 2, deskY);
    woodGrad.addColorStop(0, "#2a1f14");
    woodGrad.addColorStop(0.3, "#332517");
    woodGrad.addColorStop(0.5, "#2e2015");
    woodGrad.addColorStop(0.7, "#332517");
    woodGrad.addColorStop(1, "#2a1f14");
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(-deskW / 2, deskY, deskW, deskH, 3);
    ctx.fill();

    // Desk front edge (darker, with subtle bevel)
    ctx.fillStyle = "#1e1610";
    ctx.beginPath();
    ctx.roundRect(-deskW / 2, deskY + deskH, deskW, 10, [0, 0, 2, 2]);
    ctx.fill();

    // Subtle wood grain lines
    ctx.strokeStyle = "rgba(60, 45, 30, 0.3)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const gy = deskY + 3 + i * 3;
      ctx.beginPath();
      ctx.moveTo(-deskW / 2 + 5, gy);
      ctx.bezierCurveTo(-deskW / 4, gy + 1, deskW / 4, gy - 1, deskW / 2 - 5, gy);
      ctx.stroke();
    }

    // Desk legs
    ctx.fillStyle = "#1e1610";
    ctx.fillRect(-deskW / 2 + 10, deskY + deskH + 10, 16, 90);
    ctx.fillRect(deskW / 2 - 26, deskY + deskH + 10, 16, 90);

    // ─── KEYBOARD ─────────────────────────────────────────────────────────
    const kbW = 110;
    const kbH = 38;
    const kbX = -kbW / 2;
    const kbY = deskY - kbH + 2;

    // Keyboard body
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.roundRect(kbX, kbY, kbW, kbH, 4);
    ctx.fill();

    // Keyboard border
    ctx.strokeStyle = "rgba(60, 60, 80, 0.5)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(kbX, kbY, kbW, kbH, 4);
    ctx.stroke();

    // Key rows
    const keySize = 6;
    const keyGap = 2;
    const keysPerRow = [12, 12, 11, 10];
    const rowOffsets = [0, 2, 5, 10];

    for (let row = 0; row < keysPerRow.length; row++) {
      const rowY = kbY + 4 + row * (keySize + keyGap);
      const numKeys = keysPerRow[row];
      const rowX = kbX + 5 + rowOffsets[row];

      for (let k = 0; k < numKeys; k++) {
        const kx = rowX + k * (keySize + keyGap);
        // Slight random brightness variation for realism
        const bright = 28 + Math.sin(k * 3.7 + row * 2.1) * 5;
        ctx.fillStyle = `rgb(${bright}, ${bright}, ${bright + 10})`;
        ctx.beginPath();
        ctx.roundRect(kx, rowY, keySize, keySize, 1);
        ctx.fill();
      }
    }

    // Space bar
    ctx.fillStyle = "#222236";
    ctx.beginPath();
    ctx.roundRect(kbX + 30, kbY + kbH - 10, 50, 6, 2);
    ctx.fill();

    // ─── MOUSE ──────────────────────────────────────────────────────────────
    const mouseX = kbX + kbW + 20;
    const mouseY = deskY - 24;

    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.ellipse(mouseX, mouseY + 10, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouse buttons divider
    ctx.strokeStyle = "rgba(60, 60, 80, 0.5)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY - 2);
    ctx.lineTo(mouseX, mouseY + 8);
    ctx.stroke();

    // Mouse scroll wheel
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(mouseX - 2, mouseY + 2, 4, 6, 2);
    ctx.fill();

    // ─── COFFEE CUP ────────────────────────────────────────────────────────
    const cupX = kbX - 30;
    const cupY = deskY - 28;

    // Cup body
    ctx.fillStyle = "#3d2b1a";
    ctx.beginPath();
    ctx.moveTo(cupX - 10, cupY);
    ctx.lineTo(cupX - 8, cupY + 24);
    ctx.quadraticCurveTo(cupX, cupY + 28, cupX + 8, cupY + 24);
    ctx.lineTo(cupX + 10, cupY);
    ctx.closePath();
    ctx.fill();

    // Cup rim
    ctx.strokeStyle = "#5a4030";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cupX, cupY, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#1a0e05";
    ctx.fill();

    // Cup handle
    ctx.strokeStyle = "#3d2b1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cupX + 14, cupY + 12, 6, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Steam from coffee
    ctx.strokeStyle = "rgba(200, 200, 200, 0.15)";
    ctx.lineWidth = 1;
    for (let s = 0; s < 3; s++) {
      const sx = cupX - 4 + s * 4;
      const steamOffset = Math.sin(time * 0.003 + s * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(sx, cupY - 4);
      ctx.quadraticCurveTo(sx + steamOffset, cupY - 14, sx - steamOffset, cupY - 24);
      ctx.stroke();
    }
  }

  private drawChair(ctx: CanvasRenderingContext2D): void {
    // Chair back (taller, more substantial)
    const chairBackGrad = ctx.createLinearGradient(-55, -260, 55, -260);
    chairBackGrad.addColorStop(0, "#18283a");
    chairBackGrad.addColorStop(0.5, "#1f3045");
    chairBackGrad.addColorStop(1, "#18283a");
    ctx.fillStyle = chairBackGrad;
    ctx.beginPath();
    ctx.roundRect(-55, -240, 110, 110, 8);
    ctx.fill();

    // Chair back mesh/texture pattern
    ctx.strokeStyle = "rgba(45, 212, 191, 0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(-48, -230 + i * 13);
      ctx.lineTo(48, -230 + i * 13);
      ctx.stroke();
    }

    // Chair headrest
    ctx.fillStyle = "#1c2b3a";
    ctx.beginPath();
    ctx.roundRect(-38, -260, 76, 24, 6);
    ctx.fill();

    // Chair seat
    ctx.fillStyle = "#1c2b3a";
    ctx.beginPath();
    ctx.ellipse(0, -125, 62, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chair armrests (more detailed with padding)
    for (const side of [-1, 1]) {
      // Armrest support
      ctx.fillStyle = "#14202c";
      ctx.beginPath();
      ctx.roundRect(side * 62 - 8, -180, 16, 60, 4);
      ctx.fill();

      // Armrest pad
      ctx.fillStyle = "#1c2b3a";
      ctx.beginPath();
      ctx.roundRect(side * 62 - 12, -185, 24, 12, 4);
      ctx.fill();
    }

    // Chair base / gas cylinder
    ctx.fillStyle = "#111";
    ctx.fillRect(-4, -105, 8, 30);

    // Chair star base legs
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI + Math.PI * 0.5;
      const legLen = 40;
      ctx.beginPath();
      ctx.moveTo(0, -75);
      ctx.lineTo(Math.cos(angle) * legLen, -75 + Math.abs(Math.sin(angle)) * 8);
      ctx.stroke();

      // Caster wheels
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * legLen, -75 + Math.abs(Math.sin(angle)) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTorso(ctx: CanvasRenderingContext2D, gc: { r: number; g: number; b: number }): void {
    // Torso (hoodie - royal blue)
    const hoodieGrad = ctx.createLinearGradient(-55, -240, 55, -140);
    hoodieGrad.addColorStop(0, "#1d4ed8");  // darker blue on sides
    hoodieGrad.addColorStop(0.3, "#2563eb"); // royal blue center
    hoodieGrad.addColorStop(0.5, "#3b82f6"); // slightly lighter highlight
    hoodieGrad.addColorStop(0.7, "#2563eb");
    hoodieGrad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = hoodieGrad;

    // Wider torso shape - more realistic proportions
    ctx.beginPath();
    ctx.moveTo(-52, -130);
    ctx.quadraticCurveTo(-58, -180, -55, -230);
    ctx.lineTo(-48, -245);
    ctx.quadraticCurveTo(0, -255, 48, -245);
    ctx.lineTo(55, -230);
    ctx.quadraticCurveTo(58, -180, 52, -130);
    ctx.closePath();
    ctx.fill();

    // Hoodie center seam
    ctx.strokeStyle = "#1e4fc2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -248);
    ctx.lineTo(0, -135);
    ctx.stroke();

    // Fabric wrinkle detail lines (darker blue)
    ctx.strokeStyle = "rgba(13, 42, 120, 0.4)";
    ctx.lineWidth = 1;
    // Left side wrinkles
    ctx.beginPath();
    ctx.moveTo(-30, -240);
    ctx.quadraticCurveTo(-35, -200, -28, -150);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-15, -245);
    ctx.quadraticCurveTo(-18, -190, -12, -140);
    ctx.stroke();

    // Right side wrinkles
    ctx.beginPath();
    ctx.moveTo(30, -240);
    ctx.quadraticCurveTo(35, -200, 28, -150);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(15, -245);
    ctx.quadraticCurveTo(18, -190, 12, -140);
    ctx.stroke();

    // Extra horizontal wrinkle near waist
    ctx.strokeStyle = "rgba(13, 42, 120, 0.2)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-40, -160);
    ctx.quadraticCurveTo(0, -155, 40, -160);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-38, -145);
    ctx.quadraticCurveTo(0, -140, 38, -145);
    ctx.stroke();

    // Hood at neck/collar - more visible, matching blue
    ctx.fillStyle = "#1e4fc2";
    ctx.beginPath();
    ctx.ellipse(0, -248, 28, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Hood inner lining slightly lighter
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.ellipse(0, -249, 22, 7, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // ─── adArte LOGO ON BACK ──────────────────────────────────────────────
    this.drawAdArteLogo(ctx);

    // Subtle monitor glow reflection on fabric
    const fabricGlow = ctx.createRadialGradient(0, -200, 10, 0, -200, 80);
    fabricGlow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0.08)`);
    fabricGlow.addColorStop(1, `rgba(${gc.r}, ${gc.g}, ${gc.b}, 0)`);
    ctx.fillStyle = fabricGlow;
    ctx.beginPath();
    ctx.ellipse(0, -200, 60, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── SHOULDERS ─────────────────────────────────────────────────────────
    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath();
    ctx.ellipse(0, -242, 58, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder highlight (light rim from monitor)
    const shoulderHighlight = ctx.createLinearGradient(-58, -242, 58, -242);
    shoulderHighlight.addColorStop(0, "rgba(59, 130, 246, 0)");
    shoulderHighlight.addColorStop(0.4, "rgba(96, 165, 250, 0.25)");
    shoulderHighlight.addColorStop(0.6, "rgba(96, 165, 250, 0.25)");
    shoulderHighlight.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = shoulderHighlight;
    ctx.beginPath();
    ctx.ellipse(0, -242, 58, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawAdArteLogo(ctx: CanvasRenderingContext2D): void {
    // Position: upper back, centered around y=-210
    const cx = 0;
    const cy = -210;

    ctx.save();

    // ── "ad" in small gold/ochre text ────────────────────────────────────
    ctx.font = "bold 8px sans-serif";
    ctx.fillStyle = "#C8A84E";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ad", cx - 6, cy - 8);

    // ── "Arte" in larger white text ───────────────────────────────────────
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
    ctx.textAlign = "center";
    ctx.fillText("Arte", cx - 4, cy + 3);

    // ── Golden spiral next to "Arte" ──────────────────────────────────────
    // Draw a spiral using multiple arc segments that grow in radius
    const spiralCx = cx + 17;
    const spiralCy = cy + 2;
    ctx.strokeStyle = "#C8A84E";
    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    ctx.beginPath();
    let r = 1.0;
    const step = 0.35;
    // Approximate Archimedean spiral with arc segments
    for (let i = 0; i < 16; i++) {
      const startAngle = (i / 16) * Math.PI * 4;
      const endAngle = ((i + 1) / 16) * Math.PI * 4;
      const midR = r + step * 0.5;
      ctx.arc(spiralCx, spiralCy, midR, startAngle, endAngle);
      r += step;
    }
    ctx.stroke();

    ctx.restore();
  }

  private drawArms(ctx: CanvasRenderingContext2D, time: number): void {
    // Left arm with more realistic shape
    const leftArmOffset = Math.sin(time * 0.005) * 4;
    const leftFingerOffset = Math.sin(time * 0.012) * 2;

    // Upper arm - royal blue hoodie sleeve
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.moveTo(-48, -230);
    ctx.quadraticCurveTo(-80, -200 + leftArmOffset, -100, -125 + leftArmOffset);
    ctx.quadraticCurveTo(-98, -118 + leftArmOffset, -90, -116 + leftArmOffset);
    ctx.quadraticCurveTo(-75, -118 + leftArmOffset, -68, -122 + leftArmOffset);
    ctx.quadraticCurveTo(-58, -180 + leftArmOffset, -38, -225);
    ctx.closePath();
    ctx.fill();

    // Left hand with fingers
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(-95, -118 + leftArmOffset, 12, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Finger suggestions (small bumps)
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.ellipse(
        -100 + f * 4 + leftFingerOffset,
        -122 + leftArmOffset + Math.abs(Math.sin(time * 0.015 + f * 1.5)) * 3,
        2, 3.5, -0.1 + f * 0.05, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Right arm
    const rightArmOffset = Math.sin(time * 0.005 + Math.PI * 0.7) * 4;
    const rightFingerOffset = Math.sin(time * 0.012 + Math.PI) * 2;

    // Right arm - royal blue hoodie sleeve
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.moveTo(48, -230);
    ctx.quadraticCurveTo(80, -200 + rightArmOffset, 100, -125 + rightArmOffset);
    ctx.quadraticCurveTo(98, -118 + rightArmOffset, 90, -116 + rightArmOffset);
    ctx.quadraticCurveTo(75, -118 + rightArmOffset, 68, -122 + rightArmOffset);
    ctx.quadraticCurveTo(58, -180 + rightArmOffset, 38, -225);
    ctx.closePath();
    ctx.fill();

    // Right hand with fingers
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(95, -118 + rightArmOffset, 12, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.ellipse(
        88 + f * 4 + rightFingerOffset,
        -122 + rightArmOffset + Math.abs(Math.sin(time * 0.015 + f * 1.5 + 2)) * 3,
        2, 3.5, 0.1 - f * 0.05, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  private drawHead(ctx: CanvasRenderingContext2D, _time: number): void {
    // Neck (slightly wider, more realistic)
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.roundRect(-10, -268, 20, 26, 4);
    ctx.fill();

    // Neck shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.beginPath();
    ctx.roundRect(-10, -258, 20, 12, 3);
    ctx.fill();

    // Head (seen from behind) - slightly larger
    ctx.fillStyle = "#c8a882";
    ctx.beginPath();
    ctx.ellipse(0, -292, 32, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear hints (side bumps)
    ctx.fillStyle = "#b89872";
    ctx.beginPath();
    ctx.ellipse(-30, -290, 5, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(30, -290, 5, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // ─── BEARD SHADOW ───────────────────────────────────────────────────────
    // Subtle dark shadow along the jawline and below ears (barely visible from behind)
    const beardShadow = ctx.createRadialGradient(0, -268, 5, 0, -268, 22);
    beardShadow.addColorStop(0, "rgba(30, 15, 5, 0.18)");
    beardShadow.addColorStop(1, "rgba(30, 15, 5, 0)");
    ctx.fillStyle = beardShadow;
    ctx.beginPath();
    ctx.ellipse(0, -268, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Side beard shadow under ears
    for (const side of [-1, 1]) {
      const bx = side * 26;
      ctx.fillStyle = "rgba(25, 12, 4, 0.15)";
      ctx.beginPath();
      ctx.ellipse(bx, -276, 7, 10, side * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── GLASSES ARMS/TEMPLES ────────────────────────────────────────────────
    // Thin lines from ear area forward along the sides of the head
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";

    // Left glasses arm: from left ear forward (slightly angled upward)
    ctx.beginPath();
    ctx.moveTo(-33, -291);   // near left ear
    ctx.lineTo(-22, -295);   // extends toward front of head
    ctx.stroke();

    // Right glasses arm
    ctx.beginPath();
    ctx.moveTo(33, -291);    // near right ear
    ctx.lineTo(22, -295);    // extends toward front of head
    ctx.stroke();

    // ─── HAIR ───────────────────────────────────────────────────────────────
    // Base hair mass - dark, larger and more voluminous for curly hair
    ctx.fillStyle = "#1a0a04";
    ctx.beginPath();
    ctx.ellipse(0, -300, 35, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top of head hair volume - higher/more voluminous for curly texture
    ctx.fillStyle = "#1a0a04";
    ctx.beginPath();
    ctx.ellipse(0, -315, 32, 17, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Side hair going down - slightly longer past ears
    ctx.fillStyle = "#1f0e06";
    ctx.beginPath();
    ctx.ellipse(-31, -296, 9, 20, -0.2, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(31, -296, 9, 20, 0.2, 0, Math.PI);
    ctx.fill();

    // Extra curl volume on sides
    ctx.fillStyle = "#2a1508";
    ctx.beginPath();
    ctx.ellipse(-26, -310, 8, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(26, -310, 8, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Nape of neck hair strands
    ctx.fillStyle = "#1a0a04";
    ctx.beginPath();
    ctx.moveTo(-12, -272);
    ctx.quadraticCurveTo(-14, -278, -8, -283);
    ctx.quadraticCurveTo(-4, -280, -10, -275);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -272);
    ctx.quadraticCurveTo(14, -278, 8, -283);
    ctx.quadraticCurveTo(4, -280, 10, -275);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -271);
    ctx.quadraticCurveTo(2, -278, 0, -284);
    ctx.quadraticCurveTo(-2, -279, 0, -273);
    ctx.closePath();
    ctx.fill();

    // ─── CURLY HAIR DETAIL ───────────────────────────────────────────────────
    // Draw many small curved arcs and squiggly lines for curls
    const curlColors = ["#1a0a04", "#2a1508", "#1f0e06", "#231205", "#2a1508"];
    ctx.lineCap = "round";

    // Back-of-head curls
    const curlDefs = [
      // [x, y, rx, ry, startAngle, endAngle, lineWidth, colorIdx]
      [-18, -305, 5, 4, 0.2, Math.PI + 0.2, 1.5, 1],
      [-10, -313, 4, 3, 0.0, Math.PI, 1.2, 0],
      [0,   -316, 5, 4, 0.1, Math.PI + 0.3, 1.4, 2],
      [10,  -313, 4, 3, -0.1, Math.PI + 0.1, 1.2, 1],
      [18,  -305, 5, 4, -0.2, Math.PI - 0.1, 1.5, 0],
      [-24, -298, 4, 3, 0.3, Math.PI + 0.4, 1.1, 2],
      [24,  -298, 4, 3, -0.3, Math.PI - 0.3, 1.1, 2],
      [-6,  -307, 3, 4, 0.4, Math.PI + 0.5, 1.0, 3],
      [6,   -307, 3, 4, -0.4, Math.PI - 0.4, 1.0, 4],
      [-14, -296, 4, 3, 0.1, Math.PI + 0.2, 1.3, 0],
      [14,  -296, 4, 3, -0.1, Math.PI - 0.2, 1.3, 1],
    ];

    for (const [cx, cy, rx, ry, rot, endA, lw, ci] of curlDefs) {
      ctx.strokeStyle = curlColors[ci as number];
      ctx.lineWidth = lw as number;
      ctx.beginPath();
      ctx.ellipse(cx as number, cy as number, rx as number, ry as number, rot as number, 0, endA as number);
      ctx.stroke();
    }

    // Loose squiggly strands across the back of the head
    const squiggleDefs: Array<[number, number, number, number, number, number]> = [
      [-20, -285, -16, -295, -22, -290],
      [-8,  -283, -4,  -294, -10, -289],
      [0,   -284, 3,   -296, -3,  -290],
      [8,   -283, 5,   -294, 10,  -289],
      [20,  -285, 17,  -295, 22,  -290],
      [-14, -288, -11, -300, -16, -295],
      [14,  -288, 11,  -300, 16,  -295],
    ];

    ctx.lineWidth = 0.9;
    for (const [sx, sy, ex, ey, cpx, cpy] of squiggleDefs) {
      ctx.strokeStyle = curlColors[Math.floor(Math.abs(sx) / 5) % curlColors.length];
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Hair highlight (subtle warm reflection on curls)
    ctx.strokeStyle = "rgba(60, 35, 18, 0.35)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      const hx = -14 + i * 4;
      ctx.beginPath();
      ctx.moveTo(hx, -313);
      ctx.quadraticCurveTo(hx + 3, -305, hx - 1, -295);
      ctx.stroke();
    }
  }

  private drawHeadphones(ctx: CanvasRenderingContext2D): void {
    // Headband arc over head - metallic
    const bandGrad = ctx.createLinearGradient(-38, -330, 38, -330);
    bandGrad.addColorStop(0, "#2a3a4a");
    bandGrad.addColorStop(0.3, "#4a5a6a");
    bandGrad.addColorStop(0.5, "#5a6a7a");
    bandGrad.addColorStop(0.7, "#4a5a6a");
    bandGrad.addColorStop(1, "#2a3a4a");

    ctx.strokeStyle = bandGrad;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -295, 40, Math.PI * 1.08, -Math.PI * 0.08, false);
    ctx.stroke();

    // Band inner padding
    ctx.strokeStyle = "#1e2e3e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -295, 38, Math.PI * 1.1, -Math.PI * 0.1, false);
    ctx.stroke();

    // Left ear pad
    for (const side of [-1, 1]) {
      const px = side * 40;
      const py = -295;

      // Outer shell
      ctx.fillStyle = "#2a3a4a";
      ctx.beginPath();
      ctx.ellipse(px, py, 14, 18, side * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Metallic edge highlight
      const padGrad = ctx.createRadialGradient(px - side * 3, py - 3, 2, px, py, 16);
      padGrad.addColorStop(0, "rgba(120, 140, 160, 0.3)");
      padGrad.addColorStop(1, "rgba(40, 55, 70, 0)");
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, 14, 18, side * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Cushion (inner pad)
      ctx.fillStyle = "#1e2830";
      ctx.beginPath();
      ctx.ellipse(px, py, 10, 14, side * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Cushion texture - perforated pattern
      ctx.fillStyle = "rgba(25, 35, 45, 0.8)";
      for (let dx = -6; dx <= 6; dx += 4) {
        for (let dy = -10; dy <= 10; dy += 4) {
          if (dx * dx / 36 + dy * dy / 144 < 0.8) {
            ctx.beginPath();
            ctx.arc(px + dx, py + dy, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Subtle teal LED indicator on left pad
      if (side === -1) {
        ctx.fillStyle = "rgba(45, 212, 191, 0.6)";
        ctx.beginPath();
        ctx.arc(px - 8, py + 12, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // LED glow
        const ledGlow = ctx.createRadialGradient(px - 8, py + 12, 0, px - 8, py + 12, 5);
        ledGlow.addColorStop(0, "rgba(45, 212, 191, 0.2)");
        ledGlow.addColorStop(1, "rgba(45, 212, 191, 0)");
        ctx.fillStyle = ledGlow;
        ctx.beginPath();
        ctx.arc(px - 8, py + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
