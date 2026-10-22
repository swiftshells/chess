import * as THREE from 'three';
import { PieceType, PieceColor } from '../types/chess';
import { MaterialManager } from './Materials';

/**
 * Procedural 3D Staunton Piece Generator.
 * Implements 3-12 part composite assemblies per piece (THREE.Group)
 * with grounded bottom-center pivots (Y=0).
 */

export class PieceFactory {
  private materials: MaterialManager;

  constructor(materials: MaterialManager) {
    this.materials = materials;
  }

  public createPiece(type: PieceType, color: PieceColor): THREE.Group {
    const group = new THREE.Group();
    group.name = `piece_${color}_${type}`;
    const mat = color === 'w' ? this.materials.whitePieceMaterial : this.materials.blackPieceMaterial;

    switch (type) {
      case 'p':
        this.buildPawn(group, mat);
        break;
      case 'r':
        this.buildRook(group, mat);
        break;
      case 'n':
        this.buildKnight(group, mat, color);
        break;
      case 'b':
        this.buildBishop(group, mat);
        break;
      case 'q':
        this.buildQueen(group, mat);
        break;
      case 'k':
        this.buildKing(group, mat);
        break;
    }

    // Contact shadow plane beneath the piece
    const shadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.materials.shadowMaterial);
    shadowMesh.position.y = 0.005; // avoid z-fighting
    shadowMesh.renderOrder = 1;
    group.add(shadowMesh);

