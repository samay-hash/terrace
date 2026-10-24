import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProductsBySlugs } from "../../hooks/queries.js";
import { useScrollProgress } from "../../hooks/useScrollProgress.js";
import { useAddToBag } from "../../hooks/useAddToBag.js";
import { formatPrice } from "../../lib/format.js";
import { Button } from "../ui/Button.jsx";
import styles from "./Hero.module.css";

// Products worn in the campaign photo, with where they sit in the image (as
// a percentage of the photo's width and height) and which side the label
// opens towards.
const LOOK = [
  { slug: "cellini-date-black-dial", label: "The watch", x: 70.2, y: 54.4, side: "left" },
  { slug: "out-of-office-low-sneakers", label: "The trainers", x: 91.6, y: 76.5, side: "left" },
];

function Hotspot({ spot, product, index }) {
  const navigate = useNavigate();
  const { add, pending } = useAddToBag();
  if (!product) return null;
  const oneSize = product.sizes.length === 1;

  // One-size items go straight to checkout; sized items need a size first.
  async function buyNow() {
    if (!oneSize) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (await add({ productId: product.id, size: product.sizes[0].label, quantity: 1 })) navigate("/checkout");
  }

  return (
    <div className={styles.spot} data-side={spot.side} style={{ left: `${spot.x}%`, top: `${spot.y}%`, "--delay": `${1100 + index * 220}ms` }}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.leader} aria-hidden />
      <div className={styles.tag}>
        <span className={styles.tagLabel}>{spot.label}</span>
        <Link to={`/product/${product.slug}`} className={styles.tagName}>
          {product.name}
        </Link>
        <div className={styles.tagRow}>
          <span className="tabular">{formatPrice(product.price)}</span>
          <button type="button" className={styles.buy} onClick={buyNow} disabled={pending}>
            {pending ? "Adding…" : oneSize ? "Buy now" : "Choose size"}
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

// Campaign hero: the photo covers the screen while keeping the model in
// frame, and the products he wears are tagged where they appear.
export function CinematicHero() {
  const ref = useRef(null);
  useScrollProgress(ref, { mode: "exit" });
  const { data: products = [] } = useProductsBySlugs(LOOK.map((s) => s.slug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section ref={ref} className={styles.cinema} aria-labelledby="hero-title">
      <div className={styles.frame}>
        <div className={styles.photo}>
          <img
            src="/images/editorial/look-1672.webp"
            srcSet="/images/editorial/look-960.webp 960w, /images/editorial/look-1672.webp 1672w"
            sizes="100vw"
            alt="A man in black resting on dark rocks at dusk, wearing a black watch and white leather trainers, a laptop beside him"
            fetchPriority="high"
          />
          {LOOK.map((spot, i) => (
            <Hotspot key={spot.slug} spot={spot} product={bySlug.get(spot.slug)} index={i} />
          ))}
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
              <span>made to move.</span>
            </span>
          </h1>
          <p className={styles.lede}>Watches, trainers and the everyday pieces in between. Chosen in Bengaluru, delivered across India.</p>
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
          const p = bySlug.get(spot.slug);
          return (
            p && (
              <li key={spot.slug}>
                <Link to={`/product/${p.slug}`}>
                  <span>{spot.label}</span>
                  {p.name}
                </Link>
              </li>
            )
          );
        })}
      </ul>
    </section>
  );
}
