import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "../../hooks/queries.js";
import { assetUrl } from "../../lib/api.js";
import { Button } from "../ui/Button.jsx";
import { Price, Rating } from "../ui/Controls.jsx";
import { Skeleton } from "../ui/Feedback.jsx";
import styles from "./Hero.module.css";

const TINTS = ["var(--tint-sand)", "var(--tint-sage)", "var(--tint-mist)", "var(--tint-blush)"];

// The product stage: four featured products the shopper can flip through.
// Nothing moves on its own; the stage only changes when someone picks a tab.
function ProductStage() {
  const { data, isLoading } = useProducts({ featured: "true", inStock: "true", sort: "rating", limit: 4 });
  const items = data?.items ?? [];
  const [index, setIndex] = useState(0);
  const active = items[index] ?? items[0];

  if (isLoading) {
    return (
      <div className={styles.stageWrap}>
        <Skeleton className={styles.stageSkeleton} height="auto" radius="var(--radius-xl)" />
      </div>
    );
  }
  if (!active) return null;

  return (
    <div className={styles.stageWrap}>
      <div className={styles.stage} style={{ "--tint": TINTS[index % TINTS.length] }} role="tabpanel" id="stage-panel" aria-live="polite">
        <div className={styles.stageTop}>
          <span className={styles.stageBrand}>{active.brand}</span>
          <span className={styles.stageCount} aria-hidden>
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <Link to={`/product/${active.slug}`} className={styles.stageMedia} aria-label={active.name}>
          <img key={active.id} className="product-photo" src={assetUrl(active.images[0]?.url)} alt={active.name} width="900" height="900" fetchPriority="high" />
        </Link>
        <div className={styles.stageInfo}>
          <div>
            <Link to={`/product/${active.slug}`} className={styles.stageName}>
              {active.name}
            </Link>
            <div className={styles.stageMeta}>
              <Price price={active.price} compareAtPrice={active.compareAtPrice} />
              <Rating value={active.rating} count={active.reviewCount} size={12} />
            </div>
          </div>
          <Link to={`/product/${active.slug}`} className={styles.stageGo} aria-label={`View ${active.name}`}>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Featured products">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls="stage-panel"
            className={styles.tab}
            onClick={() => setIndex(i)}
            onMouseEnter={() => setIndex(i)}
            style={{ "--tint": TINTS[i % TINTS.length] }}
          >
            <span className={styles.tabMedia}>
              <img className="product-photo" src={assetUrl(p.images[0]?.url)} alt="" width="120" height="120" />
            </span>
            <span className={styles.tabText}>
              <span>{p.category?.name}</span>
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <div className={styles.copy}>
        <Link to="/shop?sort=newest" className={styles.pill}>
          <span className={styles.dot} aria-hidden /> New arrivals every Friday
        </Link>
        <h1 className={`display ${styles.title}`}>Gear that keeps up with you.</h1>
        <p className={styles.lede}>
          Trainers, watches, eyewear, bags and sports kit from brands we trust, chosen by a small team in Bengaluru. Free returns for 30
          days and cash on delivery across India.
        </p>
        <div className={styles.ctas}>
          <Button to="/shop?sort=newest" size="lg">
            Shop new in
          </Button>
          <Button to="/shop" size="lg" variant="secondary">
            Browse everything
          </Button>
        </div>
      </div>
      <ProductStage />
    </section>
  );
}
