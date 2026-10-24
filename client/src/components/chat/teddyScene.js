// Builds the assistant, a small polar bear, from soft rounded shapes. Kept
// separate from the React component so three.js is only downloaded when the
// bear is shown.
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  CircleGeometry,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from "three";

const FUR = "#f5f1ea";
const FUR_SHADE = "#e9e2d6";
const MUZZLE = "#fffcf6";
const INNER_EAR = "#ecd3cb";
const PAD = "#d9c8bf";
const SCARF = "#2b4a3f";
const BRASS = "#c9a25e";

function ellipsoid(radius, scale, material, position) {
  const mesh = new Mesh(new SphereGeometry(radius, 64, 48), material);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  return mesh;
}

// Plush fur: a soft physical material whose sheen catches the rim light,
// which is what makes white read as fluffy rather than plastic.
function plush(color) {
  return new MeshPhysicalMaterial({ color, roughness: 0.9, sheen: 1, sheenRoughness: 0.55, sheenColor: "#ffffff" });
}

// A blurred disc under the feet so the bear sits on something.
function contactShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(40, 28, 16, 0.32)");
  gradient.addColorStop(1, "rgba(40, 28, 16, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const mesh = new Mesh(new CircleGeometry(1, 48), new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(1.25, 0.8, 1);
  mesh.position.set(0, -2.86, 0.1);
  return mesh;
}

export function createTeddy({ framing = "head" } = {}) {
  const scene = new Scene();
  const head = framing === "head";
  const camera = new PerspectiveCamera(head ? 30 : 32, 1, 0.1, 50);
  camera.position.set(0, head ? 0.2 : -0.5, head ? 6.2 : 8.6);
  camera.lookAt(0, head ? 0.02 : -0.62, 0);

  // Warm key, soft fill from the sky and a cool rim that outlines the fur.
  scene.add(new HemisphereLight("#fff8ee", "#b9a58e", 1.35));
  const key = new DirectionalLight("#ffffff", 1.7);
  key.position.set(2.6, 3.2, 4);
  scene.add(key);
  const rim = new DirectionalLight("#dbe8ff", 1.4);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  const fur = plush(FUR);
  const furShade = plush(FUR_SHADE);
  const muzzle = plush(MUZZLE);
  const innerEar = new MeshStandardMaterial({ color: INNER_EAR, roughness: 0.95 });
  const pad = new MeshStandardMaterial({ color: PAD, roughness: 0.95 });
  const gloss = new MeshPhysicalMaterial({ color: "#16120f", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 });
  const white = new MeshBasicMaterial({ color: "#ffffff" });
  const blush = new MeshStandardMaterial({ color: "#f3a49b", roughness: 1, transparent: true, opacity: 0.5 });
  const scarf = new MeshStandardMaterial({ color: SCARF, roughness: 0.75 });
  const brass = new MeshStandardMaterial({ color: BRASS, roughness: 0.3, metalness: 0.7 });

  const root = new Group();
  scene.add(root);

  // Body: a round, sitting shape with a slightly lighter tummy.
  const body = new Group();
  body.add(ellipsoid(1, [0.9, 0.98, 0.82], fur, [0, -1.78, 0]));
  body.add(ellipsoid(1, [0.58, 0.62, 0.36], muzzle, [0, -1.86, 0.52]));
  const armL = ellipsoid(0.34, [1, 1.5, 1], fur, [-0.86, -1.6, 0.26]);
  armL.rotation.z = 0.42;
  const armR = ellipsoid(0.34, [1, 1.5, 1], fur, [0.86, -1.6, 0.26]);
  armR.rotation.z = -0.42;
  body.add(armL, armR);
  for (const x of [-0.46, 0.46]) {
    body.add(ellipsoid(0.4, [1, 0.78, 1.18], furShade, [x, -2.62, 0.28]));
    body.add(ellipsoid(0.2, [1, 1, 0.35], pad, [x, -2.62, 0.72]));
  }
  root.add(body);
  if (!head) root.add(contactShadow());

  // Scarf in the store's green, with a brass ring.
  const scarfRing = new Mesh(new TorusGeometry(0.7, 0.16, 24, 72), scarf);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.set(0, -0.88, 0.02);
  scarfRing.scale.set(1, 0.92, 1);
  root.add(scarfRing);
  const tail = ellipsoid(0.19, [0.9, 1.6, 0.45], scarf, [0.3, -1.2, 0.64]);
  tail.rotation.z = -0.22;
  root.add(tail);
  root.add(new Mesh(new TorusGeometry(0.09, 0.032, 12, 32), brass).translateX(0.27).translateY(-0.94).translateZ(0.7));

  // Head: wide and round, small ears set high, a big soft muzzle.
  const headGroup = new Group();
  headGroup.position.y = 0.05;
  headGroup.add(ellipsoid(1, [1.1, 0.96, 0.96], fur, [0, 0, 0]));
  const earL = new Group();
  earL.position.set(-0.72, 0.7, -0.1);
  earL.add(ellipsoid(0.3, [1, 0.95, 0.7], fur, [0, 0, 0]), ellipsoid(0.17, [1, 0.95, 0.45], innerEar, [0, -0.01, 0.14]));
  const earR = new Group();
  earR.position.set(0.72, 0.7, -0.1);
  earR.add(ellipsoid(0.3, [1, 0.95, 0.7], fur, [0, 0, 0]), ellipsoid(0.17, [1, 0.95, 0.45], innerEar, [0, -0.01, 0.14]));
  headGroup.add(earL, earR);

  headGroup.add(ellipsoid(0.5, [1.08, 0.78, 0.72], muzzle, [0, -0.3, 0.72]));
  headGroup.add(ellipsoid(0.13, [1.35, 0.95, 0.85], gloss, [0, -0.13, 1.07]));
  const mouth = ellipsoid(0.06, [1.5, 0.55, 0.5], gloss, [0, -0.43, 1.0]);
  headGroup.add(mouth);

  const eyes = new Group();
  for (const x of [-0.36, 0.36]) {
    const eye = new Group();
    eye.position.set(x, 0.12, 0.86);
    eye.add(ellipsoid(0.11, [1, 1.1, 0.7], gloss, [0, 0, 0]));
    eye.add(ellipsoid(0.033, [1, 1, 0.5], white, [0.032, 0.045, 0.072]));
    eyes.add(eye);
  }
  headGroup.add(eyes);
  headGroup.add(ellipsoid(0.13, [1.25, 0.7, 0.3], blush, [-0.6, -0.16, 0.8]), ellipsoid(0.13, [1.25, 0.7, 0.3], blush, [0.6, -0.16, 0.8]));
  root.add(headGroup);

  if (head) root.position.y = 0.05;

  const parts = { root, head: headGroup, eyes, mouth, earL, earR, armL, armR };
  return { scene, camera, parts };
}

