import { Excavator2D } from './Excavator2D';
import { Princess2D } from './Princess2D';
import { LEVELS_2D, LevelConfig2D, Obstacle2D } from './constants';
import { sound } from '../audio/SoundEffects';
import confetti from 'canvas-confetti';

export interface GameStatus2D {
  level: number;
  levelConfig: LevelConfig2D;
  score: number;
  combo: number;
  speed: number;
  progressPercent: number;
  bucketLoad: number; // 0 to 100%
  gameState: 'START' | 'PLAYING' | 'LEVEL_CLEAR' | 'VICTORY' | 'GAMEOVER';
  targetObstacleHp: { current: number; max: number; name: string } | null;
}

interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'sand' | 'spark' | 'smoke';
}

export class GameEngine2D {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private animFrameId: number = 0;
  private lastTime: number = 0;

  // Camera & view
  public cameraX: number = 0;
  public viewWidth: number = 1200;
  public viewHeight: number = 700;
  public groundY: number = 540;

  // Game actors
  public excavator: Excavator2D;
  public princess: Princess2D | null = null;
  public obstacles: Obstacle2D[] = [];
  public particles: Particle2D[] = [];

  // Active level state
  public currentLevelIndex: number = 0;
  public levelConfig: LevelConfig2D = LEVELS_2D[0];
  public score: number = 0;
  public combo: number = 1;
  public comboTimer: number = 0;
  public gameState: 'START' | 'PLAYING' | 'LEVEL_CLEAR' | 'VICTORY' | 'GAMEOVER' = 'START';

  // Input state
  public keys: { [key: string]: boolean } = {};
  public onUpdateStatus?: (status: GameStatus2D) => void;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full block';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    this.excavator = new Excavator2D(160, this.groundY);

