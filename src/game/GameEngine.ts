import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import { ExcavatorModel } from './ExcavatorModel';
import { EnvironmentBuilder } from './EnvironmentBuilder';
import { DebrisSystem } from './DebrisSystem';
import { PrincessModel } from './PrincessModel';
import { LEVELS, LevelConfig, ObstacleData } from './constants';
import { sound } from '../audio/SoundEffects';

export interface GameStatus {
  level: number;
  levelConfig: LevelConfig;
  score: number;
  combo: number;
  speed: number;
  progressPercent: number;
  excavatorHp: number;
  fuel: number;
  gameState: 'START' | 'PLAYING' | 'LEVEL_CLEAR' | 'VICTORY' | 'GAMEOVER';
  targetObstacleHp: { current: number; max: number; name: string } | null;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animFrameId: number = 0;
  private clock: THREE.Clock;

  // Game actors
  public excavator: ExcavatorModel;
  public envBuilder: EnvironmentBuilder;
  public debris: DebrisSystem;
  public princess: PrincessModel | null = null;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Active level data
  public currentLevelIndex: number = 0;
  public levelConfig: LevelConfig = LEVELS[0];
  public score: number = 0;
  public combo: number = 1;
  public comboTimer: number = 0;
  public excavatorHp: number = 100;
  public fuel: number = 100;
  public gameState: 'START' | 'PLAYING' | 'LEVEL_CLEAR' | 'VICTORY' | 'GAMEOVER' = 'START';

  // Kinematic & driving variables
  public excavatorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public excavatorYaw: number = 0;
  public currentSpeed: number = 0;
  public maxForwardSpeed: number = 11.5;
  public maxReverseSpeed: number = 6.0;
  public acceleration: number = 14.0;
  public braking: number = 18.0;
  public turnSpeed: number = 1.8;

  // Input states
  public keys: { [key: string]: boolean } = {};
  public isDigRequested: boolean = false;

  // Camera damping
  private cameraTargetPos: THREE.Vector3 = new THREE.Vector3();
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();
  private cinematicAngle: number = 0;

  // HUD callback
  public onUpdateStatus?: (status: GameStatus) => void;

