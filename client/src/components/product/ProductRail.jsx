import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "./ProductCard.jsx";
import styles from "./ProductRail.module.css";

// Horizontally scrolling row of product cards with previous/next controls.
// Native scrolling (touch, trackpad, keyboard) keeps working; the buttons
// just move one "page" of cards.
export function ProductRail({ products, loading, label }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const update = () =>
      setEdges({ start: track.scrollLeft <= 4, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 });
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [products, loading]);

  const scroll = (dir) => {
    const track = trackRef.current;
    track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={styles.rail}>
      <div className={styles.controls}>
        <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Previous ${label}`}>
          <ArrowLeft size={18} />
        </button>
        <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={`Next ${label}`}>
          <ArrowRight size={18} />
        </button>
      </div>
      <ul ref={trackRef} className={`${styles.track} no-scrollbar`} aria-label={label}>
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))
          : products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
      </ul>
    </div>
  );
}
