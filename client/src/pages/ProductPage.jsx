import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MessageCircle, PackageX } from "lucide-react";
import { useProduct, useProductsBySlugs } from "../hooks/queries.js";
import { useAddToBag } from "../hooks/useAddToBag.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed.js";
import { ProductGallery } from "../components/product/ProductGallery.jsx";
import { ProductRail } from "../components/product/ProductRail.jsx";
import { WishlistButton } from "../components/product/ProductCard.jsx";
import { SizePicker } from "../components/product/SizePicker.jsx";
import { SizeTable, sizeKind } from "../components/product/SizeTable.jsx";
import { DeliveryEstimate } from "../components/product/DeliveryEstimate.jsx";
import { Reviews } from "../components/product/Reviews.jsx";
import { Price, QuantityStepper, Rating } from "../components/ui/Controls.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/Feedback.jsx";
import { Modal } from "../components/ui/Overlay.jsx";
import styles from "./ProductPage.module.css";

function StockLine({ product, size }) {
  if (product.stock === 0) return <p className={styles.stock} data-tone="out">Sold out. We're restocking soon.</p>;
  const entry = product.sizes.find((s) => s.label === size);
  if (entry && entry.stock <= 5) return <p className={styles.stock} data-tone="low">Only {entry.stock} left. Order soon.</p>;
  if (product.stock <= 10) return <p className={styles.stock} data-tone="low">Low stock: {product.stock} left.</p>;
  return <p className={styles.stock} data-tone="ok">In stock, ready to ship.</p>;
}

function Accordion({ title, children, defaultOpen = false }) {
  return (
    <details className={styles.accordion} open={defaultOpen}>
      <summary>{title}</summary>
      <div className={styles.accordionBody}>{children}</div>
    </details>
  );
}

function ProductSkeleton() {
  return (
    <div className={`container ${styles.layout}`} aria-busy>
      <Skeleton height="auto" className={styles.skeletonImage} radius="var(--radius-xl)" />
      <div className={styles.info}>
        <Skeleton width="25%" height={14} />
        <Skeleton width="80%" height={44} />
        <Skeleton width="30%" height={24} />
        <Skeleton height={110} />
        <Skeleton height={52} radius="var(--radius-pill)" />
      </div>
    </div>
  );
}

