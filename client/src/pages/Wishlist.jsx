import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useProductsBySlugs } from "../hooks/queries.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { pluralize } from "../lib/format.js";
import { ProductGrid } from "../components/product/ProductCard.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState } from "../components/ui/Feedback.jsx";
import styles from "./Wishlist.module.css";

export default function Wishlist() {
  useDocumentTitle("Wishlist");
  const { slugs } = useWishlist();
  const { data: items = [], isLoading, error, refetch } = useProductsBySlugs(slugs);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={`display ${styles.title}`}>Wishlist</h1>
        <p className={styles.sub}>
          {slugs.length ? `${pluralize(slugs.length, "saved item")}. Saved on this device; prices and stock are always current.` : "Tap the heart on any product to save it here."}
        </p>
      </header>

      {!slugs.length ? (
        <EmptyState
          icon={<Heart size={24} />}
          title="Nothing saved yet"
          action={
            <Button to="/shop" variant="dark">
              Start browsing
            </Button>
          }
        >
          Save things you like while you shop and compare them here later.
        </EmptyState>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <ProductGrid products={items} loading={isLoading} skeletonCount={Math.min(slugs.length, 8)} />
      )}
    </div>
  );
}
