import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProductsBySlugs } from "../../hooks/queries.js";
import { useScrollProgress } from "../../hooks/useScrollProgress.js";
import { useAddToBag } from "../../hooks/useAddToBag.js";
import { formatPrice } from "../../lib/format.js";
import { Button } from "../ui/Button.jsx";
import styles from "./Hero.module.css";

// What's pointed out in the campaign photo: where it sits (as a percentage
// of the photo's width and height), which way the dotted pointer runs and
// how long it is. Items with a slug are products; the rest link to a shelf.
const LOOK = [
  { id: "watch", slug: "ingenieur-automatic-steel", x: 66.8, y: 76.6, dir: "up", len: 92 },
  { id: "wardrobe", to: "/shop?category=clothing", meta: "The wardrobe edit", chip: "Shirts and dresses", x: 69.6, y: 45, dir: "left", len: 72 },
];

// A dotted line that ends in an arrowhead at the item. Drawn in the
// direction of travel so the moving dots flow towards the product.
function DottedArrow({ dir, len }) {
  const up = dir === "up";
  const w = up ? 12 : len;
  const h = up ? len : 12;
  const line = up ? `M6 0 V${len - 4}` : `M0 6 H${len - 4}`;
  const head = up ? `M1.5 ${len - 8} L6 ${len - 2} L10.5 ${len - 8}` : `M${len - 8} 1.5 L${len - 2} 6 L${len - 8} 10.5`;
  return (
    <svg className={styles.arrow} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
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
    <div className={styles.spot} data-dir={spot.dir} style={{ left: `${spot.x}%`, top: `${spot.y}%`, "--len": `${spot.len}px`, "--delay": `${1100 + index * 240}ms` }}>
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
        {product.brand} {product.name.split(" ")[0]}, <span className="tabular">{formatPrice(product.price)}</span>
      </Link>
      <button type="button" className={styles.order} onClick={order} disabled={pending}>
        {pending ? "Adding…" : "Order now"}
      </button>
    </Pointer>
  );
}

// Campaign hero: the photo covers the screen while keeping the desk and
// wardrobe in frame, with dotted pointers to what can be ordered.
export function CinematicHero() {
  const ref = useRef(null);
  useScrollProgress(ref, { mode: "exit" });
  const { data: products = [] } = useProductsBySlugs(LOOK.filter((s) => s.slug).map((s) => s.slug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section ref={ref} className={styles.cinema} aria-labelledby="hero-title">
      <div className={styles.frame}>
        <div className={styles.photo}>
          <img
            src="/images/editorial/study-1672.webp"
            srcSet="/images/editorial/study-960.webp 960w, /images/editorial/study-1672.webp 1672w"
            sizes="100vw"
            alt="A dark study at night: a steel watch and a closed laptop on the desk, and a lit wardrobe of shirts and jackets behind"
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

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>The Evening Edit, 2026</p>
          <h1 id="hero-title" className={`display ${styles.title}`}>
            <span className={styles.line}>
              <span>Quiet luxury,</span>
            </span>
            <span className={styles.line}>
              <span>every day.</span>
            </span>
          </h1>
          <p className={styles.lede}>Watches, wardrobe staples and the pieces in between. Chosen in Bengaluru, delivered across India.</p>
          <div className={styles.ctas}>
            <Button to="/shop?sort=newest" size="lg" variant="light">
              Shop the edit
            </Button>
            <Button to="/shop?category=watches" size="lg" variant="glass">
              Explore watches
            </Button>
          </div>
          <ul className={styles.facts}>
            <li>Free 30-day returns</li>
            <li>Cash on delivery</li>
            <li>Dispatched same day</li>
          </ul>
        </div>
      </div>

      <ul className={styles.mobileLook} aria-label="Shop the look">
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