function RecentlyViewed({ slug }) {
  const slugs = useRecentlyViewed(slug);
  const { data: items = [], isLoading } = useProductsBySlugs(slugs.slice(0, 10));
  if (!slugs.length || (!isLoading && !items.length)) return null;
  return (
    <section className={`container ${styles.section}`} aria-labelledby="recent-title">
      <h2 id="recent-title" className={`display ${styles.sectionTitle}`}>
        Recently viewed
      </h2>
      <ProductRail products={items} loading={isLoading} label="recently viewed" />
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data, isLoading, error, refetch } = useProduct(slug);
  const product = data?.product;
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const { add, pending } = useAddToBag();
  useDocumentTitle(product?.name ?? (error ? "Product not found" : "Loading"));

  // One-size products don't need a size choice.
  useEffect(() => {
    setQuantity(1);
    setSizeError("");
    setSize(product?.sizes.length === 1 && product.sizes[0].stock > 0 ? product.sizes[0].label : null);
  }, [product]);

  if (isLoading) return <ProductSkeleton />;
  if (error?.status === 404) {
    return (
      <div className="container">
        <EmptyState
          icon={<PackageX size={24} />}
          title="This product isn't available"
          action={
            <Button to="/shop" variant="dark">
              Browse the shop
            </Button>
          }
        >
          It may have sold out for good, or the link may be wrong.
        </EmptyState>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const selected = product.sizes.find((s) => s.label === size);
  const maxQty = Math.min(10, selected?.stock ?? 10);
  const kind = sizeKind(product.sizes);
  const singleSize = product.sizes.length === 1;

  async function onAdd() {
    if (!size) {
      setSizeError("Choose a size first.");
      document.getElementById("size-picker")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSizeError("");
    const ok = await add({ productId: product.id, size, quantity });
    if (ok) setQuantity(1);
  }

  return (
    <>
      <nav className={`container ${styles.breadcrumb}`} aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/shop">Shop</Link>
            <ChevronRight size={13} aria-hidden />
          </li>
          <li>
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            <ChevronRight size={13} aria-hidden />
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className={`container ${styles.layout}`}>
        <ProductGallery images={product.images} name={product.name} />

        <div className={styles.info}>
          <div className={styles.titleBlock}>
            <Link to={`/shop?brand=${encodeURIComponent(product.brand)}`} className={styles.brand}>
              {product.brand}
            </Link>
            <h1 className={`display ${styles.name}`}>{product.name}</h1>
            <div className={styles.priceRow}>
              <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" showSaving />
              {product.reviewCount > 0 && (
                <a href="#reviews" className={styles.ratingLink}>
                  <Rating value={product.rating} count={product.reviewCount} size={14} />
                </a>
              )}
            </div>
            <p className={styles.taxNote}>Inclusive of all taxes.</p>
          </div>

          <p className={styles.lede}>{product.description}</p>

          <div className={styles.purchase} id="size-picker">
            {singleSize ? (
              <p className={styles.oneSize}>One size</p>
            ) : (
              <SizePicker
                sizes={product.sizes}
                value={size}
                onChange={(value) => {
                  setSize(value);
                  setSizeError("");
                  setQuantity((q) => Math.min(q, product.sizes.find((s) => s.label === value)?.stock ?? q));
                }}
                error={sizeError}
                onGuide={kind ? () => setGuideOpen(true) : undefined}
              />
            )}
            <StockLine product={product} size={size} />
            <div className={styles.buyRow}>
              <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} disabled={product.stock === 0} />
              <Button size="lg" block onClick={onAdd} loading={pending} disabled={product.stock === 0}>
                {product.stock === 0 ? "Sold out" : "Add to bag"}
              </Button>
              <WishlistButton product={product} className={styles.wish} />
            </div>
            <DeliveryEstimate freeShipping={product.price >= 2999} />
            <button type="button" className={styles.askChotu} onClick={() => window.dispatchEvent(new CustomEvent("chotu:open"))}>
              <MessageCircle size={16} aria-hidden /> Questions about this item? Ask Chotu
            </button>
          </div>

          <div className={styles.details}>
            <Accordion title="Details" defaultOpen>
              <ul className={styles.bullets}>
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <dl className={styles.specs}>
                <div>
                  <dt>Category</dt>
                  <dd>{product.category.name}</dd>
                </div>
                <div>
                  <dt>For</dt>
                  <dd>{product.gender === "unisex" ? "Everyone" : product.gender === "men" ? "Men" : "Women"}</dd>
                </div>
                {product.sku && (
                  <div>
                    <dt>SKU</dt>
                    <dd>{product.sku}</dd>
                  </div>
                )}
              </dl>
            </Accordion>
            {kind && (
              <Accordion title="Size and fit">
                <SizeTable kind={kind} />
              </Accordion>
            )}
            <Accordion title="Delivery and returns">
              <p>
                Free shipping on orders of ₹2,999 or more, otherwise ₹99. Orders placed before 2 pm (Monday to Saturday) leave our store
                the same day. Free returns or exchanges within 30 days, unused and with tags. <Link to="/help#returns">Full policy</Link>.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      <section id="reviews" className={`container ${styles.section}`} aria-labelledby="reviews-title">
        <h2 id="reviews-title" className={`display ${styles.sectionTitle}`}>
          Reviews
        </h2>
        <Reviews slug={product.slug} />
      </section>

      {data.related.length > 0 && (
        <section className={`container ${styles.section}`} aria-labelledby="related-title">
          <h2 id="related-title" className={`display ${styles.sectionTitle}`}>
            You might also like
          </h2>
          <ProductRail products={data.related} label="related products" />
        </section>
      )}

      <RecentlyViewed slug={product.slug} />

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Size guide" size="md">
        <div style={{ paddingBottom: 24 }}>
          <SizeTable kind={kind ?? "clothing"} />
        </div>
      </Modal>
    </>
  );
}
