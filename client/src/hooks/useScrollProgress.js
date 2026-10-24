import { useEffect } from "react";

// Writes how far an element has travelled through the viewport to a CSS
// custom property, so scrolling never causes a React re-render.
//   mode "through" (default): 0 when it enters at the bottom, 1 when it leaves at the top
//   mode "exit": 0 while its top is at or below the top of the screen, 1 once it has scrolled away
// Reduced-motion users get a fixed value.
export function useScrollProgress(ref, { mode = "through" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--progress", mode === "exit" ? "0" : "0.5");
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const raw = mode === "exit" ? -rect.top / rect.height : (window.innerHeight - rect.top) / (rect.height + window.innerHeight);
      const progress = Math.min(1, Math.max(0, raw));
      el.style.setProperty("--progress", progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, mode]);
}
