/**
 * 2D Articulated Procedural Excavator Rig for HTML5 Canvas.
 * Features rotating track rollers, dynamic hydraulic pistons,
 * bucket sand load rendering, and dedicated 'E' (Dig/Scoop) & 'Q' (Dump) actions.
 */

export class Excavator2D {
  // Vehicle physics position
  public x: number = 180;
  public y: number = 0;
  public vx: number = 0;
  public maxSpeed: number = 280; // px/sec
  public acceleration: number = 420;
  public friction: number = 0.88;

  // Track animation
  public trackWheelRot: number = 0;

  // Kinematic arm angles (radians)
  public boomAngle: number = -0.55; // baseline resting angle
  public stickAngle: number = 1.25;
  public bucketAngle: number = -0.65;

  // Bucket sand load: 0 to 100%
  public sandLoad: number = 0;

  // Action states: 'idle' | 'digging' | 'dumping'
  public actionState: 'idle' | 'digging' | 'dumping' = 'idle';
  private actionTimer: number = 0;

  // Tip coordinate for sand excavation detection
  public bucketTipX: number = 0;
  public bucketTipY: number = 0;

  // Rig dimensions
  public chassisWidth: number = 140;
  public chassisHeight: number = 44;
  public boomLength: number = 110;
  public stickLength: number = 90;
  public bucketRadius: number = 32;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public update(delta: number, inputDir: number, groundY: number) {
    // Movement physics
    if (inputDir !== 0) {
      this.vx += inputDir * this.acceleration * delta;
      this.vx = Math.max(-this.maxSpeed * 0.6, Math.min(this.maxSpeed, this.vx));
    } else {
      this.vx *= Math.pow(this.friction, delta * 60);
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    this.x += this.vx * delta;
    this.y = groundY;

    // Track rollers rotation
    this.trackWheelRot += (this.vx * delta * 0.12);

    // KINEMATIC ACTIONS
    if (this.actionState === 'digging') {
      // 'E' KEY DIG / SCOOP CYCLE
      this.actionTimer += delta * 4.2;
      if (this.actionTimer < 1.0) {
        // 1. Lower boom and reach forward
        const p = this.actionTimer;
        this.boomAngle = -0.55 + p * 0.45; // lower down
        this.stickAngle = 1.25 + p * 0.4; // reach out
        this.bucketAngle = -0.65 + p * 0.25; // open teeth
      } else if (this.actionTimer < 2.0) {
        // 2. Power scoop through sand
        const p = this.actionTimer - 1.0;
        this.boomAngle = -0.1 - p * 0.35; // lifting up
        this.stickAngle = 1.65 - p * 0.55; // curl inward
        this.bucketAngle = -0.4 - p * 1.1; // curl bucket to trap sand
      } else if (this.actionTimer < 2.6) {
        // 3. Return to carry pose
        const p = (this.actionTimer - 2.0) / 0.6;
        this.boomAngle = -0.45 - p * 0.1;
        this.stickAngle = 1.1 + p * 0.15;
        this.bucketAngle = -1.5 + p * 0.85;
      } else {
        this.actionState = 'idle';
        this.actionTimer = 0;
        this.boomAngle = -0.55;
        this.stickAngle = 1.25;
        this.bucketAngle = -0.65;
      }
    } else if (this.actionState === 'dumping') {
      // 'Q' KEY DUMP CYCLE
      this.actionTimer += delta * 4.8;
      if (this.actionTimer < 1.0) {
        // 1. Raise boom high and tilt bucket downwards completely
        const p = this.actionTimer;
        this.boomAngle = -0.55 - p * 0.35; // raise high
        this.stickAngle = 1.25 - p * 0.2;
        this.bucketAngle = -0.65 + p * 1.6; // tilt downward to dump!
      } else if (this.actionTimer < 2.0) {
        // 2. Shake bucket to empty all sand
        const p = this.actionTimer - 1.0;
        const shake = Math.sin(p * Math.PI * 4) * 0.1;
        this.bucketAngle = 0.95 + shake;
        this.sandLoad = Math.max(0, this.sandLoad - delta * 220); // drain load
      } else if (this.actionTimer < 2.6) {
        // 3. Return smoothly to carry pose
        const p = (this.actionTimer - 2.0) / 0.6;
        this.sandLoad = 0;
        this.boomAngle = -0.9 + p * 0.35;
        this.stickAngle = 1.05 + p * 0.2;
        this.bucketAngle = 0.95 - p * 1.6;
      } else {
        this.actionState = 'idle';
        this.actionTimer = 0;
        this.sandLoad = 0;
        this.boomAngle = -0.55;
        this.stickAngle = 1.25;
        this.bucketAngle = -0.65;
      }
    }

    // Calculate exact bucket tip position
    const boomPivotX = this.x + 36;
    const boomPivotY = this.y - 48;

    const stickPivotX = boomPivotX + Math.cos(this.boomAngle) * this.boomLength;
    const stickPivotY = boomPivotY + Math.sin(this.boomAngle) * this.boomLength;

    const currentStickAngle = this.boomAngle + this.stickAngle;
    const bucketPivotX = stickPivotX + Math.cos(currentStickAngle) * this.stickLength;
    const bucketPivotY = stickPivotY + Math.sin(currentStickAngle) * this.stickLength;

    const currentBucketAngle = currentStickAngle + this.bucketAngle;
    this.bucketTipX = bucketPivotX + Math.cos(currentBucketAngle) * (this.bucketRadius * 1.3);
    this.bucketTipY = bucketPivotY + Math.sin(currentBucketAngle) * (this.bucketRadius * 1.3);
  }

  public triggerDig() {
    if (this.actionState !== 'idle') return;
    this.actionState = 'digging';
    this.actionTimer = 0;
  }

  public triggerDump() {
    if (this.actionState !== 'idle') return;
    this.actionState = 'dumping';
    this.actionTimer = 0;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. CATERPILLAR TRACKS & WHEELS (BOTTOM)
    const trackY = this.y - 18;
    const trackWidth = 145;
    const trackHeight = 32;

    // Track outer tread loop
    ctx.fillStyle = '#1c1b18';
    ctx.strokeStyle = '#2b2a26';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(this.x - trackWidth / 2, trackY - trackHeight / 2, trackWidth, trackHeight, 16);
    ctx.fill();
    ctx.stroke();

    // Tread cleats
    ctx.fillStyle = '#3a3832';
    for (let tx = this.x - trackWidth / 2 + 10; tx <= this.x + trackWidth / 2 - 10; tx += 14) {
      ctx.fillRect(tx, trackY - trackHeight / 2 - 2, 6, 4);
      ctx.fillRect(tx, trackY + trackHeight / 2 - 2, 6, 4);
    }

    // 5 Rotating Road Rollers
    ctx.fillStyle = '#111112';
    ctx.strokeStyle = '#efb008';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const rx = this.x + i * 26;
      ctx.beginPath();
      ctx.arc(rx, trackY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(rx, trackY);
      ctx.rotate(this.trackWheelRot);
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.restore();
    }

    // Slew ring deck
    ctx.fillStyle = '#222226';
    ctx.fillRect(this.x - 30, this.y - 36, 60, 6);

    // 2. CHASSIS / UPPER DECK
    const chassisX = this.x - 65;
    const chassisY = this.y - 66;

    // Main yellow body
    ctx.fillStyle = '#efb008';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(chassisX, chassisY, 120, 30, [4, 8, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Rear counterweight
    ctx.fillStyle = '#1e2430';
    ctx.beginPath();
    ctx.roundRect(chassisX, chassisY - 6, 38, 36, [6, 0, 0, 4]);
    ctx.fill();
    ctx.stroke();

    // Radiator vents
    ctx.fillStyle = '#111827';
    for (let vx = chassisX + 44; vx <= chassisX + 72; vx += 7) {
      ctx.fillRect(vx, chassisY + 6, 4, 16);
    }

    // Chrome diesel exhaust pipe
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(chassisX + 16, chassisY - 24, 7, 24);
    ctx.fillStyle = '#475569';
    ctx.fillRect(chassisX + 14, chassisY - 27, 11, 4);

    // OPERATOR CABIN
    const cabX = this.x + 8;
    const cabY = chassisY - 36;
    const cabW = 44;
    const cabH = 36;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#efb008';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cabX, cabY, cabW, cabH, [8, 8, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Window
    ctx.fillStyle = 'rgba(125, 211, 252, 0.65)';
    ctx.beginPath();
    ctx.roundRect(cabX + 6, cabY + 6, cabW - 12, cabH - 12, 4);
    ctx.fill();

    // Operator silhouette inside
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cabX + 20, cabY + 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cabX + 14, cabY + 22, 12, 10);

    // Headlight
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cabX + cabW - 2, cabY + cabH - 14, 5, 8);

    // Light beam
    const grad = ctx.createLinearGradient(cabX + cabW, cabY + cabH - 10, cabX + cabW + 220, cabY + cabH + 40);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cabX + cabW, cabY + cabH - 12);
    ctx.lineTo(cabX + cabW + 240, cabY + cabH - 40);
    ctx.lineTo(cabX + cabW + 240, cabY + cabH + 70);
    ctx.closePath();
    ctx.fill();

    // 3. ARTICULATED HYDRAULIC ARM
    const boomPivotX = this.x + 36;
    const boomPivotY = this.y - 48;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(boomPivotX, boomPivotY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(boomPivotX, boomPivotY);
    ctx.rotate(this.boomAngle);

    // Boom Beam
    ctx.fillStyle = '#efb008';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(this.boomLength * 0.4, -14);
    ctx.lineTo(this.boomLength, -6);
    ctx.lineTo(this.boomLength, 6);
    ctx.lineTo(this.boomLength * 0.4, 12);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boom hydraulic cylinder
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(10, 8, 48, 8);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(58, 10, 36, 4);

    // STICK PIVOT
    ctx.translate(this.boomLength, 0);
    ctx.rotate(this.stickAngle);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Stick Beam
    ctx.fillStyle = '#efb008';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -7);
    ctx.lineTo(this.stickLength, -5);
    ctx.lineTo(this.stickLength, 5);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stick cylinder
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(8, -12, 38, 7);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(46, -10, 28, 3);

    // BUCKET PIVOT
    ctx.translate(this.stickLength, 0);
    ctx.rotate(this.bucketAngle);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // VISUAL SAND LOAD IN THE BUCKET (Heaped golden sand)
    if (this.sandLoad > 0) {
      const loadRatio = this.sandLoad / 100;
      ctx.fillStyle = '#f59e0b'; // golden sand
      ctx.beginPath();
      ctx.arc(0, 0, this.bucketRadius * 0.85 * loadRatio, -Math.PI * 0.4, Math.PI * 0.5, false);
      ctx.lineTo(12 * loadRatio, -10 * loadRatio);
      ctx.closePath();
      ctx.fill();

      // Sand granules
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(4 * loadRatio, 2 * loadRatio, 3, 0, Math.PI * 2);
      ctx.arc(10 * loadRatio, -4 * loadRatio, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // BUCKET SHELL
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.bucketRadius, -Math.PI * 0.5, Math.PI * 0.65, false);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5 HARDENED STEEL TEETH
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let t = -2; t <= 2; t++) {
      const toothAngle = Math.PI * 0.65 + t * 0.12;
      const tx = Math.cos(toothAngle) * this.bucketRadius;
      const ty = Math.sin(toothAngle) * this.bucketRadius;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(toothAngle) * 16, ty + Math.sin(toothAngle) * 16);
      ctx.lineTo(tx + Math.cos(toothAngle + 0.1) * 8, ty + Math.sin(toothAngle + 0.1) * 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}
