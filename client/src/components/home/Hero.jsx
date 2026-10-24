import { useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Truck, Banknote } from "lucide-react";
import { useProducts } from "../../hooks/queries.js";
import { useAddToBag } from "../../hooks/useAddToBag.js";
import { assetUrl } from "../../lib/api.js";
import { Button } from "../ui/Button.jsx";
import { Price } from "../ui/Controls.jsx";
import { Skeleton } from "../ui/Feedback.jsx";
import styles from "./Hero.module.css";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

// Chalk markings of a pitch, drawn in once when the page loads.
function PitchLines() {
  return (
    <svg className={styles.lines} viewBox="0 0 400 520" preserveAspectRatio="none" aria-hidden>
      <rect x="20" y="20" width="360" height="480" />
      <line x1="20" y1="260" x2="380" y2="260" />
      <circle cx="200" cy="260" r="54" />
      <circle cx="200" cy="260" r="2.5" className={styles.spot} />
      <rect x="100" y="20" width="200" height="78" />
      <rect x="150" y="20" width="100" height="30" />
      <path d="M160 98 A48 48 0 0 0 240 98" />
      <rect x="100" y="422" width="200" height="78" />
      <rect x="150" y="470" width="100" height="30" />
      <path d="M160 422 A48 48 0 0 1 240 422" />
    </svg>
  );
}

function KitOfTheWeek() {
  const featured = useProducts({ featured: "true", inStock: "true", sort: "popular", limit: 1 });
  // If nothing is marked featured, fall back to the bestseller.
  const needsFallback = featured.isSuccess && !featured.data.items.length;
  const fallback = useProducts({ inStock: "true", sort: "popular", limit: 1 }, { enabled: needsFallback });
  const product = featured.data?.items?.[0] ?? fallback.data?.items?.[0];
  const isLoading = featured.isLoading || (needsFallback && fallback.isLoading);
  const { add, pending } = useAddToBag();
  const sizes = product ? [...product.sizes].filter((s) => s.stock > 0).sort((a, b) => SIZE_ORDER.indexOf(a.label) - SIZE_ORDER.indexOf(b.label)) : [];
  const [size, setSize] = useState(null);
  const chosen = size ?? sizes.find((s) => s.label === "M")?.label ?? sizes[0]?.label;
  const image = product?.images?.[1] ?? product?.images?.[0];

  return (
    <div className={styles.board}>
      <PitchLines />
      <span className={styles.tag}>Kit of the week</span>

      {isLoading ? (
        <div className={styles.card}>
          <Skeleton height="100%" radius="var(--radius-md)" />
        </div>
      ) : !product ? (
        <div className={styles.info}>
          <p className={styles.infoName}>New shirts are being hung on the rails.</p>
          <Button to="/shop" size="sm" variant="dark">
            Browse the shop
          </Button>
        </div>
      ) : (
        <>
          <Link to={`/product/${product.slug}`} className={styles.card} aria-label={product.name}>
            <img src={assetUrl(image.url)} alt={image.alt || product.name} width="600" height="750" fetchPriority="high" />
          </Link>

          <div className={styles.info}>
            <div className={styles.infoTop}>
              <div>
                <p className={styles.infoTeam}>{product.team}</p>
                <Link to={`/product/${product.slug}`} className={styles.infoName}>
                  {product.name}
                </Link>
              </div>
              <Price price={product.price} compareAtPrice={product.compareAtPrice} />
            </div>
            <div className={styles.quick}>
              <div className={styles.quickSizes} role="radiogroup" aria-label="Size">
                {sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    role="radio"
                    aria-checked={chosen === s.label}
                    onClick={() => setSize(s.label)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Button size="sm" loading={pending} onClick={() => add({ productId: product.id, size: chosen, quantity: 1 })}>
                Add to bag
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <div className={styles.copy}>
        <Link to="/shop?sort=newest" className={styles.pill}>
          <span className={styles.dot} aria-hidden /> Season 26/27 shirts are in
        </Link>
        <h1 className={`display ${styles.title}`}>
          Kit for
          <br />
          the stands.
        </h1>
        <p className={styles.lede}>
          Original football, cricket and basketball shirts, plus faithful tributes to the classics. Designed in Bengaluru with our own
          crests, priced for people who buy a ticket every week.
        </p>
        <div className={styles.ctas}>
          <Button to="/shop?sort=newest" size="lg">
            Shop new season
          </Button>
          <Button to="/shop?category=retro" size="lg" variant="secondary">
            Browse retro
          </Button>
        </div>
        <ul className={styles.promises}>
          <li>
            <RotateCcw size={18} aria-hidden /> Free 30-day returns
          </li>
          <li>
            <Banknote size={18} aria-hidden /> Cash on delivery
          </li>
          <li>
            <Truck size={18} aria-hidden /> Same-day dispatch before 2 pm
          </li>
        </ul>
      </div>
      <KitOfTheWeek />
    </section>
  );
}
