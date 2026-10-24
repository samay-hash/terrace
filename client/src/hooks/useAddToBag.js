import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

// Adds a line to the bag, opens the bag drawer on success and turns API
// errors (sold out, quantity limits) into a toast the shopper can act on.
export function useAddToBag() {
  const { addItem, openDrawer } = useCart();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function add(line) {
    setPending(true);
    try {
      await addItem(line);
      openDrawer();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setPending(false);
    }
  }

  return { add, pending };
}
