import * as THREE from 'three';

/**
 * 3D Princess Model & Cursed Iron Cage.
 * Rendered at the end of Level 3 for the dramatic rescue sequence.
 */

export class PrincessModel {
  public group: THREE.Group;
  public cageGroup: THREE.Group;
  public princessMesh: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public tiara: THREE.Mesh;
  public cageBars: THREE.Mesh[] = [];
  public isRescued: boolean = false;
  private cheerTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.cageGroup = new THREE.Group();
    this.princessMesh = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();

    // Tiara placeholder initialized in build
    this.tiara = new THREE.Mesh();

    this.buildPrincess();
    this.buildCursedCage();

    this.group.add(this.cageGroup);
    this.group.add(this.princessMesh);
  }

  private buildPrincess() {
    // Princess Royal Dress (Velvet Rose & Gold Silk)
    const dressMat = new THREE.MeshStandardMaterial({
      color: 0xeb4d90,
      roughness: 0.35,
      metalness: 0.15,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.9,
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.5,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xf5cf47, // Golden blonde royal hair
      roughness: 0.4,
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a75ff });

    // Lower gown cone
    const gownGeo = new THREE.ConeGeometry(0.7, 1.4, 20);
    const gown = new THREE.Mesh(gownGeo, dressMat);
    gown.position.y = 0.7;
    gown.castShadow = true;
    gown.receiveShadow = true;
    this.princessMesh.add(gown);

    // Gold dress trim ring
    const trimGeo = new THREE.TorusGeometry(0.68, 0.04, 8, 24);
    trimGeo.rotateX(Math.PI / 2);
    const trim = new THREE.Mesh(trimGeo, goldMat);
    trim.position.y = 0.15;
    this.princessMesh.add(trim);

    // Torso / Bodice
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.65, 16);
    const torso = new THREE.Mesh(torsoGeo, dressMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    this.princessMesh.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.15;
    head.castShadow = true;
    this.princessMesh.add(head);

    // Eyes
    [-0.09, 0.09].forEach((xPos) => {
      const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xPos, 2.18, 0.25);
      this.princessMesh.add(eye);
    });

    // Golden Hair volume
    const hairGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 2.2, -0.05);
    hair.scale.set(1.05, 1.15, 1.05);
    this.princessMesh.add(hair);

    // Long braids / hair locks
    [-0.2, 0.2].forEach((xPos) => {
      const braidGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.9, 10);
      const braid = new THREE.Mesh(braidGeo, hairMat);
      braid.position.set(xPos, 1.7, 0.05);
      braid.rotation.z = xPos > 0 ? -0.15 : 0.15;
      this.princessMesh.add(braid);
    });

    // Royal Golden Tiara / Crown with ruby jewel
    const tiaraGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.12, 6, 1, true);
    this.tiara = new THREE.Mesh(tiaraGeo, goldMat);
    this.tiara.position.set(0, 2.45, -0.02);
    this.princessMesh.add(this.tiara);

    const rubyGeo = new THREE.OctahedronGeometry(0.05);
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xaa0022,
      roughness: 0.1,
    });
    const ruby = new THREE.Mesh(rubyGeo, rubyMat);
    ruby.position.set(0, 2.5, 0.18);
    this.princessMesh.add(ruby);

    // Left and Right Arms
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10);
    armGeo.translate(0, -0.3, 0);

    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.32, 1.85, 0);
    this.leftArm.rotation.z = 0.3;
    this.leftArm.add(leftArmMesh);
    this.princessMesh.add(this.leftArm);

    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.32, 1.85, 0);
    this.rightArm.rotation.z = -0.3;
    this.rightArm.add(rightArmMesh);
    this.princessMesh.add(this.rightArm);

    // Princess platform
    const daisGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.35, 24);
    const daisMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a40,
      roughness: 0.4,
      metalness: 0.6,
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = 0.17;
    dais.receiveShadow = true;
    this.princessMesh.add(dais);
  }

  private buildCursedCage() {
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x222228,
      roughness: 0.3,
      metalness: 0.9,
    });

    const glowCrystalMat = new THREE.MeshStandardMaterial({
      color: 0xaa00ff,
      emissive: 0x6600cc,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Cage base and roof ring
    const ringGeo = new THREE.TorusGeometry(1.15, 0.08, 10, 24);
    ringGeo.rotateX(Math.PI / 2);
    const baseRing = new THREE.Mesh(ringGeo, ironMat);
    baseRing.position.y = 0.35;
    this.cageGroup.add(baseRing);

    const topRing = new THREE.Mesh(ringGeo, ironMat);
    topRing.position.y = 2.9;
    this.cageGroup.add(topRing);

    // Vertical Iron Bars
    const barGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.6, 8);
    const barCount = 12;
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const bar = new THREE.Mesh(barGeo, ironMat);
      bar.position.set(Math.cos(angle) * 1.15, 1.62, Math.sin(angle) * 1.15);
      bar.castShadow = true;
      this.cageBars.push(bar);
      this.cageGroup.add(bar);
    }

    // Dome cage roof
    const domeGeo = new THREE.SphereGeometry(1.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x222228,
      wireframe: true,
      roughness: 0.5,
      metalness: 0.8,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 2.9;
    this.cageGroup.add(dome);

    // Cursed lock crystal on front
    const lockCrystalGeo = new THREE.OctahedronGeometry(0.35);
    const lockCrystal = new THREE.Mesh(lockCrystalGeo, glowCrystalMat);
    lockCrystal.position.set(0, 1.6, 1.2);
    this.cageGroup.add(lockCrystal);
  }

  public breakCage() {
    this.isRescued = true;
    // Animate cage bars flying outward / vanishing
    this.cageBars.forEach((bar, idx) => {
      bar.position.y -= 10; // Dismiss under ground
    });
    this.cageGroup.visible = false;
  }

  public update(delta: number) {
    if (this.isRescued) {
      this.cheerTime += delta * 5;
      // Princess cheers with arms waving joyfully!
      this.leftArm.rotation.z = Math.PI * 0.75 + Math.sin(this.cheerTime) * 0.4;
      this.rightArm.rotation.z = -Math.PI * 0.75 - Math.cos(this.cheerTime) * 0.4;
      this.princessMesh.position.y = Math.abs(Math.sin(this.cheerTime * 0.8)) * 0.25;
    } else {
      // Gentle weeping / waiting animation
      this.cheerTime += delta * 1.5;
      this.princessMesh.position.y = Math.sin(this.cheerTime) * 0.03;
      this.leftArm.rotation.z = 0.3 + Math.sin(this.cheerTime) * 0.05;
      this.rightArm.rotation.z = -0.3 - Math.sin(this.cheerTime) * 0.05;
    }
  }
}
