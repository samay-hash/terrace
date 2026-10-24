import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage.js";

const KEY = "terrace.recent";
const MAX = 12;

// Remembers product slugs the shopper opened, most recent first, and returns
// the list without the product currently on screen.
export function useRecentlyViewed(currentSlug) {
  const [slugs, setSlugs] = useState(() => readJSON(KEY, []));

  useEffect(() => {
    if (!currentSlug) return;
    const next = [currentSlug, ...readJSON(KEY, []).filter((s) => s !== currentSlug)].slice(0, MAX);
    writeJSON(KEY, next);
    setSlugs(next);
  }, [currentSlug]);

  return slugs.filter((s) => s !== currentSlug);
}
