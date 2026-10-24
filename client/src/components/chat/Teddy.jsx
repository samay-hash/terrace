import { useEffect, useRef, useState } from "react";
import { Chotu } from "./Chotu.jsx";
import styles from "./Teddy.module.css";

const supportsWebGL = (() => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
})();

// Chotu as a live 3D teddy. three.js is loaded on demand; the canvas only
// renders while it's on screen and the tab is visible; reduced-motion users
// get a still pose; browsers without WebGL see the flat illustration.
export function Teddy({ size = 64, mood = "idle", framing = "head", follow = true, className = "", label = "Chotu, the Terrace assistant" }) {
  const hostRef = useRef(null);
  const moodRef = useRef(mood);
  const [failed, setFailed] = useState(!supportsWebGL);
  moodRef.current = mood;

  useEffect(() => {
    if (failed) return undefined;
    let disposed = false;
    let cleanup = () => {};

    import("./teddyScene.js")
      .then(({ createTeddy, animateTeddy, disposeScene, createRenderer, createClock }) => {
        if (disposed || !hostRef.current) return;
        const host = hostRef.current;
        const renderer = createRenderer(size);
        host.appendChild(renderer.domElement);

        const { scene, camera, parts } = createTeddy({ framing });
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pointer = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        let visible = true;
        let frame = 0;
        const clock = createClock();

        const onPointer = (e) => {
          if (!follow) return;
          const rect = host.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
          target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
        };

        const tick = () => {
          frame = 0;
          if (!visible || document.hidden) return;
          pointer.x += (target.x - pointer.x) * 0.1;
          pointer.y += (target.y - pointer.y) * 0.1;
          animateTeddy(parts, clock.getElapsedTime(), { mood: moodRef.current, pointer });
          renderer.render(scene, camera);
          frame = requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !frame && !reduce) frame = requestAnimationFrame(tick);
        });
        observer.observe(host);

        if (reduce) {
          animateTeddy(parts, 0.5, { mood: "idle", pointer });
          renderer.render(scene, camera);
        } else {
          window.addEventListener("pointermove", onPointer, { passive: true });
          frame = requestAnimationFrame(tick);
        }
        const onVisibility = () => !document.hidden && !frame && !reduce && (frame = requestAnimationFrame(tick));
        document.addEventListener("visibilitychange", onVisibility);

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          window.removeEventListener("pointermove", onPointer);
          document.removeEventListener("visibilitychange", onVisibility);
          disposeScene(scene);
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [size, framing, follow, failed]);

  if (failed) return <Chotu size={size} mood={mood === "talking" ? "talking" : mood === "thinking" ? "thinking" : "idle"} className={className} />;

  return <span ref={hostRef} className={`${styles.teddy} ${className}`} style={{ width: size, height: size }} role="img" aria-label={label} />;
}

// Small still avatar for chat bubbles.
export function TeddyAvatar({ size = 28, className = "" }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!supportsWebGL) return;
    let live = true;
    import("./teddyScene.js").then(({ teddySnapshot }) => live && setSrc(teddySnapshot())).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!supportsWebGL) return <Chotu size={size} className={className} />;
  return src ? (
    <img className={`${styles.avatar} ${className}`} src={src} alt="" width={size} height={size} />
  ) : (
    <span className={`${styles.avatar} ${className}`} style={{ width: size, height: size }} />
  );
}