// Moves the bear for one frame. `pointer` is -1..1 on both axes.
export function animateTeddy(parts, t, { mood, pointer }) {
  const { root, head, eyes, mouth, earL, earR, armR } = parts;
  const thinking = mood === "thinking";
  const talking = mood === "talking";
  const happy = mood === "happy";

  // A slow, breathing bob.
  root.position.y = (root.userData.baseY ??= root.position.y) + Math.sin(t * 1.5) * 0.035;
  root.scale.setScalar(1 + Math.sin(t * 1.5 + 1) * 0.006);

  const targetY = pointer.x * 0.42 + (thinking ? Math.sin(t * 2) * 0.22 : 0);
  const targetX = -pointer.y * 0.22 + (thinking ? -0.14 : 0);
  head.rotation.y += (targetY - head.rotation.y) * 0.08;
  head.rotation.x += (targetX - head.rotation.x) * 0.08;
  head.rotation.z = Math.sin(t * 0.8) * 0.035 + (thinking ? 0.12 : 0);

  // Blink every few seconds.
  const blink = t % 4.4 < 0.12 ? 0.1 : 1;
  eyes.scale.y += (blink - eyes.scale.y) * 0.5;

  mouth.scale.y = talking ? 0.55 + Math.abs(Math.sin(t * 12)) * 1.5 : happy ? 0.35 : 0.55;
  earL.rotation.z = happy ? Math.sin(t * 9) * 0.18 : Math.sin(t * 1.2) * 0.03;
  earR.rotation.z = happy ? -Math.sin(t * 9) * 0.18 : -Math.sin(t * 1.2) * 0.03;
  armR.rotation.z = happy ? -1.55 + Math.sin(t * 7) * 0.28 : -0.42;
}

export function createRenderer(size, { preserve = false } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size, size);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function createClock() {
  return new Clock();
}

export function disposeScene(scene) {
  scene.traverse((obj) => {
    obj.geometry?.dispose();
    if (obj.material) [].concat(obj.material).forEach((m) => {
      m.map?.dispose();
      m.dispose();
    });
  });
}

let snapshot;
// A still image of the bear for small avatars, rendered once and cached so
// chat bubbles don't each need their own WebGL context.
export function teddySnapshot() {
  if (snapshot) return snapshot;
  const renderer = createRenderer(128, { preserve: true });
  const { scene, camera, parts } = createTeddy({ framing: "head" });
  animateTeddy(parts, 0.5, { mood: "idle", pointer: { x: 0, y: 0 } });
  renderer.render(scene, camera);
  snapshot = renderer.domElement.toDataURL("image/png");
  disposeScene(scene);
  renderer.dispose();
  return snapshot;
}
