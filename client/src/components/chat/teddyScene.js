// Builds Chotu, the 3D teddy, from simple shapes. Kept separate from the
// React component so three.js is only downloaded when a teddy is shown.
import {
  CapsuleGeometry,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from "three";

const FUR = "#a8754c";
const FUR_DARK = "#8a5c39";
const CREAM = "#f0dcc0";
const SCARF = "#2b4a3f";
const BRASS = "#c9a25e";

function ellipsoid(radius, scale, material, position) {
  const mesh = new Mesh(new SphereGeometry(radius, 48, 32), material);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  return mesh;
}

export function createTeddy({ framing = "head" } = {}) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(framing === "head" ? 30 : 32, 1, 0.1, 50);
  camera.position.set(0, framing === "head" ? 0.15 : -0.55, framing === "head" ? 6.2 : 8.4);
  camera.lookAt(0, framing === "head" ? 0.05 : -0.6, 0);

  // Soft studio lighting with a warm key and a cool rim.
  scene.add(new HemisphereLight("#fff6ea", "#5a4636", 1.25));
  const key = new DirectionalLight("#ffffff", 1.6);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rim = new DirectionalLight("#cfe3ff", 0.9);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  const fur = new MeshStandardMaterial({ color: FUR, roughness: 0.92 });
  const furDark = new MeshStandardMaterial({ color: FUR_DARK, roughness: 0.95 });
  const cream = new MeshStandardMaterial({ color: CREAM, roughness: 0.9 });
  const gloss = new MeshStandardMaterial({ color: "#1b1410", roughness: 0.18, metalness: 0.1 });
  const white = new MeshBasicMaterial({ color: "#ffffff" });
  const blush = new MeshStandardMaterial({ color: "#e88f86", roughness: 1, transparent: true, opacity: 0.55 });
  const scarf = new MeshStandardMaterial({ color: SCARF, roughness: 0.8 });
  const brass = new MeshStandardMaterial({ color: BRASS, roughness: 0.35, metalness: 0.6 });

  const root = new Group();
  scene.add(root);

  // Body
  const body = new Group();
  body.add(ellipsoid(1, [0.95, 1.02, 0.85], fur, [0, -1.75, 0]));
  body.add(ellipsoid(1, [0.6, 0.66, 0.4], cream, [0, -1.82, 0.5]));
  const armL = ellipsoid(0.36, [1, 1.45, 1], fur, [-0.92, -1.55, 0.25]);
  armL.rotation.z = 0.5;
  const armR = ellipsoid(0.36, [1, 1.45, 1], fur, [0.92, -1.55, 0.25]);
  armR.rotation.z = -0.5;
  body.add(armL, armR);
  body.add(ellipsoid(0.42, [1, 0.8, 1.15], fur, [-0.48, -2.65, 0.25]), ellipsoid(0.42, [1, 0.8, 1.15], fur, [0.48, -2.65, 0.25]));
  body.add(ellipsoid(0.24, [1, 1, 0.4], cream, [-0.48, -2.68, 0.68]), ellipsoid(0.24, [1, 1, 0.4], cream, [0.48, -2.68, 0.68]));
  root.add(body);

  // Scarf with a brass ring, in the store's colours
  const scarfRing = new Mesh(new TorusGeometry(0.72, 0.17, 20, 64), scarf);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.set(0, -0.86, 0.02);
  scarfRing.scale.set(1, 0.92, 1);
  root.add(scarfRing);
  const tail = ellipsoid(0.2, [0.9, 1.6, 0.45], scarf, [0.32, -1.18, 0.66]);
  tail.rotation.z = -0.25;
  root.add(tail);
  root.add(new Mesh(new TorusGeometry(0.1, 0.035, 12, 32), brass).translateX(0.28).translateY(-0.92).translateZ(0.72));

  // Head
  const head = new Group();
  head.position.y = 0.05;
  head.add(ellipsoid(1, [1.08, 0.98, 0.98], fur, [0, 0, 0]));
  const earL = new Group();
  earL.position.set(-0.78, 0.74, -0.08);
  earL.add(ellipsoid(0.36, [1, 1, 0.75], fur, [0, 0, 0]), ellipsoid(0.22, [1, 1, 0.5], furDark, [0, 0, 0.16]));
  const earR = new Group();
  earR.position.set(0.78, 0.74, -0.08);
  earR.add(ellipsoid(0.36, [1, 1, 0.75], fur, [0, 0, 0]), ellipsoid(0.22, [1, 1, 0.5], furDark, [0, 0, 0.16]));
  head.add(earL, earR);

  head.add(ellipsoid(0.48, [1.05, 0.78, 0.7], cream, [0, -0.3, 0.74]));
  head.add(ellipsoid(0.15, [1.35, 0.95, 0.9], gloss, [0, -0.14, 1.07]));
  const mouth = ellipsoid(0.07, [1.6, 0.6, 0.5], gloss, [0, -0.44, 1.0]);
  head.add(mouth);

  const eyes = new Group();
  for (const x of [-0.37, 0.37]) {
    const eye = new Group();
    eye.position.set(x, 0.14, 0.86);
    eye.add(ellipsoid(0.115, [1, 1.12, 0.7], gloss, [0, 0, 0]));
    eye.add(ellipsoid(0.035, [1, 1, 0.5], white, [0.035, 0.05, 0.075]));
    eyes.add(eye);
  }
  head.add(eyes);

  // Little angled brows keep Chotu's famously grumpy face.
  const brows = new Group();
  for (const side of [-1, 1]) {
    const brow = new Mesh(new CapsuleGeometry(0.035, 0.2, 6, 12), furDark);
    brow.rotation.z = Math.PI / 2 + side * 0.38;
    brow.position.set(side * 0.37, 0.37, 0.86);
    brows.add(brow);
  }
  head.add(brows);
  head.add(ellipsoid(0.13, [1.2, 0.7, 0.3], blush, [-0.62, -0.18, 0.8]), ellipsoid(0.13, [1.2, 0.7, 0.3], blush, [0.62, -0.18, 0.8]));
  root.add(head);

  if (framing === "head") root.position.y = 0.05;

  const parts = { root, head, eyes, brows, mouth, earL, earR, armL, armR };
  return { scene, camera, parts };
}

