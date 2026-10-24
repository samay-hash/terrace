import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { Drawer } from "../ui/Overlay.jsx";
import { Button } from "../ui/Button.jsx";
import { EmptyState, Spinner } from "../ui/Feedback.jsx";
import { CartLine } from "./CartLine.jsx";
import { FreeShippingMeter, SummaryRows } from "./CartSummary.jsx";
import styles from "./Cart.module.css";

export function CartDrawer() {
  const { cart, itemCount, isLoading, drawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();
  const hasItems = cart.items.length > 0;
  const blocked = cart.items.some((i) => i.issue && i.issue !== "limited");

  const go = (path) => {
    closeDrawer();
    navigate(path);
  };

  return (
    <Drawer
      open={drawerOpen}
      onClose={closeDrawer}
      title={`Your bag${itemCount ? ` (${itemCount})` : ""}`}
      footer={
        hasItems && (
          <div className={styles.drawerFoot}>
            <SummaryRows summary={cart.summary} />
            <Button block size="lg" onClick={() => go("/checkout")} disabled={blocked}>
              Checkout
            </Button>
            <Button block variant="secondary" onClick={() => go("/cart")}>
              View bag
            </Button>
          </div>
        )
      }
    >
      {isLoading ? (
        <div className={styles.center}>
          <Spinner label="Loading your bag" />
        </div>
      ) : hasItems ? (
        <>
          <FreeShippingMeter summary={cart.summary} />
          <ul className={styles.lines}>
            {cart.items.map((item) => (
              <CartLine key={item.id ?? `${item.productId}:${item.size}`} item={item} compact onNavigate={closeDrawer} />
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Your bag is empty"
          action={
            <Button variant="dark" onClick={() => go("/shop")}>
              Start shopping
            </Button>
          }
        >
          Pick a shirt, choose your size and it will wait here for you.
        </EmptyState>
      )}
    </Drawer>
  );
}
