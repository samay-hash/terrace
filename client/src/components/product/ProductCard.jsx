import { Link } from "react-router-dom";
import { assetUrl } from "../../lib/api.js";
import { discountPercent } from "../../lib/format.js";
import { Badge, Price } from "../ui/Controls.jsx";
import { Skeleton } from "../ui/Feedback.jsx";
import styles from "./ProductCard.module.css";

const NEW_FOR_DAYS = 14;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function badgeFor(product) {
  if (product.stock === 0) return <Badge tone="muted">Sold out</Badge>;
  const off = discountPercent(product.price, product.compareAtPrice);
  if (off) return <Badge tone="sale">{off}% off</Badge>;
  const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / 86_400_000;
  if (ageDays <= NEW_FOR_DAYS) return <Badge tone="new">New</Badge>;
  return null;
}

export function ProductCard({ product, priority = false }) {
  const [front, back] = product.images ?? [];
  const sizes = [...(product.sizes ?? [])].sort((a, b) => SIZE_ORDER.indexOf(a.label) - SIZE_ORDER.indexOf(b.label));
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <article className={styles.card}>
      <Link to={`/product/${product.slug}`} className={styles.link}>
        <div className={styles.media}>
          {front ? (
            <img
              className={styles.front}
              src={assetUrl(front.url)}
              alt={front.alt || product.name}
              width="600"
              height="750"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
          {back && <img className={styles.back} src={assetUrl(back.url)} alt="" width="600" height="750" loading="lazy" decoding="async" />}
          <div className={styles.badges}>{badgeFor(product)}</div>
          {product.stock > 0 && sizes.length > 0 && (
            <div className={styles.sizes} aria-hidden>
              {sizes.map((s) => (
                <span key={s.label} data-out={s.stock === 0 ? "" : undefined}>
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.team}>{product.team || product.category?.name}</p>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.meta}>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} />
            {lowStock && <span className={styles.low}>Only {product.stock} left</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <Skeleton className={styles.mediaSkeleton} height="auto" radius="var(--radius-md)" />
      <div className={styles.body}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="85%" height={16} />
        <Skeleton width="30%" height={16} />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, skeletonCount = 8, columns = 4 }) {
  return (
    <div className={styles.grid} data-columns={columns} aria-busy={loading || undefined}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product, i) => <ProductCard key={product.id} product={product} priority={i < 4} />)}
    </div>
  );
}
