import * as THREE from 'three';

/**
 * Procedural Ultra-Detailed 3D Excavator Model.
 * Built according to Three.js PBR standards:
 * Multi-part hierarchy, realistic hydraulic boom kinematics,
 * dynamic pistons, rotating turret, continuous tracks, and bucket teeth.
 */

export class ExcavatorModel {
  public group: THREE.Group;
  public chassis: THREE.Group;
  public turret: THREE.Group;
  public boom: THREE.Group;
  public stick: THREE.Group;
  public bucket: THREE.Group;

  // Hydraulic cylinder references for dynamic piston animation
  public boomPistonRodLeft!: THREE.Mesh;
  public boomPistonRodRight!: THREE.Mesh;
  public stickPistonRod!: THREE.Mesh;
  public bucketPistonRod!: THREE.Mesh;

  // Track meshes for UV scrolling / track animation
  private leftTrackMesh!: THREE.Mesh;
  private rightTrackMesh!: THREE.Mesh;
  private trackTexture!: THREE.CanvasTexture;

  // Spotlights
  public leftLight!: THREE.SpotLight;
  public rightLight!: THREE.SpotLight;
  public leftLightCone!: THREE.Mesh;
  public rightLightCone!: THREE.Mesh;

  // Kinematic state
  public turretAngle: number = 0;
  public boomAngle: number = -0.3; // Default resting angle
  public stickAngle: number = 0.6;
  public bucketAngle: number = -0.4;

  // Dig strike animation
  public isStriking: boolean = false;
  private strikeProgress: number = 0;
  private strikeSpeed: number = 4.2;

  constructor() {
    this.group = new THREE.Group();
    this.chassis = new THREE.Group();
    this.turret = new THREE.Group();
    this.boom = new THREE.Group();
    this.stick = new THREE.Group();
    this.bucket = new THREE.Group();

    this.buildModel();
  }

