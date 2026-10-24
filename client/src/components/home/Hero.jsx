import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useProducts } from "../../hooks/queries.js";
import { useScrollProgress } from "../../hooks/useScrollProgress.js";
import { assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { photoProps } from "../../lib/photos.js";
import { Button } from "../ui/Button.jsx";
import { Price, Rating } from "../ui/Controls.jsx";
import { Skeleton } from "../ui/Feedback.jsx";
import styles from "./Hero.module.css";

const TINTS = ["var(--tint-sand)", "var(--tint-sage)", "var(--tint-mist)", "var(--tint-blush)"];

// Full-bleed opening image. The headline reveals line by line on load; as
// the visitor scrolls, the photo slowly zooms and the copy drifts up.
export function CinematicHero() {
  const ref = useRef(null);
  useScrollProgress(ref, { mode: "exit" });
  const { data } = useProducts({ featured: "true", inStock: "true", sort: "popular", limit: 1 });
  const pick = data?.items?.[0];

  return (
    <section ref={ref} className={styles.cinema} aria-labelledby="hero-title">
      <div className={styles.cinemaMedia} aria-hidden>
        <img {...photoProps("court")} alt="" fetchPriority="high" />
      </div>
      <div className={`container ${styles.cinemaInner}`}>
        <div className={styles.cinemaCopy}>
          <p className={styles.cinemaKicker}>
            <span>Terrace</span> Sport and street goods, Bengaluru
          </p>
          <h1 id="hero-title" className={`display ${styles.cinemaTitle}`}>
            <span className={styles.line}>
              <span>Gear that keeps</span>
            </span>
            <span className={styles.line}>
              <span>up with you.</span>
            </span>
          </h1>
          <p className={styles.cinemaLede}>
            Trainers, watches, eyewear, bags and sports kit from brands we trust. Free 30-day returns and cash on delivery across India.
          </p>
          <div className={styles.cinemaCtas}>
            <Button to="/shop?sort=newest" size="lg" variant="light">
              Shop new in
            </Button>
            <Link to="/shop" className={styles.ghost}>
              Browse everything <ArrowUpRight size={18} aria-hidden />
            </Link>
          </div>
        </div>

        {pick && (
          <Link to={`/product/${pick.slug}`} className={styles.pick}>
            <span className={styles.pickMedia}>
              <img className="product-photo" src={assetUrl(pick.images[0]?.url)} alt="" width="120" height="120" />
            </span>
            <span className={styles.pickText}>
              <span>Most wanted this week</span>
              <strong>{pick.name}</strong>
              <span className="tabular">{formatPrice(pick.price)}</span>
            </span>
            <ArrowRight size={18} aria-hidden className={styles.pickArrow} />
          </Link>
        )}
      </div>
      <span className={styles.scrollCue} aria-hidden>
        Scroll
      </span>
    </section>
  );
}

// Four featured products in a large stage. Nothing rotates on its own; the
// stage changes when someone hovers or picks an item in the list.
export function FeaturedStage() {
  const { data, isLoading } = useProducts({ featured: "true", inStock: "true", sort: "rating", limit: 4 });
  const items = data?.items ?? [];
  const [index, setIndex] = useState(0);
  const active = items[index] ?? items[0];

  return (
    <section className={`container ${styles.featured}`} aria-labelledby="featured-title">
      <div className={styles.featuredIntro}>
        <h2 id="featured-title" className={`display ${styles.sectionTitle}`}>
          Picked this week
        </h2>
        <p className={styles.sectionSub}>Four things our team keeps reaching for. Hover to look closer.</p>

        <ul className={styles.list} role="tablist" aria-label="Featured products">
          {(isLoading ? Array.from({ length: 4 }, (_, i) => ({ id: i })) : items).map((p, i) =>
            isLoading ? (
              <li key={p.id}>
                <Skeleton height={72} radius="var(--radius-md)" />
              </li>
            ) : (
              <li key={p.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-controls="stage-panel"
                  className={styles.listItem}
                  onClick={() => setIndex(i)}
                  onMouseEnter={() => setIndex(i)}
                  onFocus={() => setIndex(i)}
                  style={{ "--tint": TINTS[i % TINTS.length] }}
                >
                  <span className={styles.listMedia}>
                    <img className="product-photo" src={assetUrl(p.images[0]?.url)} alt="" width="96" height="96" />
                  </span>
                  <span className={styles.listText}>
                    <span>{p.brand}</span>
                    <strong>{p.name}</strong>
                  </span>
                  <span className={`${styles.listPrice} tabular`}>{formatPrice(p.price)}</span>
                </button>
              </li>
            ),
          )}
        </ul>
      </div>

      {isLoading || !active ? (
        <Skeleton className={styles.stageSkeleton} height="auto" radius="var(--radius-xl)" />
      ) : (
        <div className={styles.stage} style={{ "--tint": TINTS[index % TINTS.length] }} role="tabpanel" id="stage-panel" aria-live="polite">
          <div className={styles.stageTop}>
            <span>{active.category?.name}</span>
            <span className="tabular">
              {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
          </div>
          <Link to={`/product/${active.slug}`} className={styles.stageMedia} aria-label={active.name}>
            <img key={active.id} className="product-photo" src={assetUrl(active.images[0]?.url)} alt={active.name} width="900" height="900" />
          </Link>
          <div className={styles.stageInfo}>
            <div>
              <p className={styles.stageBrand}>{active.brand}</p>
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
      )}
    </section>
  );
}