// Moves the teddy for one frame. `pointer` is -1..1 on both axes.
export function animateTeddy(parts, t, { mood, pointer }) {
  const { root, head, eyes, brows, mouth, earL, earR, armR } = parts;
  const thinking = mood === "thinking";
  const talking = mood === "talking";
  const happy = mood === "happy";

  root.position.y = (root.userData.baseY ??= root.position.y) + Math.sin(t * 1.6) * 0.04;
  const targetY = pointer.x * 0.45 + (thinking ? Math.sin(t * 2.2) * 0.25 : 0);
  const targetX = -pointer.y * 0.25 + (thinking ? -0.12 : 0);
  head.rotation.y += (targetY - head.rotation.y) * 0.08;
  head.rotation.x += (targetX - head.rotation.x) * 0.08;
  head.rotation.z = Math.sin(t * 0.9) * 0.04 + (thinking ? 0.12 : 0);

  // Blink every few seconds.
  const blink = t % 4.2 < 0.12 ? 0.1 : 1;
  eyes.scale.y += (blink - eyes.scale.y) * 0.5;

  brows.position.y = thinking ? -0.04 + Math.sin(t * 6) * 0.015 : happy ? 0.05 : 0;
  mouth.scale.y = talking ? 0.6 + Math.abs(Math.sin(t * 12)) * 1.4 : happy ? 0.4 : 0.6;
  earL.rotation.z = happy ? Math.sin(t * 10) * 0.2 : Math.sin(t * 1.3) * 0.03;
  earR.rotation.z = happy ? -Math.sin(t * 10) * 0.2 : -Math.sin(t * 1.3) * 0.03;
  armR.rotation.z = happy ? -1.6 + Math.sin(t * 8) * 0.3 : -0.5;
}

export function createRenderer(size, { preserve = false } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size, size);
  renderer.outputColorSpace = SRGBColorSpace;
  return renderer;
}

export function createClock() {
  return new Clock();
}

export function disposeScene(scene) {
  scene.traverse((obj) => {
    obj.geometry?.dispose();
    if (obj.material) [].concat(obj.material).forEach((m) => m.dispose());
  });
}

let snapshot;
// A still image of the teddy for small avatars, rendered once and cached so
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
