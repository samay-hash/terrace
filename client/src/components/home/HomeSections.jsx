import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, RotateCcw, Truck, Banknote, ShieldCheck } from "lucide-react";
import { useCategories, useProducts, useReviewHighlights } from "../../hooks/queries.js";
import { assetUrl } from "../../lib/api.js";
import { pluralize } from "../../lib/format.js";
import { photoProps } from "../../lib/photos.js";
import { useScrollProgress } from "../../hooks/useScrollProgress.js";
import { ProductRail } from "../product/ProductRail.jsx";
import { Button } from "../ui/Button.jsx";
import { Rating } from "../ui/Controls.jsx";
import { ErrorState, Skeleton } from "../ui/Feedback.jsx";
import { Chotu } from "../chat/Chotu.jsx";
import styles from "./HomeSections.module.css";

// Lifestyle photography (CC0) for categories that have it; the rest use the
// category's bestselling product on a tinted stage.
const CATEGORY_ART = {
  footwear: { photo: "sneakers-steps", tint: "var(--tint-mist)" },
  watches: { photo: "wrist-chrono", tint: "var(--tint-sand)" },
  eyewear: { photo: "sunglasses", tint: "var(--tint-blush)" },
  bags: { photo: "duffel", tint: "var(--tint-sand)" },
  clothing: { photo: "street-walk", tint: "var(--tint-sage)" },
  sports: { photo: "track", tint: "var(--tint-mist)" },
};

