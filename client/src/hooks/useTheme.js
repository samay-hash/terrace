import { useCallback, useSyncExternalStore } from "react";

const KEY = "terrace.theme";
const META = { light: "#f8f4ec", dark: "#15130f" };
const listeners = new Set();

function current() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[theme]);
  listeners.forEach((fn) => fn());
}

// Follow the system setting until the visitor picks a theme themselves.
if (typeof window !== "undefined" && window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      // storage unavailable: keep following the system
    }
    if (!saved) apply(e.matches ? "dark" : "light");
  });
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// The light/dark theme, stored per browser. public/theme.js sets it before
// the first paint; this keeps React in sync and lets the visitor switch.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light");
  const setTheme = useCallback((next) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode: the choice lasts for this page view only
    }
    apply(next);
  }, []);
  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), [setTheme]);
  return { theme, setTheme, toggle };
}
