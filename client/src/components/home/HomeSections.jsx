import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCategories, useProducts } from "../../hooks/queries.js";
import { assetUrl } from "../../lib/api.js";
import { pluralize } from "../../lib/format.js";
import { ProductGrid } from "../product/ProductCard.jsx";
import { Price } from "../ui/Controls.jsx";
import { Button } from "../ui/Button.jsx";
import { ErrorState, Skeleton } from "../ui/Feedback.jsx";
import { Chotu } from "../chat/Chotu.jsx";
import styles from "./HomeSections.module.css";

function SectionHead({ title, children, link }) {
  return (
    <div className={styles.head}>
      <div>
        <h2 className={`display ${styles.title}`}>{title}</h2>
        {children && <p className={styles.sub}>{children}</p>}
      </div>
      {link && (
        <Link to={link.to} className={styles.headLink}>
          {link.label} <ArrowUpRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function CategoryRail() {
  const { data: categories, isLoading, error, refetch } = useCategories();
  // One request for the bestsellers, then the top shirt of each category
  // becomes that category's cover image.
  const { data: popular } = useProducts({ sort: "popular", limit: 48, inStock: "true" });
  const covers = useMemo(() => {
    const map = new Map();
    for (const p of popular?.items ?? []) if (!map.has(p.category?.slug)) map.set(p.category?.slug, p);
    return map;
  }, [popular]);

  return (
    <section className={`container ${styles.section}`} aria-labelledby="categories-title">
      <SectionHead title={<span id="categories-title">Shop by category</span>} link={{ to: "/shop", label: "All shirts" }} />
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <ul className={styles.categories}>
          {(isLoading ? Array.from({ length: 6 }, (_, i) => ({ id: i })) : categories).map((category) => {
            const cover = covers.get(category.slug);
            return (
              <li key={category.id}>
                {isLoading ? (
                  <Skeleton className={styles.categorySkeleton} height="auto" radius="var(--radius-md)" />
                ) : (
                  <Link to={`/shop?category=${category.slug}`} className={styles.category}>
                    <div className={styles.categoryMedia}>
                      {cover && <img src={assetUrl(cover.images[0]?.url)} alt="" width="400" height="500" loading="lazy" />}
                    </div>
                    <div className={styles.categoryText}>
                      <h3 className="display">{category.name}</h3>
                      <span>{pluralize(category.productCount, "shirt")}</span>
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const TABS = [
  { id: "bestsellers", label: "Bestsellers", params: { sort: "popular", inStock: "true" }, link: "/shop?sort=popular" },
  { id: "new", label: "New in", params: { sort: "newest" }, link: "/shop?sort=newest" },
  { id: "sale", label: "On sale", params: { onSale: "true", sort: "popular" }, link: "/shop?onSale=true" },
];

export function ProductTabs() {
  const [tab, setTab] = useState(TABS[0]);
  const { data, isLoading, isFetching, error, refetch } = useProducts({ ...tab.params, limit: 8 });

  return (
    <section className={`container ${styles.section}`} aria-labelledby="tabs-title">
      <div className={styles.head}>
        <h2 id="tabs-title" className={`display ${styles.title}`}>
          On the rails this week
        </h2>
        <div className={styles.tabs} role="tablist" aria-label="Product lists">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === tab.id} aria-controls="tab-panel" onClick={() => setTab(t)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div id="tab-panel" role="tabpanel" className={styles.tabPanel} data-fetching={isFetching && !isLoading ? "" : undefined}>
        {error ? <ErrorState error={error} onRetry={refetch} /> : <ProductGrid products={data?.items ?? []} loading={isLoading} />}
      </div>
      <div className={styles.more}>
        <Button to={tab.link} variant="secondary">
          See all {tab.label.toLowerCase()}
        </Button>
      </div>
    </section>
  );
}

export function PromoBanner() {
  const { data } = useProducts({ onSale: "true", limit: 1 });
  const count = data?.pagination?.total;

  return (
    <section className={`container ${styles.section}`} aria-labelledby="promo-title">
      <div className={styles.promo}>
        <img className={styles.promoImage} src="/images/pitch-night.webp" alt="" width="1024" height="731" loading="lazy" />
        <div className={styles.promoCopy}>
          <p className={styles.promoKicker}>Ends Sunday at midnight</p>
          <h2 id="promo-title" className={`display ${styles.promoTitle}`}>
            Floodlight sale
          </h2>
          <p className={styles.promoText}>
            Up to 20% off selected shirts while the lights are on. Prices are already reduced, no code needed
            {count ? `. ${pluralize(count, "shirt")} in the sale right now.` : "."}
          </p>
          <Button to="/shop?onSale=true" variant="light" size="lg">
            Shop the sale
          </Button>
        </div>
      </div>
    </section>
  );
}

export function RetroRoom() {
  const { data, isLoading } = useProducts({ category: "retro", sort: "name", limit: 24 });
  const years = useMemo(() => {
    const byYear = new Map();
    for (const p of data?.items ?? []) {
      const year = /^\d{4}$/.test(p.season) ? p.season : null;
      if (year && !byYear.has(year)) byYear.set(year, p);
    }
    return [...byYear.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);
  const [activeYear, setActiveYear] = useState(null);
  const active = years.find(([y]) => y === activeYear) ?? years[0];

  if (!isLoading && !years.length) return null;

  return (
    <section className={`container ${styles.section}`} aria-labelledby="retro-title">
      <div className={styles.retro}>
        <div className={styles.retroIntro}>
          <h2 id="retro-title" className={`display ${styles.title}`}>
            The retro room
          </h2>
          <p className={styles.sub}>
            Pick a year. Every tribute is re-cut from the original pattern, with heavier fabric and a fit that works today.
          </p>
          <ul className={styles.years} role="tablist" aria-label="Retro shirts by year">
            {years.map(([year, product]) => (
              <li key={year}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active?.[0] === year}
                  onMouseEnter={() => setActiveYear(year)}
                  onFocus={() => setActiveYear(year)}
                  onClick={() => setActiveYear(year)}
                  aria-label={`${year}: ${product.name}`}
                >
                  ’{year.slice(2)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.retroShow} role="tabpanel" aria-live="polite">
          {active ? (
            <Link to={`/product/${active[1].slug}`} className={styles.retroCard}>
              <div className={styles.retroMedia}>
                <img key={active[1].id} src={assetUrl(active[1].images[0]?.url)} alt={active[1].name} width="600" height="750" />
              </div>
              <div className={styles.retroMeta}>
                <div>
                  <p className={styles.retroYear}>{active[0]}</p>
                  <h3>{active[1].name}</h3>
                </div>
                <Price price={active[1].price} compareAtPrice={active[1].compareAtPrice} />
              </div>
            </Link>
          ) : (
            <Skeleton className={styles.categorySkeleton} height="auto" radius="var(--radius-lg)" />
          )}
        </div>
      </div>
    </section>
  );
}

export function AskChotu() {
  return (
    <section className={`container ${styles.section}`} aria-labelledby="chotu-title">
      <div className={styles.chotu}>
        <Chotu size={132} mood="idle" />
        <div className={styles.chotuCopy}>
          <h2 id="chotu-title" className={`display ${styles.title}`}>
            Not sure about the size?
          </h2>
          <p className={styles.sub}>
            Ask Chotu. He's small, permanently annoyed and knows every shirt on these rails: what's in stock, how retro cuts fit and
            when your order arrives.
          </p>
        </div>
        <blockquote className={styles.chotuQuote}>
          <p>“Hmph. Chest is 98 cm? Medium. Retro? Still medium. Next question.”</p>
          <Button variant="dark" onClick={() => window.dispatchEvent(new CustomEvent("chotu:open"))}>
            Ask Chotu
          </Button>
        </blockquote>
      </div>
    </section>
  );
}
