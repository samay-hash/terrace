import { Link, useNavigate } from "react-router-dom";
import { useProductsBySlugs } from "../../hooks/queries.js";
import { useAddToBag } from "../../hooks/useAddToBag.js";
import { formatPrice } from "../../lib/format.js";
import { Button } from "../ui/Button.jsx";
import styles from "./Hero.module.css";

// What's pointed out in the campaign photo: where it sits (as a percentage
// of the photo's width and height), which side the label sits on and how
// long the dotted pointer is. Items with a slug are products; the rest link
// to a shelf.
const LOOK = [
  { id: "watch", slug: "cellini-date-black-dial", x: 88.9, y: 78.9, dir: "left", len: 72 },
  { id: "wardrobe", to: "/shop?category=clothing", meta: "The wardrobe edit", chip: "Shirts and dresses", x: 79.5, y: 35, dir: "right", len: 72 },
];

// A dotted line that ends in an arrowhead at the item. Drawn in the
// direction of travel so the moving dots flow towards the product.
function DottedArrow({ dir, len }) {
  const line = dir === "left" ? `M0 6 H${len - 4}` : `M${len} 6 H4`;
  const head = dir === "left" ? `M${len - 8} 1.5 L${len - 2} 6 L${len - 8} 10.5` : `M8 1.5 L2 6 L8 10.5`;
  return (
    <svg className={styles.arrow} width={len} height={12} viewBox={`0 0 ${len} 12`} aria-hidden>
      <path className={styles.dots} d={line} />
      <path className={styles.head} d={head} />
    </svg>
  );
}

function useOrderNow(product) {
  const navigate = useNavigate();
  const { add, pending } = useAddToBag();
  // One-size pieces go straight to checkout; sized ones need a size first.
  async function order() {
    if (product.sizes.length !== 1) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (await add({ productId: product.id, size: product.sizes[0].label, quantity: 1 })) navigate("/checkout");
  }
  return { order, pending };
}

function Pointer({ spot, index, children }) {
  return (
    <div className={styles.spot} data-dir={spot.dir} style={{ left: `${spot.x}%`, top: `${spot.y}%`, "--len": `${spot.len}px`, "--delay": `${1300 + index * 240}ms` }}>
      <span className={styles.ring} aria-hidden />
      <DottedArrow dir={spot.dir} len={spot.len} />
      <div className={styles.label}>{children}</div>
    </div>
  );
}

function ProductPointer({ spot, product, index }) {
  const { order, pending } = useOrderNow(product);
  return (
    <Pointer spot={spot} index={index}>
      <Link to={`/product/${product.slug}`} className={styles.meta}>
        {product.brand}, <span className="tabular">{formatPrice(product.price)}</span>
      </Link>
      <button type="button" className={styles.order} onClick={order} disabled={pending}>
        {pending ? "Adding…" : "Order now"}
      </button>
    </Pointer>
  );
}

// Campaign hero: a sunlit study. The words sit on the curtain in the middle
// of the frame; the watch and the wardrobe carry dotted "Order now" pointers.
export function CinematicHero() {
  const { data: products = [] } = useProductsBySlugs(LOOK.filter((s) => s.slug).map((s) => s.slug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section className={styles.cinema} aria-labelledby="hero-title">
      <div className={styles.frame}>
        <div className={styles.photo}>
          <img
            src="/images/editorial/curtain-1672.webp"
            srcSet="/images/editorial/curtain-960.webp 960w, /images/editorial/curtain-1672.webp 1672w"
            sizes="100vw"
            alt="Late sun through a cream curtain onto a dark desk with a laptop and a watch, beside a lit wardrobe of shirts and jackets"
            fetchPriority="high"
          />
          {LOOK.map((spot, i) => {
            if (!spot.slug) {
              return (
                <Pointer key={spot.id} spot={spot} index={i}>
                  <span className={styles.meta}>{spot.meta}</span>
                  <Link to={spot.to} className={styles.order}>
                    Order now
                  </Link>
                </Pointer>
              );
            }
            const product = bySlug.get(spot.slug);
            return product && <ProductPointer key={spot.id} spot={spot} product={product} index={i} />;
          })}
        </div>
      </div>

      <div className={styles.copy}>
        <p className={styles.kicker}>The Evening Edit</p>
        <h1 id="hero-title" className={`display ${styles.title}`}>
          <span className={styles.line}>
            <span>Quiet luxury,</span>
          </span>
          <span className={styles.line}>
            <span>every day.</span>
          </span>
        </h1>
        <Button to="/shop?sort=newest" size="lg" className={styles.cta}>
          Shop the edit
        </Button>
      </div>

      <ul className={styles.mobileLook} aria-label="Order from the photo">
        {LOOK.map((spot) => {
          const p = spot.slug && bySlug.get(spot.slug);
          if (spot.slug && !p) return null;
          return (
            <li key={spot.id}>
              <Link to={p ? `/product/${p.slug}` : spot.to}>
                <span>{p ? `${p.brand}, ${formatPrice(p.price)}` : spot.chip}</span>
                Order now
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
