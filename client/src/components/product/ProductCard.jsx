import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useAddToBag } from "../../hooks/useAddToBag.js";
import { assetUrl } from "../../lib/api.js";
import { discountPercent } from "../../lib/format.js";
import { Badge, Price, Rating } from "../ui/Controls.jsx";
import { Skeleton } from "../ui/Feedback.jsx";
import styles from "./ProductCard.module.css";

const NEW_FOR_DAYS = 21;

function badgeFor(product) {
  if (product.stock === 0) return <Badge tone="muted">Sold out</Badge>;
  const off = discountPercent(product.price, product.compareAtPrice);
  if (off) return <Badge tone="sale">−{off}%</Badge>;
  const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / 86_400_000;
  if (ageDays <= NEW_FOR_DAYS) return <Badge tone="new">New</Badge>;
  return null;
}

// Add straight from the grid: one tap for one-size items, a size row otherwise.
function QuickAdd({ product }) {
  const { add, pending } = useAddToBag();
  const [open, setOpen] = useState(false);
  const inStock = product.sizes.filter((s) => s.stock > 0);
  if (!inStock.length) return null;

  const single = product.sizes.length === 1;
  if (single) {
    return (
      <button
        type="button"
        className={styles.quickButton}
        disabled={pending}
        onClick={() => add({ productId: product.id, size: inStock[0].label, quantity: 1 })}
      >
        <Plus size={15} aria-hidden /> {pending ? "Adding…" : "Add to bag"}
      </button>
    );
  }

  return open ? (
    <div className={styles.quickSizes} role="group" aria-label={`Choose a size for ${product.name}`} onMouseLeave={() => setOpen(false)}>
      {product.sizes.every((s) => s.label.startsWith("UK ")) && (
        <span className={styles.quickUnit} aria-hidden>
          UK
        </span>
      )}
      {product.sizes.map((s) => (
        <button
          key={s.label}
          type="button"
          disabled={s.stock === 0 || pending}
          onClick={async () => {
            if (await add({ productId: product.id, size: s.label, quantity: 1 })) setOpen(false);
          }}
          aria-label={`Add size ${s.label}${s.stock === 0 ? ", sold out" : ""}`}
        >
          {s.label.replace("UK ", "")}
        </button>
      ))}
    </div>
  ) : (
    <button type="button" className={styles.quickButton} onClick={() => setOpen(true)}>
      <Plus size={15} aria-hidden /> Quick add
    </button>
  );
}

export function WishlistButton({ product, className = "" }) {
  const { has, toggle } = useWishlist();
  const saved = has(product.slug);
  return (
    <button
      type="button"
      className={`${styles.heart} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={() => toggle(product)}
    >
      <Heart size={17} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function ProductCard({ product, priority = false }) {
  const [front, back] = product.images ?? [];

  return (
    <article className={styles.card}>
      <div className={`${styles.media} photo-scope`}>
        <Link to={`/product/${product.slug}`} className={styles.mediaLink} tabIndex={-1} aria-hidden>
          {front ? (
            <img
              className={`${styles.front} product-photo`}
              src={assetUrl(front.url)}
              alt=""
              width="600"
              height="750"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <span className={styles.placeholder} />
          )}
          {back && <img className={`${styles.back} product-photo`} src={assetUrl(back.url)} alt="" width="600" height="750" loading="lazy" decoding="async" />}
        </Link>
        <div className={styles.badges}>{badgeFor(product)}</div>
        <WishlistButton product={product} className={styles.heartPos} />
        <div className={styles.quick}>
          <QuickAdd product={product} />
        </div>
      </div>

      <Link to={`/product/${product.slug}`} className={styles.body}>
        <p className={styles.brand}>{product.brand || product.category?.name}</p>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.meta}>
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <Rating value={product.rating} count={product.reviewCount} size={12} />
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
        <Skeleton width="35%" height={12} />
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
