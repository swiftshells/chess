import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PieceType, PieceColor, Square, CameraPreset } from '../types/chess';
import { MaterialManager } from './Materials';
import { PieceFactory } from './PieceGeometries';

export interface SceneCallbacks {
  onSquareClicked: (square: Square) => void;
  onPieceSelected: (square: Square) => void;
}

interface PieceObject {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
  group: THREE.Group;
  isCaptured: boolean;
}

interface MoveAnimation {
  piece: PieceObject;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  startTime: number;
  duration: number;
  capturedPiece?: PieceObject;
  onComplete?: () => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function squareToCoords(square: Square): { x: number; z: number } {
  const file = square[0];
  const rank = square[1];
  const fileIndex = FILES.indexOf(file);
  const rankIndex = RANKS.indexOf(rank);

  // a1 is at (-3.5, 3.5), h8 is at (3.5, -3.5)
  const x = fileIndex - 3.5;
  const z = 3.5 - rankIndex;
  return { x, z };
}

export function coordsToSquare(x: number, z: number): Square | null {
  const fileIndex = Math.round(x + 3.5);
  const rankIndex = Math.round(3.5 - z);

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null;
  }
  return `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;
}

export class ChessSceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private materials: MaterialManager;
  private pieceFactory: PieceFactory;

  private pieces: Map<string, PieceObject> = new Map();
  private squareMeshes: Map<Square, THREE.Mesh> = new Map();

  // Highlight overlays
  private selectHighlight!: THREE.Mesh;
  private lastMoveFromHighlight!: THREE.Mesh;
  private lastMoveToHighlight!: THREE.Mesh;
  private checkHighlight!: THREE.Mesh;
  private legalMoveDots: THREE.Mesh[] = [];

  // Animation & Interaction
  private activeAnimation: MoveAnimation | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isInteracting = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // Camera Orbit & Damping
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private targetCameraPos = new THREE.Vector3(0, 8.5, 7.8);
  private currentCameraPos = new THREE.Vector3(0, 8.5, 7.8);
  private cameraRadius = 11.5;
  private cameraTheta = Math.PI / 2; // horizontal rotation
  private cameraPhi = Math.PI / 3.8; // vertical angle

  private callbacks: SceneCallbacks;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Captured pieces counts
  private capturedWhiteCount = 0;
  private capturedBlackCount = 0;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1318);
    this.scene.fog = new THREE.FogExp2(0x0f1318, 0.022);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Materials & Factory
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.materials = new MaterialManager(maxAnisotropy);
    this.pieceFactory = new PieceFactory(this.materials);

    // 5. Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Balanced 3-Point Lighting Rig
    this.setupLighting();

    // 7. Build Board & Overlays
    this.buildBoard();
    this.setupOverlays();

    // 8. Event Listeners
    this.bindEvents();

    // 9. Start Render Loop
    this.animate();
  }

  private setupLighting() {
    // Warm Key Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xFFF3DF, 2.2);
    keyLight.position.set(6, 12, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x768DA8, 0x1E140C, 0.9);
    hemiLight.position.set(0, 15, 0);
    this.scene.add(hemiLight);

    // Back / Rim Light for piece silhouette definition
    const rimLight = new THREE.DirectionalLight(0xE5C79E, 1.2);
    rimLight.position.set(-6, 8, -8);
    this.scene.add(rimLight);
  }

  private buildBoard() {
    const boardGroup = new THREE.Group();
    boardGroup.name = 'board';

    // 64 Individual Squares
    const squareGeo = new THREE.BoxGeometry(1, 0.2, 1);

    for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        const square = `${FILES[fileIdx]}${RANKS[rankIdx]}` as Square;
        const isWhiteSquare = (fileIdx + rankIdx) % 2 === 1;
        const mat = isWhiteSquare
          ? this.materials.whiteSquareMaterial
          : this.materials.blackSquareMaterial;

        const mesh = new THREE.Mesh(squareGeo, mat);
        const { x, z } = squareToCoords(square);
        mesh.position.set(x, -0.1, z);
        mesh.receiveShadow = true;
        mesh.userData = { square };

        this.squareMeshes.set(square, mesh);
        boardGroup.add(mesh);
      }
    }

    // Outer Wooden Rim
    const rimWidth = 9.4;
    const rimGeo = new THREE.BoxGeometry(rimWidth, 0.35, rimWidth);
    const rimMesh = new THREE.Mesh(rimGeo, this.materials.borderMaterial);
    rimMesh.position.set(0, -0.2, 0);
    rimMesh.receiveShadow = true;
    boardGroup.add(rimMesh);

    // Brass Inlay Border Strip
    const brassGeo = new THREE.BoxGeometry(8.2, 0.02, 8.2);
    const brassMesh = new THREE.Mesh(brassGeo, this.materials.brassInlayMaterial);
    brassMesh.position.set(0, -0.015, 0);
    boardGroup.add(brassMesh);

    // Ground plane backdrop beneath the board table
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f14,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.38;
    ground.receiveShadow = true;
    boardGroup.add(ground);

    this.scene.add(boardGroup);
  }

  private setupOverlays() {
    // 1. Selection indicator overlay
    const selectGeo = new THREE.PlaneGeometry(0.98, 0.98);
    selectGeo.rotateX(-Math.PI / 2);
    this.selectHighlight = new THREE.Mesh(selectGeo, this.materials.selectSquareMaterial);
    this.selectHighlight.position.y = 0.006;
    this.selectHighlight.visible = false;
    this.scene.add(this.selectHighlight);

    // 2. Last move from & to highlights
    const lastFromGeo = selectGeo.clone();
    this.lastMoveFromHighlight = new THREE.Mesh(lastFromGeo, this.materials.lastMoveMaterial);
    this.lastMoveFromHighlight.position.y = 0.005;
    this.lastMoveFromHighlight.visible = false;
    this.scene.add(this.lastMoveFromHighlight);

    const lastToGeo = selectGeo.clone();
    this.lastMoveToHighlight = new THREE.Mesh(lastToGeo, this.materials.lastMoveMaterial);
    this.lastMoveToHighlight.position.y = 0.005;
    this.lastMoveToHighlight.visible = false;
    this.scene.add(this.lastMoveToHighlight);

    // 3. King in check highlight
    const checkGeo = selectGeo.clone();
    this.checkHighlight = new THREE.Mesh(checkGeo, this.materials.checkSquareMaterial);
    this.checkHighlight.position.y = 0.007;
    this.checkHighlight.visible = false;
    this.scene.add(this.checkHighlight);

    // 4. Legal move target pool (up to 32 target dots)
    const dotGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24);
    for (let i = 0; i < 32; i++) {
      const dot = new THREE.Mesh(dotGeo, this.materials.legalMoveMaterial);
      dot.position.y = 0.01;
      dot.visible = false;
      this.legalMoveDots.push(dot);
      this.scene.add(dot);
    }
  }

  public setBoardFromFen(fen: string) {
    // Clear existing pieces
    this.pieces.forEach((p) => {
      this.scene.remove(p.group);
    });
    this.pieces.clear();
    this.capturedWhiteCount = 0;
    this.capturedBlackCount = 0;

    const parts = fen.split(' ');
    const boardLayout = parts[0];
    const rows = boardLayout.split('/');

    let pieceIndex = 0;
    for (let r = 0; r < 8; r++) {
      const row = rows[r];
      let fileIdx = 0;

      for (let charIdx = 0; charIdx < row.length; charIdx++) {
        const char = row[charIdx];
        if (char >= '1' && char <= '8') {
          fileIdx += parseInt(char, 10);
        } else {
          const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const type = char.toLowerCase() as PieceType;
          const square = `${FILES[fileIdx]}${RANKS[7 - r]}` as Square;

          const group = this.pieceFactory.createPiece(type, color);
          const { x, z } = squareToCoords(square);
          group.position.set(x, 0, z);
          group.userData = { square, isPiece: true };
          group.traverse((child) => {
            child.userData = { square, isPiece: true };
          });

          const pieceObj: PieceObject = {
            id: `p_${pieceIndex++}_${square}`,
            type,
            color,
            square,
            group,
            isCaptured: false,
          };

          this.pieces.set(square, pieceObj);
          this.scene.add(group);
          fileIdx++;
        }
      }
    }
  }

  public highlightSelectedSquare(square: Square | null) {
    if (!square) {
      this.selectHighlight.visible = false;
      return;
    }
    const { x, z } = squareToCoords(square);
    this.selectHighlight.position.set(x, 0.006, z);
    this.selectHighlight.visible = true;
  }

  public highlightLegalMoves(squares: Square[]) {
    // Hide all dots first
    this.legalMoveDots.forEach((d) => (d.visible = false));

    squares.forEach((sq, idx) => {
      if (idx < this.legalMoveDots.length) {
        const { x, z } = squareToCoords(sq);
        const dot = this.legalMoveDots[idx];
        dot.position.set(x, 0.015, z);
        dot.userData = { square: sq };
        dot.visible = true;
      }
    });
  }

  public highlightLastMove(from: Square | null, to: Square | null) {
    if (!from || !to) {
      this.lastMoveFromHighlight.visible = false;
      this.lastMoveToHighlight.visible = false;
      return;
    }
    const fromCoords = squareToCoords(from);
    this.lastMoveFromHighlight.position.set(fromCoords.x, 0.005, fromCoords.z);
    this.lastMoveFromHighlight.visible = true;

    const toCoords = squareToCoords(to);
    this.lastMoveToHighlight.position.set(toCoords.x, 0.005, toCoords.z);
    this.lastMoveToHighlight.visible = true;
  }

  public highlightCheck(kingSquare: Square | null) {
    if (!kingSquare) {
      this.checkHighlight.visible = false;
      return;
    }
    const { x, z } = squareToCoords(kingSquare);
    this.checkHighlight.position.set(x, 0.007, z);
    this.checkHighlight.visible = true;
  }

  public animateMove(
    from: Square,
    to: Square,
    captured: boolean,
    promotion: PieceType | undefined,
    onComplete?: () => void
  ) {
    const movingPiece = this.pieces.get(from);
    if (!movingPiece) {
      onComplete?.();
      return;
    }

    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);

    const fromPos = new THREE.Vector3(fromCoords.x, 0, fromCoords.z);
    const toPos = new THREE.Vector3(toCoords.x, 0, toCoords.z);

    let capturedPiece: PieceObject | undefined;
    if (captured) {
      capturedPiece = this.pieces.get(to);
      if (capturedPiece) {
        capturedPiece.isCaptured = true;
      }
    }

    // Handle en passant capture target if capturedPiece wasn't on 'to'
    if (captured && !capturedPiece && movingPiece.type === 'p') {
      const epSquare = `${to[0]}${from[1]}` as Square;
      capturedPiece = this.pieces.get(epSquare);
      if (capturedPiece) {
        capturedPiece.isCaptured = true;
        this.pieces.delete(epSquare);
      }
    }

    this.activeAnimation = {
      piece: movingPiece,
      fromPos,
      toPos,
      startTime: performance.now(),
      duration: 320, // 320ms smooth glide
      capturedPiece,
      onComplete: () => {
        // Update map
        this.pieces.delete(from);
        movingPiece.square = to;
        movingPiece.group.userData = { square: to, isPiece: true };
        movingPiece.group.traverse((c) => {
          c.userData = { square: to, isPiece: true };
        });

        // If promotion, swap geometry
        if (promotion && promotion !== movingPiece.type) {
          this.scene.remove(movingPiece.group);
          const newGroup = this.pieceFactory.createPiece(promotion, movingPiece.color);
          newGroup.position.copy(toPos);
          newGroup.userData = { square: to, isPiece: true };
          newGroup.traverse((c) => {
            c.userData = { square: to, isPiece: true };
          });
          this.scene.add(newGroup);
          movingPiece.group = newGroup;
          movingPiece.type = promotion;
        }

        this.pieces.set(to, movingPiece);
        onComplete?.();
      },
    };
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'white':
        this.cameraRadius = 11.2;
        this.cameraTheta = Math.PI / 2;
        this.cameraPhi = Math.PI / 3.6;
        break;
      case 'black':
        this.cameraRadius = 11.2;
        this.cameraTheta = -Math.PI / 2;
        this.cameraPhi = Math.PI / 3.6;
        break;
      case 'perspective':
        this.cameraRadius = 11.5;
        this.cameraTheta = Math.PI / 2.3;
        this.cameraPhi = Math.PI / 3.4;
        break;
      case 'top_down':
        this.cameraRadius = 12.0;
        this.cameraTheta = Math.PI / 2;
        this.cameraPhi = 0.05; // almost vertical
        break;
    }
    this.updateTargetCameraPos();
  }

  private updateTargetCameraPos() {
    // Spherical to Cartesian
    const sinPhi = Math.sin(this.cameraPhi);
    const cosPhi = Math.cos(this.cameraPhi);
    const sinTheta = Math.sin(this.cameraTheta);
    const cosTheta = Math.cos(this.cameraTheta);

    this.targetCameraPos.set(
      this.cameraRadius * sinPhi * cosTheta,
      this.cameraRadius * cosPhi,
      this.cameraRadius * sinPhi * sinTheta
    );
  }

  private bindEvents() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    // Pointer down
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isInteracting = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    // Pointer move
    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.isInteracting) {
        const deltaX = e.clientX - this.prevMouseX;
        const deltaY = e.clientY - this.prevMouseY;

        // Orbit camera if dragged
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          this.cameraTheta -= deltaX * 0.006;
          this.cameraPhi = Math.max(0.08, Math.min(Math.PI / 2.15, this.cameraPhi - deltaY * 0.006));
          this.updateTargetCameraPos();
        }

        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    // Pointer up / Click
    el.addEventListener('pointerup', (e: PointerEvent) => {
      const movedDist = Math.hypot(e.clientX - this.prevMouseX, e.clientY - this.prevMouseY);
      this.isInteracting = false;

      // Allow tap tolerance of 18px so mobile touch taps register cleanly
      if (movedDist < 18) {
        this.handlePointerClick(e);
      }
    });

    // Wheel Zoom
    el.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.cameraRadius = Math.max(6.5, Math.min(18.0, this.cameraRadius + e.deltaY * 0.01));
        this.updateTargetCameraPos();
      },
      { passive: false }
    );

    // Window Resize
    window.addEventListener('resize', this.handleResize);
  }

  private handlePointerClick(e: PointerEvent) {
    if (this.activeAnimation) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all candidate targets: square floor tiles, visible legal move dots, and 3D piece meshes
    const targets: THREE.Object3D[] = [];
    this.squareMeshes.forEach((mesh) => targets.push(mesh));
    this.legalMoveDots.forEach((dot) => {
      if (dot.visible) targets.push(dot);
    });
    this.pieces.forEach((p) => {
      if (!p.isCaptured) {
        p.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            targets.push(child);
          }
        });
      }
    });

    const intersects = this.raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let square = hit.object.userData?.square as Square | undefined;

      // If hit a child piece part, search up hierarchy
      if (!square) {
        let parent = hit.object.parent;
        while (parent && !square) {
          if (parent.userData?.square) {
            square = parent.userData.square as Square;
          }
          parent = parent.parent;
        }
      }

      if (square) {
        this.callbacks.onSquareClicked(square);
      }
    }
  }

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    // Exponential damping on camera position
    this.currentCameraPos.x = THREE.MathUtils.damp(this.currentCameraPos.x, this.targetCameraPos.x, 8, delta);
    this.currentCameraPos.y = THREE.MathUtils.damp(this.currentCameraPos.y, this.targetCameraPos.y, 8, delta);
    this.currentCameraPos.z = THREE.MathUtils.damp(this.currentCameraPos.z, this.targetCameraPos.z, 8, delta);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.cameraTarget);

    // Handle Active Move Animation
    if (this.activeAnimation) {
      const now = performance.now();
      const elapsed = now - this.activeAnimation.startTime;
      const progress = Math.min(1, elapsed / this.activeAnimation.duration);

      // Smooth step easing
      const t = progress * progress * (3 - 2 * progress);

      // Parabolic jump arc
      const currentX = THREE.MathUtils.lerp(this.activeAnimation.fromPos.x, this.activeAnimation.toPos.x, t);
      const currentZ = THREE.MathUtils.lerp(this.activeAnimation.fromPos.z, this.activeAnimation.toPos.z, t);
      const arcHeight = Math.sin(progress * Math.PI) * 0.75;

      this.activeAnimation.piece.group.position.set(currentX, arcHeight, currentZ);

      // Animate captured piece tumble off board
      if (this.activeAnimation.capturedPiece) {
        const capGroup = this.activeAnimation.capturedPiece.group;
        capGroup.rotation.x = progress * 1.2;
        capGroup.rotation.z = progress * 0.8;
        capGroup.position.y = (1 - progress) * 0.4 - progress * 0.5;
        capGroup.scale.setScalar(Math.max(0.01, 1 - progress * 0.7));
      }

      if (progress >= 1) {
        this.activeAnimation.piece.group.position.set(
          this.activeAnimation.toPos.x,
          0,
          this.activeAnimation.toPos.z
        );
        if (this.activeAnimation.capturedPiece) {
          this.scene.remove(this.activeAnimation.capturedPiece.group);
        }
        const done = this.activeAnimation.onComplete;
        this.activeAnimation = null;
        done?.();
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    this.materials.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