function SectionHead({ title, children, link, id }) {
  return (
    <div className={styles.head}>
      <div>
        <h2 id={id} className={`display ${styles.title}`}>
          {title}
        </h2>
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

// Big category names on the left; hovering or focusing one swaps the
// picture on the right. On small screens it becomes a swipeable row.
export function CategoryExplorer() {
  const { data: categories = [], isLoading, error, refetch } = useCategories();
  const { data: popular } = useProducts({ sort: "popular", limit: 48, inStock: "true" });
  const covers = useMemo(() => {
    const map = new Map();
    for (const p of popular?.items ?? []) if (!map.has(p.category?.slug)) map.set(p.category?.slug, p);
    return map;
  }, [popular]);
  const [activeSlug, setActiveSlug] = useState(null);
  const active = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  if (error) return <div className="container"><ErrorState error={error} onRetry={refetch} /></div>;

  const art = (c) => CATEGORY_ART[c.slug] ?? { tint: "var(--tint-sand)" };

  return (
    <section className={`container ${styles.section}`} aria-labelledby="explore-title">
      <SectionHead id="explore-title" title="Shop by category" link={{ to: "/shop", label: "Shop everything" }}>
        Six departments, one standard: things we'd use ourselves.
      </SectionHead>

      <div className={styles.explorer}>
        <ul className={styles.explorerList}>
          {(isLoading ? Array.from({ length: 6 }, (_, i) => ({ id: i })) : categories).map((c) =>
            isLoading ? (
              <li key={c.id}>
                <Skeleton height={56} />
              </li>
            ) : (
              <li key={c.id}>
                <Link
                  to={`/shop?category=${c.slug}`}
                  className={styles.explorerLink}
                  data-active={active?.slug === c.slug ? "" : undefined}
                  onMouseEnter={() => setActiveSlug(c.slug)}
                  onFocus={() => setActiveSlug(c.slug)}
                >
                  <span className={styles.explorerName}>{c.name}</span>
                  <span className={styles.explorerCount}>{pluralize(c.productCount, "item")}</span>
                  <ArrowUpRight size={22} className={styles.explorerArrow} aria-hidden />
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className={styles.explorerShow} aria-hidden>
          {active &&
            categories.map((c) => {
              const cover = covers.get(c.slug);
              const { photo, tint } = art(c);
              return (
                <div key={c.id} className={styles.explorerPanel} data-active={active.slug === c.slug ? "" : undefined} style={{ "--tint": tint }}>
                  {photo ? (
                    <img className={styles.explorerPhoto} {...photoProps(photo, "(max-width: 860px) 100vw, 50vw")} alt="" loading="lazy" />
                  ) : (
                    cover && <img className={`${styles.explorerProduct} product-photo`} src={assetUrl(cover.images[0]?.url)} alt="" loading="lazy" />
                  )}
                  <p className={styles.explorerCaption}>{c.description}</p>
                </div>
              );
            })}
        </div>
      </div>

      <ul className={`${styles.categoryRow} no-scrollbar`}>
        {categories.map((c) => {
          const cover = covers.get(c.slug);
          return (
            <li key={c.id}>
              <Link to={`/shop?category=${c.slug}`} className={styles.categoryCard} style={{ "--tint": art(c).tint }}>
                <span className={styles.categoryMedia}>
                  {cover && <img className="product-photo" src={assetUrl(cover.images[0]?.url)} alt="" loading="lazy" />}
                </span>
                <span className={styles.categoryName}>{c.name}</span>
                <span className={styles.categoryCount}>{pluralize(c.productCount, "item")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const TABS = [
  { id: "new", label: "New in", params: { sort: "newest" }, link: "/shop?sort=newest" },
  { id: "best", label: "Bestsellers", params: { sort: "popular", inStock: "true" }, link: "/shop?sort=popular" },
  { id: "rated", label: "Top rated", params: { sort: "rating", minRating: 4 }, link: "/shop?sort=rating&minRating=4" },
  { id: "sale", label: "On sale", params: { onSale: "true", sort: "popular" }, link: "/shop?onSale=true" },
];

export function ProductTabs() {
  const [tab, setTab] = useState(TABS[0]);
  const { data, isLoading, error, refetch } = useProducts({ ...tab.params, limit: 12 });

  return (
    <section className={`container ${styles.section}`} aria-labelledby="tabs-title">
      <div className={styles.head}>
        <div>
          <h2 id="tabs-title" className={`display ${styles.title}`}>
            This week at Terrace
          </h2>
          <div className={styles.tabs} role="tablist" aria-label="Product lists">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={t.id === tab.id} onClick={() => setTab(t)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div role="tabpanel" aria-label={tab.label}>
        {error ? <ErrorState error={error} onRetry={refetch} /> : <ProductRail products={data?.items ?? []} loading={isLoading} label={tab.label} />}
      </div>
      <div className={styles.more}>
        <Link to={tab.link} className={styles.headLink}>
          See all {tab.label.toLowerCase()} <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

// Full-width photograph with copy on top. The image zooms gently and the
// copy drifts as the band passes through the viewport.
export function ParallaxBand({ photo, kicker, title, text, cta, align = "left", id }) {
  const ref = useRef(null);
  useScrollProgress(ref);
  return (
    <section ref={ref} className={styles.band} data-align={align} aria-labelledby={id}>
      <div className={styles.bandMedia} aria-hidden>
        <img {...photoProps(photo)} alt="" loading="lazy" />
      </div>
      <div className={`container ${styles.bandInner}`}>
        <div className={styles.bandCopy}>
          <p className={styles.bandKicker}>{kicker}</p>
          <h2 id={id} className={`display ${styles.bandTitle}`}>
            {title}
          </h2>
          <p className={styles.bandText}>{text}</p>
          <Button to={cta.to} variant="light" size="lg">
            {cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}

const STORY = [
  {
    photo: "basketball",
    kicker: "On the court",
    title: "Built for the game, not the shelf.",
    text: "Match balls, rims, rackets and bats from Wilson, SG, Titleist and our own Fieldcraft label. Tested on weekend courts before they reach ours.",
    to: "/shop?category=sports",
    label: "Shop sports gear",
  },
  {
    photo: "sneakers-steps",
    kicker: "On the street",
    title: "Trainers that go from steps to stands.",
    text: "Everyday runners and court classics in UK sizes, with free exchanges if the fit isn't right the first time.",
    to: "/shop?category=footwear",
    label: "Shop footwear",
  },
  {
    photo: "duffel",
    kicker: "On the move",
    title: "Carry the day with you.",
    text: "Leather totes, satchels and backpacks with proper linings, zip pockets and handles that hold up to a full day.",
    to: "/shop?category=bags",
    label: "Shop bags",
  },
];

// Scroll-driven story: the picture on the left stays put and changes as each
// chapter on the right reaches the middle of the screen.
export function ScrollStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`container ${styles.story}`} aria-labelledby="story-title">
      <h2 id="story-title" className="visually-hidden">
        Where our gear goes
      </h2>
      <div className={styles.storyMedia} aria-hidden>
        {STORY.map((step, i) => (
          <img key={step.photo} {...photoProps(step.photo, "(max-width: 860px) 100vw, 55vw")} alt="" loading="lazy" data-active={i === active ? "" : undefined} />
        ))}
        <div className={styles.storyDots}>
          {STORY.map((step, i) => (
            <span key={step.photo} data-active={i === active ? "" : undefined} />
          ))}
        </div>
      </div>
      <ul className={styles.storySteps}>
        {STORY.map((step, i) => (
          <li key={step.photo} ref={(el) => (stepRefs.current[i] = el)} data-index={i} data-active={i === active ? "" : undefined} className={styles.storyStep}>
            <img className={styles.storyInlinePhoto} {...photoProps(step.photo, "100vw")} alt="" loading="lazy" />
            <p className={styles.bandKickerDark}>{step.kicker}</p>
            <h3 className={`display ${styles.storyTitle}`}>{step.title}</h3>
            <p className={styles.sub}>{step.text}</p>
            <Link to={step.to} className={styles.headLink}>
              {step.label} <ArrowUpRight size={16} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReviewsStrip() {
  const { data } = useReviewHighlights();
  if (!data?.items?.length) return null;

  return (
    <section className={`container ${styles.section}`} aria-labelledby="reviews-title">
      <div className={styles.reviewsHead}>
        <div>
          <h2 id="reviews-title" className={`display ${styles.title}`}>
            Heard on the shop floor
          </h2>
          <p className={styles.sub}>Recent reviews from people who bought from us.</p>
        </div>
        <Rating value={data.average} count={data.count} size={16} />
      </div>
      <ul className={`${styles.reviews} no-scrollbar`}>
        {data.items.slice(0, 3).map((r) => (
          <li key={r.id} className={styles.review}>
            <Rating value={r.rating} count={1} size={14} showValue={false} />
            <blockquote>“{r.body}”</blockquote>
            <p className={styles.reviewAuthor}>
              {r.authorName}
              {r.verified && (
                <span>
                  <BadgeCheck size={14} aria-hidden /> Verified buyer
                </span>
              )}
            </p>
            <Link to={`/product/${r.product.slug}`} className={styles.reviewProduct}>
              <span>
                <img className="product-photo" src={assetUrl(r.product.image)} alt="" width="48" height="48" loading="lazy" />
              </span>
              {r.product.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SaleBanner() {
  const { data } = useProducts({ onSale: "true", sort: "popular", limit: 3 });
  const count = data?.pagination?.total;
  if (!count) return null;

  return (
    <section className={`container ${styles.section}`} aria-labelledby="sale-title">
      <div className={styles.sale}>
        <div className={styles.saleCopy}>
          <p className={styles.saleKicker}>Mid-season sale</p>
          <h2 id="sale-title" className={`display ${styles.saleTitle}`}>
            Up to 20% off, prices already cut.
          </h2>
          <p className={styles.saleText}>{pluralize(count, "piece")} reduced across footwear, watches, bags and sports gear. No code needed.</p>
          <Button to="/shop?onSale=true" variant="light" size="lg">
            Shop the sale
          </Button>
        </div>
        <ul className={styles.saleProducts}>
          {data.items.map((p) => (
            <li key={p.id}>
              <Link to={`/product/${p.slug}`} aria-label={p.name}>
                <img className="product-photo" src={assetUrl(p.images[0]?.url)} alt="" loading="lazy" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AskChotu() {
  return (
    <section className={`container ${styles.section}`} aria-labelledby="chotu-title">
      <div className={styles.chotu}>
        <Chotu size={112} />
        <div className={styles.chotuCopy}>
          <h2 id="chotu-title" className={`display ${styles.chotuTitle}`}>
            Questions? Ask Chotu.
          </h2>
          <p className={styles.sub}>
            Our shop-floor assistant is small, permanently annoyed and knows every item on the shelves: stock by size, fit, delivery
            dates and where your order is.
          </p>
        </div>
        <div className={styles.chotuQuote}>
          <p>“Hmph. Between UK 8 and 9 in trainers? Take the 9. Next question.”</p>
          <Button variant="dark" onClick={() => window.dispatchEvent(new CustomEvent("chotu:open"))}>
            Ask Chotu
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Promises() {
  const items = [
    { icon: Truck, title: "Free shipping over ₹2,999", text: "Dispatched the same day before 2 pm" },
    { icon: RotateCcw, title: "30-day free returns", text: "Unused, with tags, from your order page" },
    { icon: Banknote, title: "Cash on delivery", text: "Pay in cash or UPI when it arrives" },
    { icon: ShieldCheck, title: "Prices checked at checkout", text: "What you see is what you pay" },
  ];
  return (
    <section className={`container ${styles.promisesSection}`} aria-label="Our promises">
      <ul className={styles.promises}>
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Icon size={22} strokeWidth={1.6} aria-hidden />
            <div>
              <p className={styles.promiseTitle}>{title}</p>
              <p className={styles.promiseText}>{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
