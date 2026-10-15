/**
 * 2D Princess Aurelia & Cursed Cage for Level 3 Climax Rescue.
 */

export class Princess2D {
  public x: number;
  public y: number;
  public isRescued: boolean = false;
  private cheerTimer: number = 0;
  private heartParticles: { x: number; y: number; vy: number; life: number; maxLife: number }[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public breakCage() {
    this.isRescued = true;
    for (let i = 0; i < 12; i++) {
      this.heartParticles.push({
        x: this.x + (Math.random() - 0.5) * 40,
        y: this.y - 40 - Math.random() * 30,
        vy: -60 - Math.random() * 50,
        life: 0,
        maxLife: 1.5 + Math.random() * 0.8,
      });
    }
  }

  public update(delta: number) {
    this.cheerTimer += delta * (this.isRescued ? 6 : 2);

    for (let i = this.heartParticles.length - 1; i >= 0; i--) {
      const p = this.heartParticles[i];
      p.life += delta;
      p.y += p.vy * delta;
      if (p.life >= p.maxLife) {
        this.heartParticles.splice(i, 1);
      }
    }

    if (this.isRescued && Math.random() < 0.12) {
      this.heartParticles.push({
        x: this.x + (Math.random() - 0.5) * 35,
        y: this.y - 45,
        vy: -70 - Math.random() * 40,
        life: 0,
        maxLife: 1.2,
      });
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cageHp: number, maxCageHp: number) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Stone Dais Base
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-45, -12, 90, 14, 4);
    ctx.fill();
    ctx.stroke();

    // PRINCESS
    const jumpY = this.isRescued ? -Math.abs(Math.sin(this.cheerTimer * 1.5)) * 16 : 0;
    ctx.save();
    ctx.translate(0, jumpY);

    // Dress (Velvet Rose & Gold Hem)
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(24, -12);
    ctx.lineTo(-24, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold dress trim
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-24, -15, 48, 4);

    // Torso & Bodice
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.roundRect(-9, -58, 18, 16, 3);
    ctx.fill();

    // Head & Hair
    ctx.fillStyle = '#fef08a'; // Golden blonde hair volume
    ctx.beginPath();
    ctx.arc(0, -66, 15, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -65, 11, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(-4, -66, 2, 0, Math.PI * 2);
    ctx.arc(4, -66, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -62, 3.5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Royal Tiara with Ruby
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-10, -75);
    ctx.lineTo(-5, -72);
    ctx.lineTo(0, -82);
    ctx.lineTo(5, -72);
    ctx.lineTo(10, -75);
    ctx.lineTo(8, -71);
    ctx.lineTo(-8, -71);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444'; // Ruby gem
    ctx.beginPath();
    ctx.arc(0, -74, 2, 0, Math.PI * 2);
    ctx.fill();

    // Arms waving / cheering
    const armWave = this.isRescued ? Math.sin(this.cheerTimer) * 0.45 : 0.15;
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    if (this.isRescued) {
      ctx.lineTo(-20, -72 + armWave * 15);
    } else {
      ctx.lineTo(-15, -42);
    }
    ctx.stroke();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(8, -52);
    if (this.isRescued) {
      ctx.lineTo(20, -72 - armWave * 15);
    } else {
      ctx.lineTo(15, -42);
    }
    ctx.stroke();

    ctx.restore(); // restore jump

    // CURSED IRON CAGE (Drawn on top if not destroyed)
    if (!this.isRescued) {
      const cageW = 76;
      const cageH = 105;

      // Cage bars
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.strokeRect(-cageW / 2, -cageH, cageW, cageH);

      // Vertical bars
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      for (let bx = -cageW / 2 + 12; bx <= cageW / 2 - 12; bx += 13) {
        ctx.beginPath();
        ctx.moveTo(bx, -cageH);
        ctx.lineTo(bx, -12);
        ctx.stroke();
      }

      // Dome top
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -cageH, cageW / 2, Math.PI, 0);
      ctx.stroke();

      // Cursed Glowing Lock Crystal
      const pulse = 0.8 + Math.sin(this.cheerTimer * 2) * 0.2;
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -56);
      ctx.lineTo(10, -44);
      ctx.lineTo(0, -32);
      ctx.lineTo(-10, -44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cage Health Bar overhead
      const barW = 80;
      const barH = 7;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-barW / 2, -cageH - 24, barW, barH);
      ctx.fillStyle = '#a855f7';
      const hpRatio = Math.max(0, cageHp / maxCageHp);
      ctx.fillRect(-barW / 2, -cageH - 24, barW * hpRatio, barH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, -cageH - 24, barW, barH);
    }

    // Heart particles
    for (const p of this.heartParticles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.font = '16px serif';
      ctx.fillText('❤️', p.x - this.x, p.y - this.y);
    }

    ctx.restore();
  }
}