  private createTreadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#2d2b27';
    for (let y = 0; y < 128; y += 16) {
      ctx.fillRect(4, y, 120, 10);
      ctx.fillStyle = '#423e38';
      ctx.fillRect(8, y + 2, 112, 3);
      ctx.fillStyle = '#111110';
      ctx.fillRect(4, y + 9, 120, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildModel() {
    // Shared PBR materials with varied roughness / metalness
    const yellowPaintMat = new THREE.MeshStandardMaterial({
      color: 0xefb008, // Classic Caterpillar construction yellow
      roughness: 0.28,
      metalness: 0.45,
    });

    const darkChassisMat = new THREE.MeshStandardMaterial({
      color: 0x222224, // Industrial dark steel
      roughness: 0.65,
      metalness: 0.8,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Polished chrome hydraulic pistons
      roughness: 0.08,
      metalness: 0.98,
    });

    const hydraulicCylinderMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      roughness: 0.4,
      metalness: 0.7,
    });

    const bucketHardenedSteelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3d40,
      roughness: 0.35,
      metalness: 0.85,
    });

    const bucketTeethMat = new THREE.MeshStandardMaterial({
      color: 0xbfcad1,
      roughness: 0.2,
      metalness: 0.95,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa4d8f0,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      thickness: 0.4,
    });

    // -------------------------------------------------------------
    // 1. UNDERCARRIAGE & CRAWLER TRACKS
    // -------------------------------------------------------------
    this.trackTexture = this.createTreadTexture();
    const trackMat = new THREE.MeshStandardMaterial({
      map: this.trackTexture,
      roughness: 0.85,
      metalness: 0.5,
    });

    // Central cross beam / carbody
    const carbodyGeo = new THREE.BoxGeometry(2.2, 0.45, 2.6);
    const carbodyMesh = new THREE.Mesh(carbodyGeo, darkChassisMat);
    carbodyMesh.position.y = 0.55;
    carbodyMesh.castShadow = true;
    carbodyMesh.receiveShadow = true;
    this.chassis.add(carbodyMesh);

    // Left and Right track assemblies
    [-1.25, 1.25].forEach((xOffset, idx) => {
      const trackGroup = new THREE.Group();
      trackGroup.position.set(xOffset, 0.5, 0);

      // Track frame
      const frameGeo = new THREE.BoxGeometry(0.55, 0.65, 3.4);
      const frameMesh = new THREE.Mesh(frameGeo, darkChassisMat);
      frameMesh.castShadow = true;
      trackGroup.add(frameMesh);

      // Track continuous rubber/steel tread
      const treadGeo = new THREE.BoxGeometry(0.65, 0.75, 3.5);
      const treadMesh = new THREE.Mesh(treadGeo, trackMat);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      trackGroup.add(treadMesh);

      if (idx === 0) this.leftTrackMesh = treadMesh;
      else this.rightTrackMesh = treadMesh;

      // Track Rollers (6 per side)
      const rollerGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.7, 12);
      rollerGeo.rotateZ(Math.PI / 2);
      for (let z = -1.4; z <= 1.4; z += 0.56) {
        const roller = new THREE.Mesh(rollerGeo, darkChassisMat);
        roller.position.set(0, -0.15, z);
        roller.castShadow = true;
        trackGroup.add(roller);
      }

      // Sprocket / Idler (front and back)
      [-1.6, 1.6].forEach((zPos) => {
        const idlerGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.72, 16);
        idlerGeo.rotateZ(Math.PI / 2);
        const idler = new THREE.Mesh(idlerGeo, darkChassisMat);
        idler.position.set(0, 0, zPos);
        idler.castShadow = true;
        trackGroup.add(idler);
      });

      this.chassis.add(trackGroup);
    });

    // Slew ring (bearing between chassis and upper turret)
    const slewGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 24);
    const slewMesh = new THREE.Mesh(slewGeo, darkChassisMat);
    slewMesh.position.y = 0.85;
    slewMesh.castShadow = true;
    this.chassis.add(slewMesh);

    this.group.add(this.chassis);

    // -------------------------------------------------------------
    // 2. REVOLVING UPPERSTRUCTURE (TURRET & CABIN)
    // -------------------------------------------------------------
    this.turret.position.set(0, 0.95, 0);

    // Turret main platform base
    const deckGeo = new THREE.BoxGeometry(2.4, 0.35, 3.2);
    const deckMesh = new THREE.Mesh(deckGeo, yellowPaintMat);
    deckMesh.position.set(0, 0.15, -0.1);
    deckMesh.castShadow = true;
    this.turret.add(deckMesh);

    // Rear counterweight (heavy iron ballast)
    const counterweightGeo = new THREE.BoxGeometry(2.35, 0.9, 1.0);
    const counterweightMesh = new THREE.Mesh(counterweightGeo, darkChassisMat);
    counterweightMesh.position.set(0, 0.7, -1.2);
    counterweightMesh.castShadow = true;
    this.turret.add(counterweightMesh);

    // Engine hood / machinery housing
    const engineGeo = new THREE.BoxGeometry(1.3, 0.8, 1.6);
    const engineMesh = new THREE.Mesh(engineGeo, yellowPaintMat);
    engineMesh.position.set(0.45, 0.65, -0.2);
    engineMesh.castShadow = true;
    this.turret.add(engineMesh);

    // Radiator grille
    const grilleGeo = new THREE.PlaneGeometry(0.8, 0.5);
    const grilleMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
    });
    const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
    grilleMesh.position.set(0.45, 0.7, -1.71);
    grilleMesh.rotation.y = Math.PI;
    this.turret.add(grilleMesh);

    // Chrome diesel exhaust pipe
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12);
    const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaustMesh.position.set(0.7, 1.3, -0.6);
    exhaustMesh.castShadow = true;
    this.turret.add(exhaustMesh);

    // OPERATOR CABIN (Left side)
    const cabGroup = new THREE.Group();
    cabGroup.position.set(-0.65, 0.3, 0.2);

    // Cabin structural frame
    const cabBodyGeo = new THREE.BoxGeometry(0.95, 1.3, 1.4);
    const cabBodyMesh = new THREE.Mesh(cabBodyGeo, yellowPaintMat);
    cabBodyMesh.position.set(0, 0.65, 0);
    cabBodyMesh.castShadow = true;
    cabGroup.add(cabBodyMesh);

    // Tinted panoramic glass windows (front, side, roof)
    const frontWindowGeo = new THREE.PlaneGeometry(0.85, 0.9);
    const frontWindow = new THREE.Mesh(frontWindowGeo, glassMat);
    frontWindow.position.set(0, 0.75, 0.71);
    cabGroup.add(frontWindow);

    const sideWindowGeo = new THREE.PlaneGeometry(1.2, 0.85);
    const sideWindow = new THREE.Mesh(sideWindowGeo, glassMat);
    sideWindow.position.set(-0.48, 0.75, 0);
    sideWindow.rotation.y = -Math.PI / 2;
    cabGroup.add(sideWindow);

    // Operator seat inside
    const seatGeo = new THREE.BoxGeometry(0.45, 0.6, 0.45);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.8 });
    const seatMesh = new THREE.Mesh(seatGeo, seatMat);
    seatMesh.position.set(0, 0.45, 0);
    cabGroup.add(seatMesh);

    this.turret.add(cabGroup);

    // Twin LED High-power Spotlights
    const lightFixtureGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12);
    lightFixtureGeo.rotateX(Math.PI / 2);

    [-0.3, 0.6].forEach((xPos, idx) => {
      const fixture = new THREE.Mesh(lightFixtureGeo, darkChassisMat);
      fixture.position.set(xPos, 1.5, 0.8);
      this.turret.add(fixture);

      // SpotLight
      const spot = new THREE.SpotLight(0xfff4d6, 6.0, 38, Math.PI / 6, 0.35, 1.2);
      spot.position.set(xPos, 1.5, 0.9);
      spot.target.position.set(xPos, 0.2, 12);
      this.turret.add(spot);
      this.turret.add(spot.target);

      // Volumetric beam cone
      const coneGeo = new THREE.ConeGeometry(1.6, 12, 16, 1, true);
      coneGeo.rotateX(-Math.PI / 2);
      coneGeo.translate(0, 0, 6);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfffae0,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(xPos, 1.5, 0.9);
      this.turret.add(coneMesh);

      if (idx === 0) {
        this.leftLight = spot;
        this.leftLightCone = coneMesh;
      } else {
        this.rightLight = spot;
        this.rightLightCone = coneMesh;
      }
    });

    // -------------------------------------------------------------
    // 3. ARTICULATED BOOM (MAIN ARM)
    // -------------------------------------------------------------
    // Boom mount brackets on turret
    const boomMountGeo = new THREE.BoxGeometry(0.5, 0.6, 0.6);
    const boomMount = new THREE.Mesh(boomMountGeo, darkChassisMat);
    boomMount.position.set(0.1, 0.6, 0.7);
    this.turret.add(boomMount);

    // Boom pivot located at boom mount
    this.boom.position.set(0.1, 0.7, 0.7);

    // Curved Boom Main Beam
    const boomBeamGeo = new THREE.BoxGeometry(0.38, 0.5, 4.2);
    const boomBeam = new THREE.Mesh(boomBeamGeo, yellowPaintMat);
    boomBeam.position.set(0, 1.2, 1.8);
    boomBeam.rotation.x = 0.52; // Angle upward
    boomBeam.castShadow = true;
    this.boom.add(boomBeam);

    // Dual Boom Hydraulic Cylinders (Left & Right)
    [-0.24, 0.24].forEach((xSide, idx) => {
      const cylGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12);
      cylGeo.rotateX(Math.PI / 2);
      const cylMesh = new THREE.Mesh(cylGeo, hydraulicCylinderMat);
      cylMesh.position.set(xSide, 0.1, 0.6);
      cylMesh.rotation.x = 0.45;
      cylMesh.castShadow = true;
      this.boom.add(cylMesh);

      const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 12);
      rodGeo.rotateX(Math.PI / 2);
      const rodMesh = new THREE.Mesh(rodGeo, chromeMat);
      rodMesh.position.set(xSide, 0.35, 1.1);
      rodMesh.rotation.x = 0.45;
      rodMesh.castShadow = true;
      this.boom.add(rodMesh);

      if (idx === 0) this.boomPistonRodLeft = rodMesh;
      else this.boomPistonRodRight = rodMesh;
    });

    // -------------------------------------------------------------
    // 4. DIPPER / STICK ARM
    // -------------------------------------------------------------
    // Stick pivot at the top tip of the boom
    this.stick.position.set(0, 2.2, 3.4);

    const stickBeamGeo = new THREE.BoxGeometry(0.32, 0.42, 3.0);
    const stickBeam = new THREE.Mesh(stickBeamGeo, yellowPaintMat);
    stickBeam.position.set(0, -0.9, 0.9);
    stickBeam.rotation.x = -0.7; // Angle downward
    stickBeam.castShadow = true;
    this.stick.add(stickBeam);

    // Stick Hydraulic Cylinder
    const stickCylGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12);
    stickCylGeo.rotateX(Math.PI / 2);
    const stickCyl = new THREE.Mesh(stickCylGeo, hydraulicCylinderMat);
    stickCyl.position.set(0, 0.3, 0.8);
    stickCyl.rotation.x = -0.35;
    this.stick.add(stickCyl);

    const stickRodGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.2, 12);
    stickRodGeo.rotateX(Math.PI / 2);
    this.stickPistonRod = new THREE.Mesh(stickRodGeo, chromeMat);
    this.stickPistonRod.position.set(0, 0.1, 1.4);
    this.stickPistonRod.rotation.x = -0.35;
    this.stick.add(this.stickPistonRod);

    // -------------------------------------------------------------
    // 5. HEAVY EXCAVATOR BUCKET WITH DIGGING TEETH
    // -------------------------------------------------------------
    // Bucket pivot at the lower tip of the stick
    this.bucket.position.set(0, -1.8, 1.8);

    const bucketGroup = new THREE.Group();

    // Curved bucket back shell
    const bucketShellGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 14, 1, false, 0, Math.PI * 1.25);
    bucketShellGeo.rotateZ(Math.PI / 2);
    const bucketShell = new THREE.Mesh(bucketShellGeo, bucketHardenedSteelMat);
    bucketShell.castShadow = true;
    bucketGroup.add(bucketShell);

    // Bucket side plates
    [-0.45, 0.45].forEach((zSide) => {
      const sidePlateGeo = new THREE.CircleGeometry(0.54, 12);
      sidePlateGeo.rotateY(Math.PI / 2);
      const sidePlate = new THREE.Mesh(sidePlateGeo, bucketHardenedSteelMat);
      sidePlate.position.set(zSide, 0, 0);
      sidePlate.castShadow = true;
      bucketGroup.add(sidePlate);
    });

    // 5 Heavy Hardened Steel Excavating Teeth
    for (let i = -2; i <= 2; i++) {
      const toothGeo = new THREE.ConeGeometry(0.065, 0.38, 5);
      toothGeo.rotateX(Math.PI / 2);
      const tooth = new THREE.Mesh(toothGeo, bucketTeethMat);
      tooth.position.set(i * 0.18, -0.42, 0.65);
      tooth.rotation.x = 0.5;
      tooth.castShadow = true;
      bucketGroup.add(tooth);
    }

    this.bucket.add(bucketGroup);
    this.stick.add(this.bucket);
    this.boom.add(this.stick);
    this.turret.add(this.boom);
    this.group.add(this.turret);

    // Apply default starting pose
    this.applyKinematics();
  }

  public applyKinematics() {
    this.turret.rotation.y = this.turretAngle;
    this.boom.rotation.x = this.boomAngle;
    this.stick.rotation.x = this.stickAngle;
    this.bucket.rotation.x = this.bucketAngle;
  }

  public scrollTracks(distance: number) {
    if (this.trackTexture) {
      this.trackTexture.offset.y = (this.trackTexture.offset.y + distance * 0.4) % 1;
    }
  }

  public startDigStrike() {
    if (this.isStriking) return;
    this.isStriking = true;
    this.strikeProgress = 0;
  }

  public update(delta: number) {
    if (this.isStriking) {
      this.strikeProgress += delta * this.strikeSpeed;
      if (this.strikeProgress < 1.0) {
        // Wind-up: raise boom, curl back
        const p = this.strikeProgress;
        this.boomAngle = THREE.MathUtils.lerp(-0.3, -0.65, Math.sin(p * Math.PI));
        this.stickAngle = THREE.MathUtils.lerp(0.6, 0.2, Math.sin(p * Math.PI));
        this.bucketAngle = THREE.MathUtils.lerp(-0.4, 0.2, Math.sin(p * Math.PI));
      } else if (this.strikeProgress < 2.0) {
        // Power smash down!
        const p = this.strikeProgress - 1.0;
        this.boomAngle = THREE.MathUtils.lerp(-0.65, 0.15, p);
        this.stickAngle = THREE.MathUtils.lerp(0.2, 1.15, p);
        this.bucketAngle = THREE.MathUtils.lerp(0.2, -0.9, p);
      } else if (this.strikeProgress < 3.0) {
        // Scooping / curl through
        const p = this.strikeProgress - 2.0;
        this.bucketAngle = THREE.MathUtils.lerp(-0.9, 0.6, p);
      } else {
        // Return smoothly to idle
        this.isStriking = false;
        this.boomAngle = -0.3;
        this.stickAngle = 0.6;
        this.bucketAngle = -0.4;
      }
      this.applyKinematics();
    }
  }

  public getBucketWorldPosition(targetVec: THREE.Vector3): THREE.Vector3 {
    return this.bucket.getWorldPosition(targetVec);
  }
}