  // Temporary math helpers to prevent garbage collection
  private _bucketWorldPos = new THREE.Vector3();
  private _tempVec3 = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 400);
    this.camera.position.set(0, 6, -10);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Key and fill lights
    this.hemiLight = new THREE.HemisphereLight(0xffeedd, 0x444455, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    this.dirLight.position.set(25, 40, -15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Game actors
    this.excavator = new ExcavatorModel();
    this.scene.add(this.excavator.group);

    this.envBuilder = new EnvironmentBuilder();
    this.scene.add(this.envBuilder.group);

    this.debris = new DebrisSystem();
    this.scene.add(this.debris.group);

    this.setupListeners();
    this.loadLevel(0);
    this.startLoop();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerDig();
      }
      sound.startEngine();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.renderer.domElement.parentElement) return;
    const width = this.renderer.domElement.parentElement.clientWidth;
    const height = this.renderer.domElement.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public loadLevel(levelIndex: number) {
    this.currentLevelIndex = levelIndex;
    this.levelConfig = LEVELS[levelIndex] || LEVELS[0];

    // Reset vehicle state
    this.excavatorPos.set(0, 0, 0);
    this.excavatorYaw = 0;
    this.currentSpeed = 0;
    this.excavator.group.position.set(0, 0, 0);
    this.excavator.group.rotation.set(0, 0, 0);
    this.excavator.turretAngle = 0;
    this.excavator.applyKinematics();

    // Scene lighting & fog matching theme
    this.scene.background = new THREE.Color(this.levelConfig.skyColor);
    this.scene.fog = new THREE.FogExp2(this.levelConfig.fogColor, 0.016);
    this.hemiLight.color.set(this.levelConfig.ambientColor);
    this.dirLight.color.set(this.levelConfig.keyLightColor);

    // Rebuild level terrain & obstacles
    const { princess } = this.envBuilder.buildLevel(this.levelConfig);
    this.princess = princess;

    this.debris.clear();
    this.gameState = 'PLAYING';
    sound.startEngine();
  }

  public nextLevel() {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      this.loadLevel(0);
    }
  }

  public triggerDig() {
    if (this.gameState !== 'PLAYING') return;
    this.excavator.startDigStrike();
    sound.playHydraulicHiss();
  }

  private updateControls(delta: number) {
    if (this.gameState !== 'PLAYING') return;

    let moveInput = 0;
    let turnInput = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveInput += 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveInput -= 1;
    if (this.keys['a'] || this.keys['arrowleft']) turnInput += 1;
    if (this.keys['d'] || this.keys['arrowright']) turnInput -= 1;

    // Turret rotation with Q / E
    if (this.keys['q']) {
      this.excavator.turretAngle += 1.4 * delta;
      this.excavator.applyKinematics();
    }
    if (this.keys['e']) {
      this.excavator.turretAngle -= 1.4 * delta;
      this.excavator.applyKinematics();
    }

    // Direct excavator speed physics
    if (moveInput > 0) {
      this.currentSpeed = Math.min(this.maxForwardSpeed, this.currentSpeed + this.acceleration * delta);
    } else if (moveInput < 0) {
      this.currentSpeed = Math.max(-this.maxReverseSpeed, this.currentSpeed - this.braking * delta);
    } else {
      // Natural rolling friction deceleration
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - this.braking * 0.8 * delta);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + this.braking * 0.8 * delta);
      }
    }

    // Tank Steering (turning tracks)
    if (turnInput !== 0) {
      // Can turn in place or while moving
      const steerFactor = Math.abs(this.currentSpeed) > 0.5 ? 1.0 : 0.85;
      this.excavatorYaw += turnInput * this.turnSpeed * steerFactor * delta;
    }

    // Update position along facing direction
    if (Math.abs(this.currentSpeed) > 0.01) {
      const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.excavatorYaw);
      this.excavatorPos.addScaledVector(forwardDir, this.currentSpeed * delta);

      // Scroll crawler tracks
      this.excavator.scrollTracks(this.currentSpeed * delta);

      // Diesel exhaust smoke puffs
      if (Math.random() < 0.4) {
        this._tempVec3.set(0.7, 2.2, -0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.excavatorYaw).add(this.excavatorPos);
        this.debris.spawnExhaustPuff(this._tempVec3, Math.abs(this.currentSpeed) / this.maxForwardSpeed);
      }
    }

    // Constrain within road boundaries
    this.excavatorPos.x = THREE.MathUtils.clamp(this.excavatorPos.x, -5.8, 5.8);
    this.excavatorPos.z = Math.max(0, this.excavatorPos.z);

    this.excavator.group.position.copy(this.excavatorPos);
    this.excavator.group.rotation.y = this.excavatorYaw;

    // Direct lighting moves with player
    this.dirLight.position.set(this.excavatorPos.x + 20, 35, this.excavatorPos.z - 15);
    this.dirLight.target.position.copy(this.excavatorPos);
    this.dirLight.target.updateMatrixWorld();

    // Sound modulation
    sound.updateEngine(Math.abs(this.currentSpeed) / this.maxForwardSpeed, this.excavator.isStriking);
  }

  private handleCollisions() {
    this.excavator.getBucketWorldPosition(this._bucketWorldPos);

    let nearestObstacleHp: { current: number; max: number; name: string } | null = null;
    let closestDist = Infinity;

    for (const item of this.envBuilder.obstacles) {
      const obs = item.data;
      if (obs.destroyed) continue;

      const distToChassis = this.excavatorPos.distanceTo(new THREE.Vector3(obs.x, 0, obs.z));
      const distToBucket = this._bucketWorldPos.distanceTo(new THREE.Vector3(obs.x, obs.y, obs.z));

      // Check nearest for HUD target display
      if (distToChassis < closestDist && distToChassis < 20) {
        closestDist = distToChassis;
        const nameMap: Record<string, string> = {
          boulder: 'Kanyon Kayası',
          iron_gate: 'Demir Savunma Kapısı',
          princess_cage: 'Büyülü Zindan Kafesi',
          lava_crystal: 'Bazalt Monolit',
          rock_wall: 'Taş Barikat',
          fuel_canister: 'Yakıt Deposu',
        };
        nearestObstacleHp = {
          current: obs.hp,
          max: obs.maxHp,
          name: nameMap[obs.type] || 'Kaya Engeli',
        };
      }

      // 1. Excavator Bucket Strike Smash
      if (this.excavator.isStriking && distToBucket < obs.scale + 2.5) {
        obs.hp -= 1;
        this.score += 50 * this.combo;
        this.comboTimer = 3.5;
        this.combo = Math.min(8, this.combo + 1);

        // Sparks & rock chips
        this.debris.spawnRockExplosion(this._bucketWorldPos, 6, obs.color || 0x6e6053);
        sound.playRockSmash(obs.type === 'iron_gate' || obs.type === 'princess_cage');

        // Check destruction
        if (obs.hp <= 0) {
          obs.destroyed = true;
          item.mesh.visible = false;
          this.score += obs.scoreValue * this.combo;

          // Huge explosion
          this.debris.spawnRockExplosion(
            new THREE.Vector3(obs.x, obs.y, obs.z),
            24,
            obs.type === 'iron_gate' ? 0x333339 : 0x7a6953
          );

          if (obs.type === 'iron_gate') {
            sound.playGateDestroy();
          }

          // PRINCESS RESCUE TRIGGER!
          if (obs.type === 'princess_cage' && this.princess) {
            this.princess.breakCage();
            this.triggerVictory();
          }
        }
      }

      // 2. Chassis Physical Bump (cannot pass through obstacles unless destroyed)
      if (!obs.destroyed && distToChassis < obs.scale + 1.6) {
        // Stop forward motion and push back gently
        if (this.currentSpeed > 0) {
          this.currentSpeed = -1.5;
          sound.playRockSmash(false);
          this.debris.spawnSparks(this.excavatorPos, 4);
        }
      }
    }

    // Checkpoint completion (level clear for level 1 and 2)
    if (this.gameState === 'PLAYING' && !this.levelConfig.princessAtEnd) {
      if (this.excavatorPos.z >= this.levelConfig.trackLength) {
        this.triggerLevelClear();
      }
    }

    return nearestObstacleHp;
  }

  private triggerLevelClear() {
    this.gameState = 'LEVEL_CLEAR';
    sound.playVictoryFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  private triggerVictory() {
    this.gameState = 'VICTORY';
    sound.playVictoryFanfare();

    // Epic multi-burst confetti celebration
    const end = Date.now() + 4 * 1000;
    const colors = ['#ffd700', '#eb4d90', '#00ff88', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end && this.gameState === 'VICTORY') {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  private updateCamera(delta: number) {
    if (this.gameState === 'VICTORY' && this.princess) {
      // Grand cinematic orbital camera rotating around the Princess and Excavator!
      this.cinematicAngle += delta * 0.75;
      const radius = 9.5;
      const targetCenter = this.princess.group.position;

      this.camera.position.x = targetCenter.x + Math.sin(this.cinematicAngle) * radius;
      this.camera.position.z = targetCenter.z + Math.cos(this.cinematicAngle) * radius;
      this.camera.position.y = 4.2 + Math.sin(this.cinematicAngle * 0.5) * 1.0;
      this.camera.lookAt(targetCenter.x, 2.0, targetCenter.z);
    } else {
      // Dynamic third-person driving camera with smooth exponential damping
      const backOffset = -9.2;
      const heightOffset = 4.8;

      const offset = new THREE.Vector3(0, heightOffset, backOffset).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.excavatorYaw
      );

      this.cameraTargetPos.copy(this.excavatorPos).add(offset);
      this.cameraLookTarget.copy(this.excavatorPos).add(new THREE.Vector3(0, 1.8, 3.0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.excavatorYaw
      ));

      // Silky-smooth damping
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraTargetPos.x, 6.0, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.cameraTargetPos.y, 6.0, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.cameraTargetPos.z, 6.0, delta);
      this.camera.lookAt(this.cameraLookTarget);
    }
  }

  private startLoop() {
    const tick = () => {
      this.animFrameId = requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Update game systems
      this.updateControls(delta);
      this.excavator.update(delta);
      this.debris.update(delta);

      if (this.princess) {
        this.princess.update(delta);
      }

      // Combo cooldown
      if (this.comboTimer > 0) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      const currentObstacle = this.handleCollisions();
      this.updateCamera(delta);

      // Render Three.js scene
      this.renderer.render(this.scene, this.camera);

      // Broadcast status to HUD
      if (this.onUpdateStatus) {
        const progress = Math.min(100, Math.floor((this.excavatorPos.z / this.levelConfig.trackLength) * 100));
        this.onUpdateStatus({
          level: this.currentLevelIndex + 1,
          levelConfig: this.levelConfig,
          score: this.score,
          combo: this.combo,
          speed: Math.abs(Math.round(this.currentSpeed * 3.6)), // km/h
          progressPercent: progress,
          excavatorHp: this.excavatorHp,
          fuel: this.fuel,
          gameState: this.gameState,
          targetObstacleHp: currentObstacle,
        });
      }
    };

    tick();
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
