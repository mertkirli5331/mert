import * as THREE from 'three';

/**
 * High-performance procedural particle & debris physics system.
 * Handles diesel smoke puffs, track dust, rock shatters, impact sparks, and victory confetti.
 */

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
  type: 'rock' | 'smoke' | 'spark' | 'confetti' | 'lava';
}

export class DebrisSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];

  // Shared geometries & materials to avoid GC
  private rockGeo: THREE.DodecahedronGeometry;
  private rockMat: THREE.MeshStandardMaterial;
  private sparkGeo: THREE.SphereGeometry;
  private sparkMat: THREE.MeshBasicMaterial;
  private smokeGeo: THREE.SphereGeometry;
  private smokeMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.rockGeo = new THREE.DodecahedronGeometry(0.2, 0);
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x6e6053,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.sparkGeo = new THREE.SphereGeometry(0.06, 6, 6);
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });

    this.smokeGeo = new THREE.SphereGeometry(0.18, 8, 8);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.45,
    });
  }

  public spawnRockExplosion(pos: THREE.Vector3, count: number = 14, color: number = 0x6e6053) {
    const mat = this.rockMat.clone();
    mat.color.setHex(color);

    for (let i = 0; i < count; i++) {
      const scale = 0.4 + Math.random() * 0.9;
      const mesh = new THREE.Mesh(this.rockGeo, mat);
      mesh.scale.setScalar(scale);
      mesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.2,
        (Math.random() - 0.5) * 1.5
      ));
      mesh.castShadow = true;

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        5 + Math.random() * 8,
        Math.sin(angle) * speed
      );

      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vel,
        rotVel,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        type: 'rock',
      });
    }

    // Also spawn impact sparks
    this.spawnSparks(pos, 10);
  }

  public spawnSparks(pos: THREE.Vector3, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        4 + Math.random() * 8,
        (Math.random() - 0.5) * 10
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vel,
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        type: 'spark',
      });
    }
  }

  public spawnExhaustPuff(pos: THREE.Vector3, intensity: number = 1.0) {
    const mesh = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.4 + intensity * 0.3);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.6,
      2.0 + Math.random() * 1.5,
      -1.5 - Math.random() * 1.0
    );

    this.group.add(mesh);
    this.particles.push({
      mesh,
      vel,
      rotVel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.7 + Math.random() * 0.4,
      type: 'smoke',
    });
  }

  public update(delta: number) {
    const gravity = -18;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      if (p.type === 'rock' || p.type === 'spark') {
        p.vel.y += gravity * delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.rotation.x += p.rotVel.x * delta;
        p.mesh.rotation.y += p.rotVel.y * delta;

        // Simple ground bounce
        if (p.mesh.position.y < 0.2) {
          p.mesh.position.y = 0.2;
          p.vel.y = -p.vel.y * 0.45;
          p.vel.x *= 0.7;
          p.vel.z *= 0.7;
        }
      } else if (p.type === 'smoke') {
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.scale.multiplyScalar(1 + delta * 2.2);
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.45 * (1 - p.life / p.maxLife));
      }
    }
  }

  public clear() {
    this.particles.forEach((p) => this.group.remove(p.mesh));
    this.particles = [];
  }
}
