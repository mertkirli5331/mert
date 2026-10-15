import * as THREE from 'three';
import { LevelConfig, ObstacleData } from './constants';
import { PrincessModel } from './PrincessModel';

/**
 * Procedural 3D Environment Builder.
 * Constructs rich outdoor canyon, volcanic gorge, and fortress levels
 * with natural cliff boundaries, rock obstacles, destructible gates, and lighting.
 */

export interface ObstacleItem {
  data: ObstacleData;
  mesh: THREE.Group | THREE.Object3D;
}

export class EnvironmentBuilder {
  public group: THREE.Group;
  public obstacles: ObstacleItem[] = [];
  public princessModel: PrincessModel | null = null;
  public goalZ: number = 0;
  public finishLineMesh: THREE.Mesh | null = null;

  constructor() {
    this.group = new THREE.Group();
  }

  public buildLevel(config: LevelConfig): { obstacles: ObstacleItem[]; princess: PrincessModel | null } {
    // Clear previous environment
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.obstacles = [];
    this.princessModel = null;
    this.goalZ = config.trackLength;

    const trackLength = config.trackLength;
    const roadWidth = 14;

    // 1. TERRAIN ROAD & GROUND
    const roadGeo = new THREE.PlaneGeometry(roadWidth, trackLength + 60, 32, 64);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.groundColor),
      roughness: 0.85,
      metalness: 0.15,
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, 0, trackLength / 2);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // 2. CLIFF SIDES / CANYON WALLS (Natural perimeter boundaries)
    this.buildCliffWalls(config, roadWidth, trackLength);

    // 3. THEMATIC DECORATIONS (Canyon scaffolding, Lava river, Citadel battlements)
    if (config.theme === 'quarry') {
      this.buildQuarryDecor(trackLength);
    } else if (config.theme === 'magma') {
      this.buildMagmaDecor(roadWidth, trackLength);
    } else if (config.theme === 'citadel') {
      this.buildCitadelDecor(roadWidth, trackLength);
    }

    // 4. GENERATE DESTRUCTIBLE OBSTACLES ALONG THE ROAD
    this.generateObstacles(config);

    // 5. FINISH LINE / PRINCESS CAGE AT THE END
    if (config.princessAtEnd) {
      this.princessModel = new PrincessModel();
      this.princessModel.group.position.set(0, 0, trackLength);
      this.group.add(this.princessModel.group);

      // Register the cage as the ultimate final obstacle
      const cageObstacle: ObstacleData = {
        id: 9999,
        x: 0,
        y: 1.5,
        z: trackLength,
        type: 'princess_cage',
        maxHp: 12,
        hp: 12,
        scale: 2.2,
        destroyed: false,
        scoreValue: 2000,
      };
      this.obstacles.push({ data: cageObstacle, mesh: this.princessModel.cageGroup });
    } else {
      // Construction Checkpoint / Mountain Portal Gate
      this.buildCheckpointGate(trackLength, config);
    }

    return { obstacles: this.obstacles, princess: this.princessModel };
  }

  private buildCliffWalls(config: LevelConfig, roadWidth: number, trackLength: number) {
    const cliffMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.cliffColor),
      roughness: 0.95,
      metalness: 0.05,
    });

    const rockGeo = new THREE.DodecahedronGeometry(5.5, 1);

    // Left and Right rugged mountain cliff barriers
    [-1, 1].forEach((side) => {
      const baseX = side * (roadWidth / 2 + 5.5);
      for (let z = -10; z <= trackLength + 40; z += 12) {
        const cliffChunk = new THREE.Mesh(rockGeo, cliffMat);
        const yHeight = 4 + Math.random() * 4;
        const xOffset = (Math.random() - 0.5) * 3;
        cliffChunk.position.set(baseX + xOffset, yHeight, z);
        cliffChunk.scale.set(1.4 + Math.random() * 0.8, 1.8 + Math.random() * 1.5, 1.4 + Math.random() * 0.8);
        cliffChunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        cliffChunk.castShadow = true;
        cliffChunk.receiveShadow = true;
        this.group.add(cliffChunk);
      }
    });
  }

  private buildQuarryDecor(trackLength: number) {
    // Wooden warning signs and construction cranes along the way
    for (let z = 20; z <= trackLength; z += 45) {
      const signGroup = new THREE.Group();
      signGroup.position.set(z % 90 === 0 ? 5.8 : -5.8, 0, z);

      // Post
      const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 1.25;
      post.castShadow = true;
      signGroup.add(post);

      // Warning sign board
      const boardGeo = new THREE.BoxGeometry(1.6, 0.9, 0.1);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.y = 2.0;
      board.castShadow = true;
      signGroup.add(board);

      this.group.add(signGroup);
    }
  }

  private buildMagmaDecor(roadWidth: number, trackLength: number) {
    // Glowing lava rivers flanking the road
    [-1, 1].forEach((side) => {
      const lavaGeo = new THREE.PlaneGeometry(8, trackLength + 60);
      lavaGeo.rotateX(-Math.PI / 2);
      const lavaMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xee2200,
        emissiveIntensity: 0.85,
        roughness: 0.3,
      });
      const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
      lavaMesh.position.set(side * (roadWidth / 2 + 3.5), -0.6, trackLength / 2);
      this.group.add(lavaMesh);
    });

    // Lava point lights for dramatic glowing atmosphere
    for (let z = 30; z < trackLength; z += 50) {
      const lavaLight = new THREE.PointLight(0xff5511, 4.0, 22, 1.2);
      lavaLight.position.set(0, 1.5, z);
      this.group.add(lavaLight);
    }
  }

  private buildCitadelDecor(roadWidth: number, trackLength: number) {
    // Citadel stone battlements and flaming torch pillars
    const stonePillarMat = new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.8 });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa11,
      emissive: 0xff6600,
      emissiveIntensity: 1.2,
    });

    for (let z = 25; z < trackLength - 20; z += 40) {
      [-1, 1].forEach((side) => {
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.65, 4.5, 8);
        const pillar = new THREE.Mesh(pillarGeo, stonePillarMat);
        pillar.position.set(side * (roadWidth / 2 - 1.2), 2.25, z);
        pillar.castShadow = true;
        this.group.add(pillar);

        // Torch flame
        const flameGeo = new THREE.OctahedronGeometry(0.3);
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(side * (roadWidth / 2 - 1.2), 4.7, z);
        this.group.add(flame);

        const torchLight = new THREE.PointLight(0xff7722, 2.5, 16);
        torchLight.position.copy(flame.position);
        this.group.add(torchLight);
      });
    }
  }

  private generateObstacles(config: LevelConfig) {
    const boulderMat = new THREE.MeshStandardMaterial({
      color: config.theme === 'magma' ? 0x221a1a : (config.theme === 'citadel' ? 0x3a4050 : 0x7a6953),
      roughness: 0.9,
      metalness: 0.1,
    });

    const ironGateMat = new THREE.MeshStandardMaterial({
      color: 0x2b2b30,
      roughness: 0.4,
      metalness: 0.85,
    });

    let obstacleId = 1;
    const startZ = 25;
    const endZ = config.trackLength - 25;
    const stepZ = 16 / config.obstacleDensity;

    for (let z = startZ; z < endZ; z += stepZ) {
      const randType = Math.random();

      // Big fortified stone / iron gate every 65m
      if (z % 65 < stepZ && z > 35) {
        const gateGroup = new THREE.Group();
        gateGroup.position.set(0, 0, z);

        // Gate frame arch
        const archTopGeo = new THREE.BoxGeometry(10, 1.2, 1.5);
        const archTop = new THREE.Mesh(archTopGeo, ironGateMat);
        archTop.position.y = 4.6;
        archTop.castShadow = true;
        gateGroup.add(archTop);

        // Left & right pillars
        [-4.5, 4.5].forEach((xSide) => {
          const colGeo = new THREE.BoxGeometry(1.4, 5.0, 1.5);
          const col = new THREE.Mesh(colGeo, ironGateMat);
          col.position.set(xSide, 2.5, 0);
          col.castShadow = true;
          gateGroup.add(col);
        });

        // Breakable central gate doors
        const doorGeo = new THREE.BoxGeometry(8, 4.0, 0.8);
        const doorMat = new THREE.MeshStandardMaterial({
          color: config.theme === 'citadel' ? 0x1f2229 : 0x5a361c,
          roughness: 0.7,
          metalness: 0.5,
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.y = 2.0;
        door.castShadow = true;
        gateGroup.add(door);

        this.group.add(gateGroup);

        const data: ObstacleData = {
          id: obstacleId++,
          x: 0,
          y: 2.0,
          z: z,
          type: 'iron_gate',
          maxHp: config.dangerLevel * 4,
          hp: config.dangerLevel * 4,
          scale: 4.5,
          destroyed: false,
          scoreValue: 400 * config.dangerLevel,
        };
        this.obstacles.push({ data, mesh: gateGroup });
        continue;
      }

      // Normal boulders and rock barriers
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const xPos = (Math.random() - 0.5) * 8.5;
        const bGroup = new THREE.Group();
        bGroup.position.set(xPos, 0, z + (Math.random() - 0.5) * 4);

        const bSize = 1.0 + Math.random() * 0.9;
        const bGeo = new THREE.DodecahedronGeometry(bSize, 1);
        const bMesh = new THREE.Mesh(bGeo, boulderMat);
        bMesh.position.y = bSize * 0.85;
        bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        bGroup.add(bMesh);

        this.group.add(bGroup);

        const hp = Math.ceil(bSize * 2.2 * (config.dangerLevel * 0.8));
        const data: ObstacleData = {
          id: obstacleId++,
          x: bGroup.position.x,
          y: bSize * 0.85,
          z: bGroup.position.z,
          type: 'boulder',
          maxHp: hp,
          hp: hp,
          scale: bSize * 1.3,
          destroyed: false,
          scoreValue: hp * 50,
        };
        this.obstacles.push({ data, mesh: bGroup });
      }
    }
  }

  private buildCheckpointGate(trackLength: number, config: LevelConfig) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, trackLength);

    // Arch pillars
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xefb008,
      roughness: 0.3,
      metalness: 0.8,
    });
    const bannerGeo = new THREE.BoxGeometry(11, 2.0, 0.4);
    const banner = new THREE.Mesh(bannerGeo, archMat);
    banner.position.y = 5.0;
    banner.castShadow = true;
    gateGroup.add(banner);

    [-5, 5].forEach((xSide) => {
      const colGeo = new THREE.CylinderGeometry(0.6, 0.7, 6.0, 12);
      const col = new THREE.Mesh(colGeo, archMat);
      col.position.set(xSide, 3.0, 0);
      col.castShadow = true;
      gateGroup.add(col);
    });

    // Checkpoint glowing finish line
    const lineGeo = new THREE.PlaneGeometry(12, 1.2);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.85,
    });
    this.finishLineMesh = new THREE.Mesh(lineGeo, lineMat);
    this.finishLineMesh.position.set(0, 0.05, 0);
    gateGroup.add(this.finishLineMesh);

    this.group.add(gateGroup);
  }
}
