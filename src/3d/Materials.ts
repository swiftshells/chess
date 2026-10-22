import * as THREE from 'three';

/**
 * Procedural texture generators for Nordic Wood aesthetics.
 * Creates procedural canvas textures for birch wood, smoked walnut, and board borders.
 */

function createWoodTexture(
  baseColor: string,
  grainColor: string,
  fiberCount = 200,
  noiseIntensity = 0.08
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Draw natural elongated wood grain lines
  ctx.fillStyle = grainColor;
  for (let i = 0; i < fiberCount; i++) {
    const y = Math.random() * 512;
    const thickness = 0.5 + Math.random() * 2.5;
    const alpha = 0.04 + Math.random() * 0.12;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // Draw subtle wave
    ctx.bezierCurveTo(
      150, y + (Math.random() - 0.5) * 20,
      350, y + (Math.random() - 0.5) * 20,
      512, y + (Math.random() - 0.5) * 10
    );
    ctx.lineWidth = thickness;
    ctx.strokeStyle = grainColor;
    ctx.stroke();
  }

  // Add micro-noise flecks
  ctx.globalAlpha = noiseIntensity;
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRadialContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(10, 8, 6, 0.65)');
  gradient.addColorStop(0.5, 'rgba(10, 8, 6, 0.25)');
  gradient.addColorStop(1, 'rgba(10, 8, 6, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class MaterialManager {
  public birchTexture: THREE.CanvasTexture;
  public walnutTexture: THREE.CanvasTexture;
  public borderTexture: THREE.CanvasTexture;
  public shadowTexture: THREE.CanvasTexture;

  public whitePieceMaterial: THREE.MeshStandardMaterial;
  public blackPieceMaterial: THREE.MeshStandardMaterial;

  public whiteSquareMaterial: THREE.MeshStandardMaterial;
  public blackSquareMaterial: THREE.MeshStandardMaterial;
  public borderMaterial: THREE.MeshStandardMaterial;
  public brassInlayMaterial: THREE.MeshStandardMaterial;

  public selectSquareMaterial: THREE.MeshStandardMaterial;
  public legalMoveMaterial: THREE.MeshBasicMaterial;
  public lastMoveMaterial: THREE.MeshStandardMaterial;
  public checkSquareMaterial: THREE.MeshStandardMaterial;

  public shadowMaterial: THREE.MeshBasicMaterial;

  constructor(maxAnisotropy: number = 8) {
    this.birchTexture = createWoodTexture('#EFE5D5', '#D6C4AD', 260, 0.05);
    this.walnutTexture = createWoodTexture('#3A271C', '#24160E', 280, 0.08);
    this.borderTexture = createWoodTexture('#20150F', '#120B07', 300, 0.06);
    this.shadowTexture = createRadialContactShadowTexture();

    [this.birchTexture, this.walnutTexture, this.borderTexture].forEach((t) => {
      t.anisotropy = maxAnisotropy;
    });

    // Materials for Staunton Pieces
    this.whitePieceMaterial = new THREE.MeshStandardMaterial({
      color: 0xF3EADE,
      map: this.birchTexture,
      roughness: 0.32,
      metalness: 0.06,
    });

    this.blackPieceMaterial = new THREE.MeshStandardMaterial({
      color: 0x473224,
      map: this.walnutTexture,
      roughness: 0.38,
      metalness: 0.06,
    });

    // Board Square Materials
    this.whiteSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0xEDE2CF,
      map: this.birchTexture,
      roughness: 0.42,
      metalness: 0.04,
    });

    this.blackSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0x442F22,
      map: this.walnutTexture,
      roughness: 0.45,
      metalness: 0.04,
    });

    this.borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x221711,
      map: this.borderTexture,
      roughness: 0.5,
      metalness: 0.05,
    });

    this.brassInlayMaterial = new THREE.MeshStandardMaterial({
      color: 0xD8B065,
      roughness: 0.22,
      metalness: 0.88,
    });

    // Interactive overlays
    this.selectSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8A838,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.5,
    });

    this.legalMoveMaterial = new THREE.MeshBasicMaterial({
      color: 0x62A06E,
      transparent: true,
      opacity: 0.75,
    });

    this.lastMoveMaterial = new THREE.MeshStandardMaterial({
      color: 0xCDA34F,
      roughness: 0.3,
      transparent: true,
      opacity: 0.35,
    });

    this.checkSquareMaterial = new THREE.MeshStandardMaterial({
      color: 0xD94545,
      roughness: 0.2,
      transparent: true,
      opacity: 0.65,
    });

    this.shadowMaterial = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
  }

  public dispose() {
    this.birchTexture.dispose();
    this.walnutTexture.dispose();
    this.borderTexture.dispose();
    this.shadowTexture.dispose();

    this.whitePieceMaterial.dispose();
    this.blackPieceMaterial.dispose();
    this.whiteSquareMaterial.dispose();
    this.blackSquareMaterial.dispose();
    this.borderMaterial.dispose();
    this.brassInlayMaterial.dispose();
    this.selectSquareMaterial.dispose();
    this.legalMoveMaterial.dispose();
    this.lastMoveMaterial.dispose();
    this.checkSquareMaterial.dispose();
    this.shadowMaterial.dispose();
  }
}