    this.handleResize();
    this.setupListeners();
    this.loadLevel(0);
    this.startLoop();
  }

  private handleResize = () => {
    if (!this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.viewWidth = rect.width;
    this.viewHeight = rect.height;
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.groundY = Math.max(380, this.viewHeight - 120);
    this.excavator.y = this.groundY;
  };

  private setupListeners() {
    window.addEventListener('resize', this.handleResize);

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e' || e.code === 'Space') {
        e.preventDefault();
        this.triggerDig();
      }
      if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        this.triggerDump();
      }
      sound.startEngine();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public loadLevel(levelIndex: number) {
    this.currentLevelIndex = levelIndex;
    this.levelConfig = LEVELS_2D[levelIndex] || LEVELS_2D[0];

    // Reset player position and bucket load
    this.excavator.x = 180;
    this.excavator.vx = 0;
    this.excavator.sandLoad = 0;
    this.cameraX = 0;
    this.particles = [];
    this.gameState = 'PLAYING';

    // Generate Sand Mountains along worldWidth (no round balls!)
    this.obstacles = [];
    const worldW = this.levelConfig.worldWidth;
    let obsId = 1;

    for (let x = 500; x < worldW - 450; x += 440) {
      if (x % 1400 < 450 && x > 800) {
        // Fortified Stone / Iron Sand Rampart
        const hp = this.levelConfig.dangerLevel * 6;
        this.obstacles.push({
          id: obsId++,
          x: x,
          y: this.groundY - 130,
          width: 80,
          height: 130,
          type: 'iron_gate',
          maxHp: hp,
          hp: hp,
          sandVolume: 100,
          destroyed: false,
          scoreValue: 600 * this.levelConfig.dangerLevel,
          name: this.levelConfig.theme === 'citadel' ? 'Karanlık Kale Kapısı' : 'Demir Barikat',
          color: '#1e293b',
        });
      } else {
        // Sand Mountain (Kum Dağı)
        const mountainW = 160 + Math.random() * 80;
        const mountainH = 85 + Math.random() * 45;
        const hp = 4; // requires 4 full scoops with 'E'
        this.obstacles.push({
          id: obsId++,
          x: x,
          y: this.groundY - mountainH,
          width: mountainW,
          height: mountainH,
          type: 'sand_mountain',
          maxHp: hp,
          hp: hp,
          sandVolume: 100,
          destroyed: false,
          scoreValue: hp * 80,
          name: this.levelConfig.theme === 'magma' ? 'Volkanik Kül Dağı' : 'Kanyon Kum Dağı',
          color: this.levelConfig.theme === 'magma' ? '#7f1d1d' : '#d97706',
        });
      }
    }

    // Level 3 Princess Cage buried under the Grand Golden Sand Mountain!
    if (this.levelConfig.princessAtEnd) {
      const cageX = worldW - 260;
      this.princess = new Princess2D(cageX, this.groundY);

      // Massive sand mountain covering the cage
      this.obstacles.push({
        id: 9999,
        x: cageX - 90,
        y: this.groundY - 140,
        width: 180,
        height: 140,
        type: 'sand_mountain',
        maxHp: 8,
        hp: 8,
        sandVolume: 100,
        destroyed: false,
        scoreValue: 4000,
        name: 'Prensesi Saklayan Büyülü Kum Dağı',
        color: '#f59e0b',
      });
    } else {
      this.princess = null;
    }

    sound.startEngine();
  }

  public nextLevel() {
    if (this.currentLevelIndex < LEVELS_2D.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      this.loadLevel(0);
    }
  }

  /**
   * 'E' KEY: DIG / SCOOP SAND INTO BUCKET
   */
  public triggerDig() {
    if (this.gameState !== 'PLAYING') return;
    this.excavator.triggerDig();

    // Check if near any Sand Mountain or obstacle
    const bx = this.excavator.bucketTipX;
    const by = this.excavator.bucketTipY;

    for (const obs of this.obstacles) {
      if (obs.destroyed) continue;

      const inRangeX = bx >= obs.x - 30 && bx <= obs.x + obs.width + 30;
      const inRangeY = by >= obs.y - 30 && by <= this.groundY + 20;

      if (inRangeX && inRangeY) {
        obs.hp -= 1;
        if (obs.sandVolume !== undefined) {
          obs.sandVolume = Math.max(0, (obs.hp / obs.maxHp) * 100);
        }

        // Fill excavator bucket with sand!
        this.excavator.sandLoad = 100;
        this.score += 75 * this.combo;
        this.comboTimer = 3.5;
        this.combo = Math.min(8, this.combo + 1);

        sound.playSandDig();
        this.spawnSandDebris(bx, by, 18, obs.color || '#f59e0b');

        // If sand mountain is fully excavated
        if (obs.hp <= 0) {
          obs.destroyed = true;
          this.score += obs.scoreValue;
          this.spawnSandDebris(obs.x + obs.width / 2, this.groundY - 30, 32, obs.color || '#f59e0b');

          // PRINCESS RESCUED TRIGGER IF FINAL MOUNTAIN CLEARED!
          if (obs.id === 9999 && this.princess) {
            this.princess.breakCage();
            this.triggerVictory();
          }
        }
        break;
      }
    }
  }

  /**
   * 'Q' KEY: DUMP SAND FROM BUCKET ONTO GROUND
   */
  public triggerDump() {
    if (this.gameState !== 'PLAYING') return;

    if (this.excavator.sandLoad > 0) {
      this.excavator.triggerDump();
      sound.playSandDump();

      // Spawn falling sand stream particles from bucket
      const bx = this.excavator.bucketTipX;
      const by = this.excavator.bucketTipY;
      this.spawnCascadingSand(bx, by, 24);

      this.score += 50; // Points for proper dumping!
    } else {
      // Just shake/dump empty bucket
      this.excavator.triggerDump();
      sound.playHydraulicHiss();
    }
  }

  public spawnSandDebris(x: number, y: number, count: number = 14, color: string = '#f59e0b') {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() * Math.PI); // upward arc
      const speed = 90 + Math.random() * 210;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        size: 3 + Math.random() * 6,
        life: 0,
        maxLife: 1.1 + Math.random() * 0.5,
        color,
        type: 'sand',
      });
    }
  }

  public spawnCascadingSand(x: number, y: number, count: number = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 40,
        vy: 40 + Math.random() * 120, // downward pour
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 6,
        size: 3 + Math.random() * 5,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.4,
        color: '#f59e0b',
        type: 'sand',
      });
    }
  }

  public spawnExhaustPuff(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: -40 - Math.random() * 30,
      vy: -50 - Math.random() * 40,
      rot: 0,
      vRot: 0,
      size: 8,
      life: 0,
      maxLife: 0.8,
      color: 'rgba(75, 85, 99, 0.45)',
      type: 'smoke',
    });
  }

  private update(delta: number) {
    if (this.gameState !== 'PLAYING') {
      if (this.princess) this.princess.update(delta);
      return;
    }

    // Driving inputs
    let inputDir = 0;
    if (this.keys['d'] || this.keys['arrowright']) inputDir += 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputDir -= 1;

    // Arm manual adjustments (W / S)
    if (this.keys['w'] || this.keys['arrowup']) {
      this.excavator.boomAngle = Math.max(-1.1, this.excavator.boomAngle - 1.2 * delta);
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.excavator.boomAngle = Math.min(0.2, this.excavator.boomAngle + 1.2 * delta);
    }

    // Update excavator rig
    this.excavator.update(delta, inputDir, this.groundY);
    this.excavator.x = Math.max(80, Math.min(this.levelConfig.worldWidth - 100, this.excavator.x));

    // Exhaust smoke puffs
    if (Math.abs(this.excavator.vx) > 10 && Math.random() < 0.35) {
      this.spawnExhaustPuff(this.excavator.x - 45, this.excavator.y - 94);
    }

    // Sound modulation
    sound.updateEngine(Math.abs(this.excavator.vx) / this.excavator.maxSpeed, this.excavator.actionState === 'digging');

    // Sand Mountain & Obstacle Obstruction (cannot drive through until dug away!)
    let nearestObstacleHp: { current: number; max: number; name: string } | null = null;
    let closestDist = Infinity;

    for (const obs of this.obstacles) {
      if (obs.destroyed) continue;

      const obsCenterX = obs.x + obs.width / 2;
      const dist = Math.abs(this.excavator.x - obsCenterX);

      if (dist < closestDist && dist < 380) {
        closestDist = dist;
        nearestObstacleHp = {
          current: obs.hp,
          max: obs.maxHp,
          name: obs.name,
        };
      }

      // Block driving if sand mountain or gate is too high (has > 0 HP)
      const chassisRight = this.excavator.x + 65;
      if (chassisRight > obs.x + 15 && chassisRight < obs.x + obs.width && this.excavator.vx > 0) {
        this.excavator.x = obs.x + 15 - 65;
        this.excavator.vx = 0;
      }
    }

    // Princess update
    if (this.princess) {
      this.princess.update(delta);
    }

    // Check level clear (Level 1 & 2 reach goal)
    if (this.gameState === 'PLAYING' && !this.levelConfig.princessAtEnd) {
      if (this.excavator.x >= this.levelConfig.worldWidth - 300) {
        this.triggerLevelClear();
      }
    }

    // Update Particles
    const gravity = 620;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;

      if (p.type === 'sand') {
        p.vy += gravity * delta;
        p.rot += p.vRot * delta;
        // Settle on ground
        if (p.y > this.groundY - 2) {
          p.y = this.groundY - 2;
          p.vy = -p.vy * 0.25;
          p.vx *= 0.6;
        }
      } else if (p.type === 'smoke') {
        p.size += delta * 25;
      }
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    // Smooth Camera tracking
    const targetCamX = this.excavator.x - this.viewWidth * 0.35;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1.0, 7.0 * delta);
    this.cameraX = Math.max(0, Math.min(this.levelConfig.worldWidth - this.viewWidth, this.cameraX));

    // Send update to React HUD
    if (this.onUpdateStatus) {
      const progress = Math.min(100, Math.floor((this.excavator.x / this.levelConfig.worldWidth) * 100));
      this.onUpdateStatus({
        level: this.currentLevelIndex + 1,
        levelConfig: this.levelConfig,
        score: this.score,
        combo: this.combo,
        speed: Math.abs(Math.round((this.excavator.vx / this.excavator.maxSpeed) * 32)),
        progressPercent: progress,
        bucketLoad: Math.round(this.excavator.sandLoad),
        gameState: this.gameState,
        targetObstacleHp: nearestObstacleHp,
      });
    }
  }

  private triggerLevelClear() {
    this.gameState = 'LEVEL_CLEAR';
    sound.playVictoryFanfare();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
  }

  private triggerVictory() {
    this.gameState = 'VICTORY';
    sound.playVictoryFanfare();

    const end = Date.now() + 4 * 1000;
    const colors = ['#facc15', '#ec4899', '#38bdf8', '#ffffff'];

    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end && this.gameState === 'VICTORY') {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    // 1. SKY GRADIENT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, this.levelConfig.skyGradient[0]);
    skyGrad.addColorStop(1, this.levelConfig.skyGradient[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

    // Sun / Moon / Celestial Orb
    ctx.fillStyle = this.levelConfig.theme === 'magma' ? '#ef4444' : (this.levelConfig.theme === 'citadel' ? '#cbd5e1' : '#fef08a');
    ctx.beginPath();
    ctx.arc(this.viewWidth * 0.75, 110, 48, 0, Math.PI * 2);
    ctx.fill();

    // 2. PARALLAX DISTANT MOUNTAINS
    ctx.save();
    ctx.translate(-this.cameraX * 0.15, 0);
    ctx.fillStyle = this.levelConfig.mountainColor;
    ctx.beginPath();
    ctx.moveTo(-100, this.groundY);
    for (let mx = -100; mx < this.levelConfig.worldWidth + 800; mx += 280) {
      const peakH = 180 + Math.sin(mx * 0.005) * 80;
      ctx.lineTo(mx + 140, this.groundY - peakH);
      ctx.lineTo(mx + 280, this.groundY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. PARALLAX MID-GROUND HILLS
    ctx.save();
    ctx.translate(-this.cameraX * 0.45, 0);
    ctx.fillStyle = this.levelConfig.theme === 'magma' ? '#450a0a' : (this.levelConfig.theme === 'citadel' ? '#1e1b4b' : '#b45309');
    ctx.beginPath();
    ctx.moveTo(-100, this.groundY);
    for (let cx = -100; cx < this.levelConfig.worldWidth + 800; cx += 180) {
      const cliffH = 90 + Math.cos(cx * 0.01) * 45;
      ctx.lineTo(cx + 90, this.groundY - cliffH);
      ctx.lineTo(cx + 180, this.groundY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. MAIN FOREGROUND WORLD
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Ground Road
    ctx.fillStyle = this.levelConfig.groundColor;
    ctx.fillRect(0, this.groundY, this.levelConfig.worldWidth, this.viewHeight - this.groundY + 100);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, this.groundY - 4, this.levelConfig.worldWidth, 6);

    // Checkpoint Gate banner at level end
    const finishX = this.levelConfig.worldWidth - 280;
    if (!this.levelConfig.princessAtEnd) {
      ctx.fillStyle = '#efb008';
      ctx.fillRect(finishX, this.groundY - 160, 18, 160);
      ctx.fillRect(finishX + 160, this.groundY - 160, 18, 160);
      ctx.fillRect(finishX, this.groundY - 160, 178, 40);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🏁 KONTROL NOKTASI', finishX + 8, this.groundY - 134);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fillRect(finishX, this.groundY - 4, 180, 8);
    }

    // DRAW OBSTACLES: REALISTIC DYNAMIC SAND MOUNTAINS (KUM DAĞLARI)
    for (const obs of this.obstacles) {
      if (obs.destroyed) continue;

      if (obs.type === 'sand_mountain') {
        // Height shrinks based on remaining HP / volume!
        const currentH = (obs.hp / obs.maxHp) * obs.height;
        const topY = this.groundY - currentH;

        // Sand Mountain Mound Gradient
        const sandGrad = ctx.createLinearGradient(0, topY, 0, this.groundY);
        sandGrad.addColorStop(0, '#f59e0b'); // light golden crest
        sandGrad.addColorStop(0.4, '#d97706'); // warm sand
        sandGrad.addColorStop(1, '#92400e'); // compact earth base

        ctx.fillStyle = sandGrad;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(obs.x, this.groundY);
        // Smooth curved sand dune shape
        ctx.quadraticCurveTo(obs.x + obs.width * 0.2, topY + currentH * 0.25, obs.x + obs.width * 0.5, topY);
        ctx.quadraticCurveTo(obs.x + obs.width * 0.8, topY + currentH * 0.25, obs.x + obs.width, this.groundY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sand texture granules & streaks
        ctx.fillStyle = '#b45309';
        for (let i = 0; i < 8; i++) {
          const gx = obs.x + obs.width * (0.2 + i * 0.08);
          const gy = topY + currentH * (0.4 + (i % 3) * 0.15);
          ctx.beginPath();
          ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sand Mountain Health / Volume Label
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x + obs.width * 0.2, topY - 20, obs.width * 0.6, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(obs.x + obs.width * 0.2, topY - 20, (obs.width * 0.6) * (obs.hp / obs.maxHp), 6);
      } else if (obs.type === 'iron_gate') {
        // Heavy Spiked Blast Gate
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        ctx.fillStyle = '#94a3b8';
        for (let gy = obs.y + 16; gy < obs.y + obs.height - 10; gy += 24) {
          ctx.beginPath();
          ctx.arc(obs.x + 12, gy, 4, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width - 12, gy, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // HP bar
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x, obs.y - 14, obs.width, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x, obs.y - 14, obs.width * (obs.hp / obs.maxHp), 6);
      }
    }

    // Draw Princess at Level 3
    if (this.princess) {
      const cageMountain = this.obstacles.find((o) => o.id === 9999);
      this.princess.draw(ctx, cageMountain ? cageMountain.hp : 0, cageMountain ? cageMountain.maxHp : 8);
    }

    // Draw 2D Excavator
    this.excavator.draw(ctx);

    // Draw Particles (Sand debris, sparks, smoke)
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'sand') {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        const alpha = Math.max(0, 0.45 * (1 - p.life / p.maxLife));
        ctx.fillStyle = `rgba(100, 116, 139, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private startLoop() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.update(delta);
      this.draw();
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
  }
}