    // Apply shadow casting to all child meshes
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== shadowMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  private buildPawn(group: THREE.Group, mat: THREE.Material) {
    // 1. Base pedestal ring
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.08, 24), mat);
    base.position.y = 0.04;
    group.add(base);

    // 2. Base tier step
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.06, 24), mat);
    step.position.y = 0.11;
    group.add(step);

    // 3. Tapered column body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.34, 24), mat);
    body.position.y = 0.31;
    group.add(body);

    // 4. Neck collar torus
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 12, 24), mat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.49;
    group.add(collar);

    // 5. Spherical dome head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 20), mat);
    head.position.y = 0.65;
    group.add(head);
  }

  private buildRook(group: THREE.Group, mat: THREE.Material) {
    // 1. Flared circular base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.1, 24), mat);
    base.position.y = 0.05;
    group.add(base);

    // 2. Base tier step
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.08, 24), mat);
    step.position.y = 0.14;
    group.add(step);

    // 3. Castle tower cylinder stem
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.26, 0.48, 24), mat);
    tower.position.y = 0.42;
    group.add(tower);

    // 4. Rampart flared corbel
    const corbel = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.22, 0.12, 24), mat);
    corbel.position.y = 0.72;
    group.add(corbel);

    // 5. Crenellated parapet ring with 4 battlements
    const parapetRing = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 24), mat);
    parapetRing.position.y = 0.84;
    group.add(parapetRing);

    // Embrasures / battlements
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
      battlement.position.set(
        Math.cos(angle) * 0.24,
        0.94,
        Math.sin(angle) * 0.24
      );
      group.add(battlement);
    }
  }

  private buildKnight(group: THREE.Group, mat: THREE.Material, color: PieceColor) {
    // 1. Plinth base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.37, 0.09, 24), mat);
    base.position.y = 0.045;
    group.add(base);

    // 2. Base bevel step
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.33, 0.08, 24), mat);
    step.position.y = 0.13;
    group.add(step);

    // 3. Knight horse chest / neck assembly
    const horseContainer = new THREE.Group();

    // Sculpted neck
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.42, 16);
    neckGeo.scale(1, 1, 1.4);
    const neck = new THREE.Mesh(neckGeo, mat);
    neck.position.set(0, 0.36, -0.04);
    neck.rotation.x = -0.15;
    horseContainer.add(neck);

    // Arched head & jaw
    const headGeo = new THREE.BoxGeometry(0.18, 0.26, 0.34);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.set(0, 0.62, 0.06);
    head.rotation.x = 0.35;
    horseContainer.add(head);

    // Muzzle / snout
    const snoutGeo = new THREE.BoxGeometry(0.14, 0.16, 0.22);
    const snout = new THREE.Mesh(snoutGeo, mat);
    snout.position.set(0, 0.54, 0.24);
    snout.rotation.x = 0.4;
    horseContainer.add(snout);

    // Mane ridge
    const maneGeo = new THREE.BoxGeometry(0.06, 0.42, 0.14);
    const mane = new THREE.Mesh(maneGeo, mat);
    mane.position.set(0, 0.52, -0.16);
    mane.rotation.x = -0.2;
    horseContainer.add(mane);

    // Left & Right perked ears
    const earGeo = new THREE.ConeGeometry(0.05, 0.12, 8);
    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.07, 0.78, -0.04);
    leftEar.rotation.z = -0.15;
    horseContainer.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.07, 0.78, -0.04);
    rightEar.rotation.z = 0.15;
    horseContainer.add(rightEar);

    // Orient knight toward the center of the board based on color
    if (color === 'b') {
      horseContainer.rotation.y = Math.PI;
    }

    group.add(horseContainer);
  }

  private buildBishop(group: THREE.Group, mat: THREE.Material) {
    // 1. Circular base plinth
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.37, 0.09, 24), mat);
    base.position.y = 0.045;
    group.add(base);

    // 2. Base step
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.08, 24), mat);
    step.position.y = 0.13;
    group.add(step);

    // 3. Slender tapered column
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.52, 24), mat);
    column.position.y = 0.43;
    group.add(column);

    // 4. Neck collar ring
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 12, 24), mat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.71;
    group.add(collar);

    // 5. Oval mitre head
    const mitreGeo = new THREE.SphereGeometry(0.19, 24, 20);
    mitreGeo.scale(1, 1.45, 1);
    const mitre = new THREE.Mesh(mitreGeo, mat);
    mitre.position.y = 0.96;
    group.add(mitre);

    // 6. Mitre diagonal slit (accent cutout appearance)
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.22, 0.14),
      mat
    );
    slit.position.set(0.1, 1.0, 0);
    slit.rotation.z = 0.55;
    group.add(slit);

    // 7. Apex spherical finial / bead
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), mat);
    finial.position.y = 1.18;
    group.add(finial);
  }

  private buildQueen(group: THREE.Group, mat: THREE.Material) {
    // 1. Wide regal base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.4, 0.1, 24), mat);
    base.position.y = 0.05;
    group.add(base);

    // 2. Stepped pedestal
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.35, 0.09, 24), mat);
    step.position.y = 0.145;
    group.add(step);

    // 3. Tapered column body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.27, 0.62, 24), mat);
    body.position.y = 0.5;
    group.add(body);

    // 4. Royal neck collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 12, 24), mat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.83;
    group.add(collar);

    // 5. Flared coronet cup
    const coronet = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.16, 0.2, 24), mat);
    coronet.position.y = 0.95;
    group.add(coronet);

    // 6. 8 coronet peaks with pearl points
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), mat);
      pearl.position.set(
        Math.cos(angle) * 0.25,
        1.07,
        Math.sin(angle) * 0.25
      );
      group.add(pearl);
    }

    // 7. Central coronet finial dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat);
    dome.position.y = 1.1;
    group.add(dome);
  }

  private buildKing(group: THREE.Group, mat: THREE.Material) {
    // 1. Imperial wide base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.11, 24), mat);
    base.position.y = 0.055;
    group.add(base);

    // 2. Stepped pedestal
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, 0.1, 24), mat);
    step.position.y = 0.16;
    group.add(step);

    // 3. Towering tapered column
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.29, 0.68, 24), mat);
    body.position.y = 0.55;
    group.add(body);

    // 4. Primary royal collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 12, 24), mat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.91;
    group.add(collar);

    // 5. Regal imperial cup
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.24, 24), mat);
    cup.position.y = 1.05;
    group.add(cup);

    // 6. Domed head
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 18), mat);
    dome.position.y = 1.18;
    group.add(dome);

    // 7. Maltese cross finial (vertical post + crossbar)
    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.05), mat);
    crossVert.position.y = 1.38;
    group.add(crossVert);

    const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.05), mat);
    crossHoriz.position.y = 1.41;
    group.add(crossHoriz);
  }
}
