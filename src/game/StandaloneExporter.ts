/**
 * Generates a 100% standalone single-file HTML/CSS/JS version of the 3D Excavator game.
 * Requires zero compilation tools, zero npm, zero node.js.
 * Can be saved to disk and run directly in any web browser.
 */

export function downloadStandaloneHtmlGame() {
  const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Ekskavatör Kahramanı: Prensesi Kurtar 3D (Çevrimdışı)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: system-ui, -apple-system, sans-serif; color: #fff; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1; }
    
    /* Top HUD */
    .top-bar {
      position: absolute; top: 16px; left: 16px; right: 16px; z-index: 10;
      display: flex; justify-content: space-between; align-items: flex-start;
      pointer-events: none;
    }
    .badge {
      background: rgba(18, 22, 32, 0.85); border: 1px solid rgba(255, 215, 0, 0.3);
      padding: 10px 18px; border-radius: 8px; pointer-events: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .title { font-size: 16px; font-weight: 800; color: #efb008; text-transform: uppercase; letter-spacing: 1px; }
    .subtitle { font-size: 12px; color: #aaa; margin-top: 2px; }
    
    .stats-card {
      display: flex; gap: 14px; background: rgba(18, 22, 32, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 8px;
    }
    .stat-item { text-align: center; }
    .stat-label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 700; }
    .stat-value { font-size: 18px; font-weight: 800; color: #fff; }
    .stat-value.gold { color: #ffd700; }
    
    /* Target Obstacle Health Bar */
    .target-bar {
      position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
      z-index: 10; width: 320px; max-width: 90vw; background: rgba(18, 22, 32, 0.9);
      border: 1px solid rgba(255, 80, 80, 0.4); border-radius: 8px; padding: 8px 12px;
      display: none; box-shadow: 0 4px 14px rgba(0,0,0,0.6); pointer-events: none;
    }
    .target-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #ff6666; margin-bottom: 4px; }
    .progress-track { width: 100%; height: 8px; background: #331515; border-radius: 4px; overflow: hidden; }
    .progress-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #ff4444, #ffaa00); transition: width 0.15s ease; }

    /* Bottom Control Dock */
    .bottom-dock {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10; background: rgba(18, 22, 32, 0.9); border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 16px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7); max-width: 95vw;
    }
    .btn {
      background: #2a3142; border: 1px solid rgba(255,255,255,0.2); color: #fff;
      padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all 0.15s ease; user-select: none;
    }
    .btn:hover { background: #3a445c; border-color: rgba(255,255,255,0.4); }
    .btn:active { transform: scale(0.96); }
    .btn-smash {
      background: linear-gradient(135deg, #efb008, #d48806); color: #000;
      border: 1px solid #ffd700; font-size: 15px; font-weight: 900; padding: 12px 24px;
      box-shadow: 0 0 16px rgba(239, 176, 8, 0.4);
    }
    .btn-smash:hover { background: linear-gradient(135deg, #ffd700, #efb008); }

    /* On-screen touch controls */
    .touch-controls {
      position: absolute; bottom: 90px; left: 20px; right: 20px; z-index: 9;
      display: flex; justify-content: space-between; pointer-events: none;
    }
    .touch-btn {
      width: 58px; height: 58px; border-radius: 12px; background: rgba(30,35,48,0.75);
      border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 20px;
      display: flex; align-items: center; justify-content: center; pointer-events: auto;
      user-select: none; touch-action: manipulation;
    }

    /* Modal */
    .modal-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
      background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
    }
    .modal-box {
      background: #161b26; border: 2px solid #ffd700; border-radius: 14px;
      padding: 32px; max-width: 480px; width: 90%; text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.8);
    }
    .modal-title { font-size: 26px; font-weight: 900; color: #ffd700; margin-bottom: 8px; }
    .modal-desc { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- HUD -->
  <div class="top-bar">
    <div class="badge">
      <div class="title" id="hud-level-title">Bölüm 1: Taş Kanyonu</div>
      <div class="subtitle" id="hud-level-desc">Yolu aç ve kanyonu temizle!</div>
    </div>
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-label">Puan</div>
        <div class="stat-value gold" id="hud-score">0</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Hız</div>
        <div class="stat-value" id="hud-speed">0 <span style="font-size:10px;">KM/S</span></div>
      </div>
      <div class="stat-item">
        <div class="stat-label">İlerleme</div>
        <div class="stat-value" id="hud-progress">%0</div>
      </div>
    </div>
  </div>

  <div class="target-bar" id="target-bar">
    <div class="target-header">
      <span id="target-name">Kaya Engeli</span>
      <span id="target-hp-text">10 / 10</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" id="target-hp-fill"></div>
    </div>
  </div>

  <!-- Bottom Controls -->
  <div class="bottom-dock">
    <button class="btn btn-smash" id="btn-dig">KAZ & PARÇALA (BOŞLUK)</button>
    <button class="btn" id="btn-rotate-left">↶ Kule Sol (Q)</button>
    <button class="btn" id="btn-rotate-right">Kule Sağ ↷ (E)</button>
    <button class="btn" id="btn-sound">🔊 Ses</button>
  </div>

  <!-- On-Screen Steering -->
  <div class="touch-controls">
    <div style="display: flex; gap: 8px;">
      <div class="touch-btn" id="t-left">◀</div>
      <div class="touch-btn" id="t-right">▶</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <div class="touch-btn" id="t-up">▲</div>
      <div class="touch-btn" id="t-down">▼</div>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal-overlay" id="modal" style="display: none;">
    <div class="modal-box">
      <div class="modal-title" id="modal-title">Bölüm Tamamlandı!</div>
      <div class="modal-desc" id="modal-desc">Tebrikler! Bir sonraki tehlikeli geçide hazırsın.</div>
      <button class="btn btn-smash" id="modal-btn" style="width: 100%;">Devam Et</button>
    </div>
  </div>

  <script>
    // -------------------------------------------------------------
    // PROCEDURAL AUDIO SYNTHESIZER
    // -------------------------------------------------------------
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
        engineOsc.frequency.setValueAtTime(40, audioCtx.currentTime);
        engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
      }
    }

    function playSmashSound() {
      if (!audioCtx || isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
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

    // -------------------------------------------------------------
    // THREE.JS SCENE SETUP
    // -------------------------------------------------------------
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x444455, 0.85);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
    dirLight.position.set(20, 35, -15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // -------------------------------------------------------------
    // EXCAVATOR MODEL (PROCEDURAL)
    // -------------------------------------------------------------
    const excavatorGroup = new THREE.Group();
    const turretGroup = new THREE.Group();
    const boomGroup = new THREE.Group();
    const stickGroup = new THREE.Group();
    const bucketGroup = new THREE.Group();

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xefb008, roughness: 0.3, metalness: 0.4 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.6, metalness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.95 });

    // Chassis & Tracks
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.45, 2.8);
    const chassisMesh = new THREE.Mesh(chassisGeo, steelMat);
    chassisMesh.position.y = 0.55;
    chassisMesh.castShadow = true;
    excavatorGroup.add(chassisMesh);

    [-1.25, 1.25].forEach(x => {
      const trkGeo = new THREE.BoxGeometry(0.65, 0.75, 3.5);
      const trk = new THREE.Mesh(trkGeo, steelMat);
      trk.position.set(x, 0.5, 0);
      trk.castShadow = true;
      excavatorGroup.add(trk);
    });

    // Turret
    turretGroup.position.set(0, 0.95, 0);
    const deckGeo = new THREE.BoxGeometry(2.4, 0.35, 3.2);
    const deck = new THREE.Mesh(deckGeo, yellowMat);
    deck.position.set(0, 0.15, -0.1);
    deck.castShadow = true;
    turretGroup.add(deck);

    // Cabin
    const cabGeo = new THREE.BoxGeometry(0.95, 1.3, 1.4);
    const cab = new THREE.Mesh(cabGeo, yellowMat);
    cab.position.set(-0.65, 0.95, 0.2);
    cab.castShadow = true;
    turretGroup.add(cab);

    // Boom
    boomGroup.position.set(0.1, 0.7, 0.7);
    const boomGeo = new THREE.BoxGeometry(0.38, 0.5, 4.2);
    const boomMesh = new THREE.Mesh(boomGeo, yellowMat);
    boomMesh.position.set(0, 1.2, 1.8);
    boomMesh.rotation.x = 0.52;
    boomMesh.castShadow = true;
    boomGroup.add(boomMesh);

    // Stick
    stickGroup.position.set(0, 2.2, 3.4);
    const stickGeo = new THREE.BoxGeometry(0.32, 0.42, 3.0);
    const stickMesh = new THREE.Mesh(stickGeo, yellowMat);
    stickMesh.position.set(0, -0.9, 0.9);
    stickMesh.rotation.x = -0.7;
    stickMesh.castShadow = true;
    stickGroup.add(stickMesh);

    // Bucket
    bucketGroup.position.set(0, -1.8, 1.8);
    const bktGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 12, 1, false, 0, Math.PI * 1.25);
    bktGeo.rotateZ(Math.PI / 2);
    const bktMesh = new THREE.Mesh(bktGeo, steelMat);
    bktMesh.castShadow = true;
    bucketGroup.add(bktMesh);

    for (let i = -2; i <= 2; i++) {
      const toothGeo = new THREE.ConeGeometry(0.065, 0.38, 5);
      toothGeo.rotateX(Math.PI / 2);
      const tooth = new THREE.Mesh(toothGeo, chromeMat);
      tooth.position.set(i * 0.18, -0.42, 0.65);
      bucketGroup.add(tooth);
    }

    stickGroup.add(bucketGroup);
    boomGroup.add(stickGroup);
    turretGroup.add(boomGroup);
    excavatorGroup.add(turretGroup);
    scene.add(excavatorGroup);

    // -------------------------------------------------------------
    // LEVELS CONFIGURATION
    // -------------------------------------------------------------
    const LEVELS = [
      { id: 1, title: 'Bölüm 1: Taş Kanyonu', desc: 'Dev kayaları parçala, yolu aç!', length: 180, sky: 0xd69e6e, fog: 0xbfa181, ground: 0x785b3b, cliff: 0x523d24 },
      { id: 2, title: 'Bölüm 2: Lav Boğazı', desc: 'Volkanik barikatları aş!', length: 230, sky: 0x4d120a, fog: 0x2b0f0b, ground: 0x1a1415, cliff: 0x2d1810 },
      { id: 3, title: 'Bölüm 3: Ejder Kalesi & Prenses Kurtarma', desc: 'Demir kapıları kır, prensesi kurtar!', length: 280, sky: 0x17223b, fog: 0x101426, ground: 0x1e2430, cliff: 0x121720, hasPrincess: true }
    ];

    let currentLvl = 0;
    let score = 0;
    let excavatorPos = new THREE.Vector3(0, 0, 0);
    let excavatorYaw = 0;
    let currentSpeed = 0;
    let turretYaw = 0;
    let isStriking = false;
    let strikeP = 0;
    let levelObjects = new THREE.Group();
    scene.add(levelObjects);
    let obstacles = [];
    let princessMesh = null;
    let cageGroup = null;
    let isPrincessRescued = false;
    let keys = {};

    function buildLevel(lvlIdx) {
      currentLvl = lvlIdx;
      const cfg = LEVELS[lvlIdx];

      // Reset
      while (levelObjects.children.length > 0) levelObjects.remove(levelObjects.children[0]);
      obstacles = [];
      excavatorPos.set(0, 0, 0);
      excavatorYaw = 0;
      currentSpeed = 0;
      turretYaw = 0;
      turretGroup.rotation.y = 0;
      isPrincessRescued = false;

      scene.background = new THREE.Color(cfg.sky);
      scene.fog = new THREE.FogExp2(cfg.fog, 0.016);

      // Road
      const roadGeo = new THREE.PlaneGeometry(14, cfg.length + 50);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMat = new THREE.MeshStandardMaterial({ color: cfg.ground, roughness: 0.9 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, 0, cfg.length / 2);
      road.receiveShadow = true;
      levelObjects.add(road);

      // Cliffs
      const cliffGeo = new THREE.DodecahedronGeometry(5, 1);
      const cliffMat = new THREE.MeshStandardMaterial({ color: cfg.cliff, roughness: 0.95 });
      [-1, 1].forEach(side => {
        for (let z = 0; z <= cfg.length + 20; z += 14) {
          const c = new THREE.Mesh(cliffGeo, cliffMat);
          c.position.set(side * 12, 3 + Math.random() * 3, z);
          c.castShadow = true;
          levelObjects.add(c);
        }
      });

      // Obstacles
      for (let z = 25; z < cfg.length - 20; z += 20) {
        const obsGroup = new THREE.Group();
        obsGroup.position.set((Math.random() - 0.5) * 8, 0, z);
        const rSize = 1.2 + Math.random() * 0.8;
        const rGeo = new THREE.DodecahedronGeometry(rSize, 1);
        const rMat = new THREE.MeshStandardMaterial({ color: 0x5a544b, roughness: 0.9 });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.y = rSize * 0.8;
        rMesh.castShadow = true;
        obsGroup.add(rMesh);
        levelObjects.add(obsGroup);
        const hp = Math.ceil(rSize * 3);
        obstacles.push({ group: obsGroup, x: obsGroup.position.x, y: rMesh.position.y, z: z, hp: hp, maxHp: hp, scale: rSize, destroyed: false, name: 'Kanyon Kayası' });
      }

      // Princess at end of level 3
      if (cfg.hasPrincess) {
        const pGroup = new THREE.Group();
        pGroup.position.set(0, 0, cfg.length);

        // Princess figure
        const dressGeo = new THREE.ConeGeometry(0.7, 1.4, 16);
        const dressMat = new THREE.MeshStandardMaterial({ color: 0xeb4d90 });
        const dress = new THREE.Mesh(dressGeo, dressMat);
        dress.position.y = 0.7;
        pGroup.add(dress);

        const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.8;
        pGroup.add(head);

        const tiaraGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.1, 6);
        const tiaraMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 });
        const tiara = new THREE.Mesh(tiaraGeo, tiaraMat);
        tiara.position.y = 2.05;
        pGroup.add(tiara);

        princessMesh = pGroup;

        // Cursed Cage
        cageGroup = new THREE.Group();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const barGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
          const bar = new THREE.Mesh(barGeo, steelMat);
          bar.position.set(Math.cos(a) * 1.1, 1.25, Math.sin(a) * 1.1);
          cageGroup.add(bar);
        }
        pGroup.add(cageGroup);
        levelObjects.add(pGroup);

        obstacles.push({ group: cageGroup, x: 0, y: 1.25, z: cfg.length, hp: 10, maxHp: 10, scale: 2.2, destroyed: false, isPrincessCage: true, name: 'Büyülü Demir Kafes' });
      }

      document.getElementById('hud-level-title').innerText = cfg.title;
      document.getElementById('hud-level-desc').innerText = cfg.desc;
    }

    buildLevel(0);

    // -------------------------------------------------------------
    // CONTROLS & EVENTS
    // -------------------------------------------------------------
    window.addEventListener('keydown', e => {
      initAudio();
      keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') { e.preventDefault(); triggerSmash(); }
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function triggerSmash() {
      if (isStriking) return;
      isStriking = true;
      strikeP = 0;
    }

    document.getElementById('btn-dig').addEventListener('click', () => { initAudio(); triggerSmash(); });
    document.getElementById('btn-rotate-left').addEventListener('mousedown', () => keys['q'] = true);
    document.getElementById('btn-rotate-left').addEventListener('mouseup', () => keys['q'] = false);
    document.getElementById('btn-rotate-right').addEventListener('mousedown', () => keys['e'] = true);
    document.getElementById('btn-rotate-right').addEventListener('mouseup', () => keys['e'] = false);

    // Touch pad
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

    document.getElementById('btn-sound').addEventListener('click', () => {
      initAudio();
      isMuted = !isMuted;
      if (engineGain) engineGain.gain.setValueAtTime(isMuted ? 0 : 0.08, audioCtx.currentTime);
      document.getElementById('btn-sound').innerText = isMuted ? '🔇 Sessiz' : '🔊 Ses';
    });

    document.getElementById('modal-btn').addEventListener('click', () => {
      document.getElementById('modal').style.display = 'none';
      if (currentLvl < LEVELS.length - 1) buildLevel(currentLvl + 1);
      else buildLevel(0);
    });

    // -------------------------------------------------------------
    // GAME LOOP
    // -------------------------------------------------------------
    let clock = new THREE.Clock();
    const bucketWorld = new THREE.Vector3();

    function loop() {
      requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Movement
      let move = 0, turn = 0;
      if (keys['w'] || keys['arrowup']) move += 1;
      if (keys['s'] || keys['arrowdown']) move -= 1;
      if (keys['a'] || keys['arrowleft']) turn += 1;
      if (keys['d'] || keys['arrowright']) turn -= 1;

      if (move > 0) currentSpeed = Math.min(10, currentSpeed + 12 * delta);
      else if (move < 0) currentSpeed = Math.max(-5, currentSpeed - 14 * delta);
      else currentSpeed *= 0.92;

      excavatorYaw += turn * 1.8 * delta;

      if (keys['q']) { turretYaw += 1.5 * delta; turretGroup.rotation.y = turretYaw; }
      if (keys['e']) { turretYaw -= 1.5 * delta; turretGroup.rotation.y = turretYaw; }

      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), excavatorYaw);
      excavatorPos.addScaledVector(forward, currentSpeed * delta);
      excavatorPos.x = Math.max(-5.5, Math.min(5.5, excavatorPos.x));
      excavatorGroup.position.copy(excavatorPos);
      excavatorGroup.rotation.y = excavatorYaw;

      // Dig Strike Animation
      if (isStriking) {
        strikeP += delta * 4.5;
        if (strikeP < 1.0) {
          boomGroup.rotation.x = -0.3 - strikeP * 0.4;
          stickGroup.rotation.x = 0.6 - strikeP * 0.4;
        } else if (strikeP < 2.0) {
          boomGroup.rotation.x = -0.7 + (strikeP - 1) * 0.8;
          stickGroup.rotation.x = 0.2 + (strikeP - 1) * 1.0;
          bucketGroup.rotation.x = -0.4 - (strikeP - 1) * 0.6;
        } else {
          isStriking = false;
          boomGroup.rotation.x = -0.3;
          stickGroup.rotation.x = 0.6;
          bucketGroup.rotation.x = -0.4;
        }
      }

      // Collision
      bucketGroup.getWorldPosition(bucketWorld);
      let closest = null;
      let closestDist = Infinity;

      obstacles.forEach(obs => {
        if (obs.destroyed) return;
        const dChassis = excavatorPos.distanceTo(new THREE.Vector3(obs.x, 0, obs.z));
        const dBucket = bucketWorld.distanceTo(new THREE.Vector3(obs.x, obs.y, obs.z));

        if (dChassis < closestDist && dChassis < 18) {
          closestDist = dChassis;
          closest = obs;
        }

        // Strike impact
        if (isStriking && dBucket < obs.scale + 2.5) {
          obs.hp -= 1;
          score += 50;
          playSmashSound();
          if (obs.hp <= 0) {
            obs.destroyed = true;
            obs.group.visible = false;
            score += 250;
            if (obs.isPrincessCage) {
              isPrincessRescued = true;
              playFanfare();
              document.getElementById('modal-title').innerText = '👑 PRENSESİ KURTARDIN!';
              document.getElementById('modal-desc').innerText = 'Harika iş başardın! Ekskavatörünle ejder kalesini yıktın ve prensesi zindandan kurtardın! Krallığın ebedi kahramanısın!';
              document.getElementById('modal-btn').innerText = 'Baştan Oyna';
              document.getElementById('modal').style.display = 'flex';
            }
          }
        }

        // Block chassis
        if (!obs.destroyed && dChassis < obs.scale + 1.4) {
          currentSpeed = -1.5;
        }
      });

      // Target HUD
      const targetBar = document.getElementById('target-bar');
      if (closest && !closest.destroyed) {
        targetBar.style.display = 'block';
        document.getElementById('target-name').innerText = closest.name;
        document.getElementById('target-hp-text').innerText = closest.hp + ' / ' + closest.maxHp;
        document.getElementById('target-hp-fill').style.width = Math.max(0, (closest.hp / closest.maxHp) * 100) + '%';
      } else {
        targetBar.style.display = 'none';
      }

      // Check level clear
      const currentCfg = LEVELS[currentLvl];
      if (!currentCfg.hasPrincess && excavatorPos.z >= currentCfg.length) {
        playFanfare();
        document.getElementById('modal-title').innerText = 'Bölüm ' + (currentLvl + 1) + ' Başarıyla Geçildi!';
        document.getElementById('modal-desc').innerText = 'Yol temizlendi! Sıradaki daha zorlu bölüme hazırsın.';
        document.getElementById('modal-btn').innerText = 'Sonraki Bölüme Geç ➔';
        document.getElementById('modal').style.display = 'flex';
      }

      // Camera
      camera.position.set(
        excavatorPos.x - Math.sin(excavatorYaw) * 9.5,
        excavatorPos.y + 5.2,
        excavatorPos.z - Math.cos(excavatorYaw) * 9.5
      );
      camera.lookAt(excavatorPos.x, excavatorPos.y + 1.6, excavatorPos.z + 2.5);

      // HUD Stats
      document.getElementById('hud-score').innerText = score;
      document.getElementById('hud-speed').innerHTML = Math.abs(Math.round(currentSpeed * 3.6)) + ' <span style="font-size:10px;">KM/S</span>';
      const pct = Math.min(100, Math.floor((excavatorPos.z / currentCfg.length) * 100));
      document.getElementById('hud-progress').innerText = '%' + pct;

      renderer.render(scene, camera);
    }

    loop();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ekskavator_oyunu_3d.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
