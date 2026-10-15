/**
 * Generates a 100% standalone single-file 2D HTML/CSS/JS version of the Excavator game.
 * Features Sand Mountains, 'E' key to Dig & Scoop, 'Q' key to Dump sand,
 * and Level 3 Princess rescue beneath the Enchanted Sand Mountain.
 * Requires zero compilation tools, zero npm, zero external dependencies.
 */

export function downloadStandalone2DGame() {
  const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Ekskavatör Kahramanı: Kum Dağı & Prensesi Kurtar 2D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: system-ui, -apple-system, sans-serif; color: #fff; user-select: none; }
    #canvas { width: 100%; height: 100%; display: block; }
    
    .top-bar {
      position: absolute; top: 16px; left: 16px; right: 16px; z-index: 10;
      display: flex; justify-content: space-between; align-items: flex-start;
      pointer-events: none;
    }
    .badge {
      background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 10px 18px; border-radius: 8px; pointer-events: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }
    .title { font-size: 15px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; }
    .subtitle { font-size: 12px; color: #cbd5e1; margin-top: 2px; }
    
    .stats-card {
      display: flex; gap: 14px; background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 8px;
      pointer-events: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }
    .stat-item { text-align: center; }
    .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    .stat-value { font-size: 17px; font-weight: 800; color: #fff; }
    .stat-value.gold { color: #facc15; }
    
    .target-bar {
      position: absolute; top: 82px; left: 50%; transform: translateX(-50%);
      z-index: 10; width: 320px; max-width: 90vw; background: rgba(15, 23, 42, 0.94);
      border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 8px 12px;
      display: none; box-shadow: 0 4px 14px rgba(0,0,0,0.6); pointer-events: none;
    }
    .target-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 4px; }
    .progress-track { width: 100%; height: 8px; background: #331515; border-radius: 4px; overflow: hidden; }
    .progress-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #b45309, #f59e0b); transition: width 0.15s ease; }

    .bottom-dock {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 14px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7); max-width: 95vw;
    }
    .btn {
      background: #1e293b; border: 1px solid rgba(255,255,255,0.2); color: #fff;
      padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all 0.15s ease; user-select: none;
    }
    .btn:hover { background: #334155; border-color: rgba(255,255,255,0.4); }
    .btn:active { transform: scale(0.96); }
    
    .btn-dig {
      background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
      border: 1px solid #facc15; font-size: 14px; font-weight: 900; padding: 12px 22px;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
    }
    .btn-dump {
      background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff;
      border: 1px solid #38bdf8; font-size: 14px; font-weight: 900; padding: 12px 22px;
      box-shadow: 0 0 16px rgba(14, 165, 233, 0.4);
    }

    .touch-controls {
      position: absolute; bottom: 90px; left: 20px; right: 20px; z-index: 9;
      display: flex; justify-content: space-between; pointer-events: none;
    }
    .touch-btn {
      width: 58px; height: 58px; border-radius: 12px; background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 22px;
      display: flex; align-items: center; justify-content: center; pointer-events: auto;
      user-select: none; touch-action: manipulation;
    }

    .modal-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
      background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center;
    }
    .modal-box {
      background: #0f172a; border: 2px solid #f59e0b; border-radius: 14px;
      padding: 32px; max-width: 480px; width: 90%; text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.8);
    }
    .modal-title { font-size: 26px; font-weight: 900; color: #f59e0b; margin-bottom: 8px; }
    .modal-desc { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <div class="top-bar">
    <div class="badge">
      <div class="title" id="hud-level-title">Bölüm 1: Taş Kanyonu (2D)</div>
      <div class="subtitle" id="hud-level-desc">Kum dağlarını kaz (E) ve kumu boşalt (Q)!</div>
    </div>
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-label">Skor</div>
        <div class="stat-value gold" id="hud-score">0</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Hız</div>
        <div class="stat-value" id="hud-speed">0 <span style="font-size:10px;">KM/S</span></div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Kepçe Kumu</div>
        <div class="stat-value gold" id="hud-load">%0</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">İlerleme</div>
        <div class="stat-value" id="hud-progress">%0</div>
      </div>
    </div>
  </div>

  <div class="target-bar" id="target-bar">
    <div class="target-header">
      <span id="target-name">Kum Dağı</span>
      <span id="target-hp-text">4 / 4 Kalan Kum</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" id="target-hp-fill"></div>
    </div>
  </div>

  <div class="bottom-dock">
    <button class="btn btn-dig" id="btn-dig">KUMU KAZ (E TUŞU)</button>
    <button class="btn btn-dump" id="btn-dump">KUMU BOŞALT (Q TUŞU)</button>
    <button class="btn" id="btn-sound">🔊 Ses</button>
  </div>

  <div class="touch-controls">
    <div style="display: flex; gap: 10px;">
      <div class="touch-btn" id="t-left">◀</div>
      <div class="touch-btn" id="t-right">▶</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <div class="touch-btn" id="t-up">▲</div>
      <div class="touch-btn" id="t-down">▼</div>
    </div>
  </div>

  <div class="modal-overlay" id="modal" style="display: none;">
    <div class="modal-box">
      <div class="modal-title" id="modal-title">Bölüm Tamamlandı!</div>
      <div class="modal-desc" id="modal-desc">Tebrikler! Kumları kazıp geçidi açtın.</div>
      <button class="btn btn-dig" id="modal-btn" style="width: 100%;">Devam Et</button>
    </div>
  </div>

  <script>
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let engineOsc = null, engineGain = null;
    let isMuted = false;

    function initAudio() {
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (!engineOsc) {
        engineOsc = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.setValueAtTime(38, audioCtx.currentTime);
        engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
      }
    }

    function playDigSound() {
      if (!audioCtx || isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    }

    function playDumpSound() {
      if (!audioCtx || isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.42);
    }

    function playFanfare() {
      if (!audioCtx || isMuted) return;
      const notes = [261.6, 329.6, 392.0, 523.2, 659.2];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.16);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.16 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.16);
        osc.stop(audioCtx.currentTime + idx * 0.16 + 0.35);
      });
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth, height = window.innerHeight;
    let groundY = height - 120;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      groundY = height - 120;
    }
    window.addEventListener('resize', resize);
    resize();

    const LEVELS = [
      { id: 1, title: 'Bölüm 1: Taş Kanyonu (2D)', desc: 'Kum dağlarını kaz ve yolu aç!', length: 4500, sky: ['#f59e0b', '#d97706'], mountain: '#78350f', ground: '#92400e', sandColor: '#d97706' },
      { id: 2, title: 'Bölüm 2: Lav Boğazı (2D)', desc: 'Volkanik kül dağlarını temizle!', length: 5600, sky: ['#450a0a', '#7f1d1d'], mountain: '#260505', ground: '#180404', sandColor: '#7f1d1d' },
      { id: 3, title: 'Bölüm 3: Ejder Kalesi & Prenses Kurtarma (2D)', desc: 'Büyülü kum dağını kaz, prensesi kurtar!', length: 6600, sky: ['#0f172a', '#1e1b4b'], mountain: '#090d16', ground: '#0f172a', sandColor: '#f59e0b', hasPrincess: true }
    ];

    let currentLvl = 0;
    let score = 0;
    let exX = 180, exVx = 0;
    let sandLoad = 0; // 0 to 100%
    let cameraX = 0;
    let boomA = -0.55, stickA = 1.25, bucketA = -0.65;
    let isDigging = false, isDumping = false, animT = 0;
    let obstacles = [];
    let particles = [];
    let isPrincessRescued = false;
    let keys = {};

    function buildLevel(lvlIdx) {
      currentLvl = lvlIdx;
      const cfg = LEVELS[lvlIdx];
      exX = 180;
      exVx = 0;
      sandLoad = 0;
      cameraX = 0;
      obstacles = [];
      particles = [];
      isPrincessRescued = false;

      let obsId = 1;
      for (let x = 500; x < cfg.length - 450; x += 440) {
        if (x % 1400 < 450 && x > 800) {
          const hp = 10;
          obstacles.push({ id: obsId++, x: x, y: groundY - 120, w: 80, h: 120, hp: hp, maxHp: hp, type: 'gate', color: '#1e293b', name: 'Demir Barikat' });
        } else {
          const mW = 160 + Math.random() * 80;
          const mH = 85 + Math.random() * 45;
          const hp = 4;
          obstacles.push({ id: obsId++, x: x, y: groundY - mH, w: mW, h: mH, hp: hp, maxHp: hp, type: 'sand_mountain', color: cfg.sandColor, name: 'Kum Dağı' });
        }
      }

      if (cfg.hasPrincess) {
        const cageX = cfg.length - 260;
        obstacles.push({ id: 9999, x: cageX - 90, y: groundY - 140, w: 180, h: 140, hp: 8, maxHp: 8, type: 'sand_mountain', color: '#f59e0b', name: 'Prensesi Saklayan Kum Dağı' });
      }

      document.getElementById('hud-level-title').innerText = cfg.title;
      document.getElementById('hud-level-desc').innerText = cfg.desc;
    }

    buildLevel(0);

    window.addEventListener('keydown', e => {
      initAudio();
      keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e' || e.code === 'Space') { e.preventDefault(); triggerDig(); }
      if (e.key.toLowerCase() === 'q') { e.preventDefault(); triggerDump(); }
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

    function triggerDig() {
      if (isDigging || isDumping) return;
      isDigging = true;
      animT = 0;

      // Check proximity to Sand Mountain
      const bPivotX = exX + 36, bPivotY = groundY - 48;
      const sPivotX = bPivotX + Math.cos(boomA) * 110, sPivotY = bPivotY + Math.sin(boomA) * 110;
      const cStickA = boomA + stickA;
      const bktPivotX = sPivotX + Math.cos(cStickA) * 90, bktPivotY = sPivotY + Math.sin(cStickA) * 90;
      const tipX = bktPivotX + Math.cos(cStickA + bucketA) * 42;

      for (let obs of obstacles) {
        if (obs.destroyed) continue;
        if (tipX >= obs.x - 40 && tipX <= obs.x + obs.w + 40) {
          obs.hp -= 1;
          sandLoad = 100;
          score += 75;
          playDigSound();
          spawnSandParticles(tipX, groundY - 20, 16);
          if (obs.hp <= 0) {
            obs.destroyed = true;
            score += 300;
            if (obs.id === 9999) {
              isPrincessRescued = true;
              playFanfare();
              document.getElementById('modal-title').innerText = '👑 PRENSESİ KURTARDIN!';
              document.getElementById('modal-desc').innerText = 'Harika iş! Büyülü kum dağını kepçenle kazıp prensesi zindandan kurtardın! Krallığın ebedi kahramanısın!';
              document.getElementById('modal-btn').innerText = 'Baştan Oyna';
              document.getElementById('modal').style.display = 'flex';
            }
          }
          break;
        }
      }
    }

    function triggerDump() {
      if (isDigging || isDumping) return;
      isDumping = true;
      animT = 0;
      if (sandLoad > 0) {
        playDumpSound();
        spawnCascadingSand(exX + 180, groundY - 60, 24);
        score += 50;
      }
    }

    document.getElementById('btn-dig').addEventListener('click', () => { initAudio(); triggerDig(); });
    document.getElementById('btn-dump').addEventListener('click', () => { initAudio(); triggerDump(); });
    document.getElementById('btn-sound').addEventListener('click', () => {
      initAudio();
      isMuted = !isMuted;
      if (engineGain) engineGain.gain.setValueAtTime(isMuted ? 0 : 0.08, audioCtx.currentTime);
      document.getElementById('btn-sound').innerText = isMuted ? '🔇 Sessiz' : '🔊 Ses';
    });

    const bindTouch = (id, k) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', () => { initAudio(); keys[k] = true; });
      el.addEventListener('pointerup', () => keys[k] = false);
      el.addEventListener('pointerleave', () => keys[k] = false);
    };
    bindTouch('t-up', 'w');
    bindTouch('t-down', 's');
    bindTouch('t-left', 'a');
    bindTouch('t-right', 'd');

    document.getElementById('modal-btn').addEventListener('click', () => {
      document.getElementById('modal').style.display = 'none';
      if (currentLvl < LEVELS.length - 1) buildLevel(currentLvl + 1);
      else buildLevel(0);
    });

    function spawnSandParticles(x, y, count) {
      for (let i = 0; i < count; i++) {
        const a = Math.PI + Math.random() * Math.PI;
        const s = 100 + Math.random() * 180;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 3 + Math.random() * 5, life: 0, maxLife: 1.0, color: '#f59e0b' });
      }
    }

    function spawnCascadingSand(x, y, count) {
      for (let i = 0; i < count; i++) {
        particles.push({ x: x + (Math.random() - 0.5) * 16, y, vx: (Math.random() - 0.5) * 30, vy: 50 + Math.random() * 100, size: 3 + Math.random() * 4, life: 0, maxLife: 0.9, color: '#f59e0b' });
      }
    }

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const delta = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      let dir = 0;
      if (keys['d'] || keys['arrowright']) dir += 1;
      if (keys['a'] || keys['arrowleft']) dir -= 1;

      if (dir !== 0) {
        exVx += dir * 420 * delta;
        exVx = Math.max(-180, Math.min(280, exVx));
      } else {
        exVx *= Math.pow(0.88, delta * 60);
      }
      exX += exVx * delta;

      // Digging kinematics ('E')
      if (isDigging) {
        animT += delta * 4.2;
        if (animT < 1.0) {
          boomA = -0.55 + animT * 0.45;
          stickA = 1.25 + animT * 0.4;
          bucketA = -0.65 + animT * 0.25;
        } else if (animT < 2.0) {
          const p = animT - 1.0;
          boomA = -0.1 - p * 0.35;
          stickA = 1.65 - p * 0.55;
          bucketA = -0.4 - p * 1.1;
        } else {
          isDigging = false;
          boomA = -0.55; stickA = 1.25; bucketA = -0.65;
        }
      }

      // Dumping kinematics ('Q')
      if (isDumping) {
        animT += delta * 4.8;
        if (animT < 1.0) {
          boomA = -0.55 - animT * 0.35;
          bucketA = -0.65 + animT * 1.6;
        } else if (animT < 2.0) {
          sandLoad = Math.max(0, sandLoad - delta * 220);
        } else {
          isDumping = false;
          sandLoad = 0;
          boomA = -0.55; bucketA = -0.65;
        }
      }

      // Block driving if sand mountain is not dug down
      let closest = null, closestDist = Infinity;
      obstacles.forEach(obs => {
        if (obs.destroyed) return;
        const dist = Math.abs(exX - (obs.x + obs.w / 2));
        if (dist < closestDist && dist < 350) {
          closestDist = dist;
          closest = obs;
        }
        if (exX + 65 > obs.x + 15 && exX + 65 < obs.x + obs.w && exVx > 0) {
          exX = obs.x + 15 - 65;
          exVx = 0;
        }
      });

      // Target HUD
      const tBar = document.getElementById('target-bar');
      if (closest && !closest.destroyed) {
        tBar.style.display = 'block';
        document.getElementById('target-name').innerText = closest.name;
        document.getElementById('target-hp-text').innerText = closest.hp + ' / ' + closest.maxHp + ' Kalan Kum';
        document.getElementById('target-hp-fill').style.width = ((closest.hp / closest.maxHp) * 100) + '%';
      } else {
        tBar.style.display = 'none';
      }

      const cfg = LEVELS[currentLvl];
      if (!cfg.hasPrincess && exX >= cfg.length - 300) {
        playFanfare();
        document.getElementById('modal-title').innerText = 'Bölüm ' + (currentLvl + 1) + ' Tamamlandı!';
        document.getElementById('modal-desc').innerText = 'Kumları kazıp yolu açtın!';
        document.getElementById('modal-btn').innerText = 'Sonraki Bölüme Geç ➔';
        document.getElementById('modal').style.display = 'flex';
      }

      cameraX += (exX - width * 0.35 - cameraX) * 0.1;
      cameraX = Math.max(0, Math.min(cfg.length - width, cameraX));

      // Particles update
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += delta;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 620 * delta;
      }

      // RENDER
      ctx.clearRect(0, 0, width, height);

      const grad = ctx.createLinearGradient(0, 0, 0, groundY);
      grad.addColorStop(0, cfg.sky[0]);
      grad.addColorStop(1, cfg.sky[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Mountains
      ctx.save();
      ctx.translate(-cameraX * 0.2, 0);
      ctx.fillStyle = cfg.mountain;
      ctx.beginPath();
      ctx.moveTo(-100, groundY);
      for (let mx = -100; mx < cfg.length + 600; mx += 260) {
        ctx.lineTo(mx + 130, groundY - 180);
        ctx.lineTo(mx + 260, groundY);
      }
      ctx.fill();
      ctx.restore();

      // Foreground World
      ctx.save();
      ctx.translate(-cameraX, 0);

      // Ground
      ctx.fillStyle = cfg.ground;
      ctx.fillRect(0, groundY, cfg.length, height - groundY);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, groundY - 4, cfg.length, 6);

      // DYNAMIC SAND MOUNTAINS (KUM DAĞLARI)
      obstacles.forEach(obs => {
        if (obs.destroyed) return;
        if (obs.type === 'sand_mountain') {
          const curH = (obs.hp / obs.maxHp) * obs.h;
          const topY = groundY - curH;
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(obs.x, groundY);
          ctx.quadraticCurveTo(obs.x + obs.w * 0.2, topY + curH * 0.25, obs.x + obs.w * 0.5, topY);
          ctx.quadraticCurveTo(obs.x + obs.w * 0.8, topY + curH * 0.25, obs.x + obs.w, groundY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (obs.type === 'gate') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
      });

      // Princess at Level 3
      if (cfg.hasPrincess) {
        const pX = cfg.length - 260;
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(pX, groundY - 50);
        ctx.lineTo(pX + 22, groundY - 12);
        ctx.lineTo(pX - 22, groundY - 12);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(pX, groundY - 65, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.fillRect(pX - 8, groundY - 78, 16, 6);
      }

      // Excavator
      ctx.fillStyle = '#1c1b18';
      ctx.fillRect(exX - 70, groundY - 32, 140, 28);
      ctx.fillStyle = '#efb008';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(exX + i * 25, groundY - 18, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#efb008';
      ctx.fillRect(exX - 60, groundY - 62, 115, 30);
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(exX - 60, groundY - 66, 35, 34);

      ctx.fillStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.fillRect(exX + 12, groundY - 92, 38, 30);

      // Arm with sand in bucket
      const bPivotX = exX + 36, bPivotY = groundY - 48;
      ctx.save();
      ctx.translate(bPivotX, bPivotY);
      ctx.rotate(boomA);
      ctx.fillStyle = '#efb008';
      ctx.fillRect(0, -7, 110, 14);

      ctx.translate(110, 0);
      ctx.rotate(stickA);
      ctx.fillRect(0, -6, 90, 12);

      ctx.translate(90, 0);
      ctx.rotate(bucketA);

      if (sandLoad > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 24 * (sandLoad / 100), -Math.PI * 0.4, Math.PI * 0.5);
        ctx.fill();
      }

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, 30, -Math.PI * 0.5, Math.PI * 0.65, false);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      ctx.restore();

      document.getElementById('hud-score').innerText = score;
      document.getElementById('hud-speed').innerHTML = Math.abs(Math.round(exVx * 0.1)) + ' <span style="font-size:10px;">KM/S</span>';
      document.getElementById('hud-load').innerText = '%' + Math.round(sandLoad);
      document.getElementById('hud-progress').innerText = '%' + Math.min(100, Math.floor((exX / cfg.length) * 100));
    }

    loop(performance.now());
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ekskavator_oyunu_2d.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
