import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage.js";
import { useToast } from "./ToastContext.jsx";

// Saved items live in this browser (slugs only); prices and stock are always
// fetched fresh when the wishlist is shown.
const KEY = "terrace.wishlist";
const MAX_ITEMS = 50;

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const toast = useToast();
  const [slugs, setSlugs] = useState(() => readJSON(KEY, []).filter((s) => typeof s === "string").slice(0, MAX_ITEMS));

  const save = useCallback((next) => {
    setSlugs(next);
    writeJSON(KEY, next);
  }, []);

  const toggle = useCallback(
    (product) => {
      if (slugs.includes(product.slug)) {
        save(slugs.filter((s) => s !== product.slug));
        toast.success(`Removed ${product.name} from your wishlist.`);
      } else {
        save([product.slug, ...slugs].slice(0, MAX_ITEMS));
        toast.success(`Saved ${product.name} to your wishlist.`);
      }
    },
    [slugs, save, toast],
  );

  const value = useMemo(
    () => ({ slugs, count: slugs.length, has: (slug) => slugs.includes(slug), toggle, remove: (slug) => save(slugs.filter((s) => s !== slug)) }),
    [slugs, toggle, save],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
