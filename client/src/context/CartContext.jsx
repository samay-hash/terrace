import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api.js";
import { readJSON, removeKey, writeJSON } from "../lib/storage.js";
import { useAuth } from "./AuthContext.jsx";

// Guests keep their bag in this browser (ids, sizes, quantities only).
// Signed-in shoppers keep it on the server. Either way the server prices it.
const GUEST_KEY = "terrace.bag";
const MAX_QTY = 10;
const EMPTY = { items: [], summary: { itemCount: 0, subtotal: 0, shippingFee: 0, total: 0, freeShippingThreshold: 2999, amountToFreeShipping: 2999 } };

const CartContext = createContext(null);

const lineKey = (productId, size) => `${productId}:${size}`;

export function CartProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [guestLines, setGuestLines] = useState(() => readJSON(GUEST_KEY, []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mergedFor = useRef(null);

  const saveGuestLines = useCallback((lines) => {
    setGuestLines(lines);
    if (lines.length) writeJSON(GUEST_KEY, lines);
    else removeKey(GUEST_KEY);
  }, []);

  // Fold the guest bag into the account bag once, right after sign in.
  useEffect(() => {
    if (!user || mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    if (!guestLines.length) return;
    api
      .post("/cart/merge", { items: guestLines })
      .then((cart) => {
        queryClient.setQueryData(["cart", "user"], cart);
        saveGuestLines([]);
      })
      .catch(() => {
        /* keep the guest bag; the shopper can retry by adding again */
      });
  }, [user, guestLines, queryClient, saveGuestLines]);

  useEffect(() => {
    if (!user) mergedFor.current = null;
  }, [user]);

  const userCart = useQuery({
    queryKey: ["cart", "user"],
    queryFn: () => api.get("/cart"),
    enabled: Boolean(user),
  });

  const guestCart = useQuery({
    queryKey: ["cart", "guest", guestLines],
    queryFn: () => api.post("/cart/quote", { items: guestLines }),
    enabled: !user && !authLoading && guestLines.length > 0,
    placeholderData: (previous) => previous,
  });

  const cart = user ? userCart.data ?? EMPTY : guestLines.length ? guestCart.data ?? EMPTY : EMPTY;
  const isLoading = authLoading || (user ? userCart.isLoading : guestLines.length > 0 && guestCart.isLoading);

  const addItem = useCallback(
    async ({ productId, size, quantity = 1 }) => {
      if (user) {
        const next = await api.post("/cart/items", { productId, size, quantity });
        queryClient.setQueryData(["cart", "user"], next);
        return next;
      }

      const existing = guestLines.find((l) => lineKey(l.productId, l.size) === lineKey(productId, size));
      const target = (existing?.quantity ?? 0) + quantity;
      if (target > MAX_QTY) throw new ApiError(400, { error: { message: `You can buy up to ${MAX_QTY} of one item.` } });

      const nextLines = existing
        ? guestLines.map((l) => (l === existing ? { ...l, quantity: target } : l))
        : [...guestLines, { productId, size, quantity }];

      // Ask the server before committing, so guests see the same stock rules.
      const quote = await api.post("/cart/quote", { items: nextLines });
      const line = quote.items.find((i) => lineKey(i.productId, i.size) === lineKey(productId, size));
      if (line?.issue === "unavailable") throw new ApiError(404, { error: { message: "This product is no longer available." } });
      if (line?.issue === "out_of_stock" || line?.issue === "size") throw new ApiError(409, { error: { message: `Size ${size} is sold out.` } });
      if (line?.issue === "limited") {
        throw new ApiError(409, { error: { message: `Only ${line.available} left in size ${size}.` } });
      }

      saveGuestLines(nextLines);
      queryClient.setQueryData(["cart", "guest", nextLines], quote);
      return quote;
    },
    [user, guestLines, queryClient, saveGuestLines],
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      if (user) {
        const next = await api.patch(`/cart/items/${item.id}`, { quantity });
        queryClient.setQueryData(["cart", "user"], next);
        return;
      }
      saveGuestLines(guestLines.map((l) => (lineKey(l.productId, l.size) === lineKey(item.productId, item.size) ? { ...l, quantity } : l)));
    },
    [user, guestLines, queryClient, saveGuestLines],
  );

  const removeItem = useCallback(
    async (item) => {
      if (user) {
        const next = await api.delete(`/cart/items/${item.id}`);
        queryClient.setQueryData(["cart", "user"], next);
        return;
      }
      saveGuestLines(guestLines.filter((l) => lineKey(l.productId, l.size) !== lineKey(item.productId, item.size)));
    },
    [user, guestLines, queryClient, saveGuestLines],
  );

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["cart"] }), [queryClient]);

  const value = useMemo(
    () => ({
      cart,
      itemCount: cart.summary.itemCount,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      refresh,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [cart, isLoading, addItem, updateQuantity, removeItem, refresh, drawerOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
