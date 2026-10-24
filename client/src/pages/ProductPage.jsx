import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Truck, RotateCcw, Ruler, MessageCircle, PackageX } from "lucide-react";
import { useProduct } from "../hooks/queries.js";
import { useAddToBag } from "../hooks/useAddToBag.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { KIT_TYPE_LABEL } from "../lib/format.js";
import { ProductGallery } from "../components/product/ProductGallery.jsx";
import { ProductGrid } from "../components/product/ProductCard.jsx";
import { SizePicker } from "../components/product/SizePicker.jsx";
import { Price, QuantityStepper, Badge } from "../components/ui/Controls.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/Feedback.jsx";
import { SizeTable } from "../components/product/SizeTable.jsx";
import styles from "./ProductPage.module.css";

function StockLine({ product, size }) {
  if (product.stock === 0) return <p className={styles.stock} data-tone="out">Sold out in every size. A restock is on the way.</p>;
  const entry = product.sizes.find((s) => s.label === size);
  if (entry && entry.stock <= 5) return <p className={styles.stock} data-tone="low">Only {entry.stock} left in {size}. Order soon.</p>;
  if (product.stock <= 10) return <p className={styles.stock} data-tone="low">Low stock: {product.stock} left across all sizes.</p>;
  return <p className={styles.stock} data-tone="ok">In stock and ready to dispatch.</p>;
}

function Accordion({ title, icon, children, defaultOpen = false }) {
  return (
    <details className={styles.accordion} open={defaultOpen}>
      <summary>
        {icon}
        <span>{title}</span>
      </summary>
      <div className={styles.accordionBody}>{children}</div>
    </details>
  );
}

function ProductSkeleton() {
  return (
    <div className={`container ${styles.layout}`} aria-busy>
      <Skeleton height="auto" className={styles.skeletonImage} radius="var(--radius-lg)" />
      <div className={styles.info}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="80%" height={44} />
        <Skeleton width="25%" height={28} />
        <Skeleton height={100} />
        <Skeleton height={56} radius="var(--radius-pill)" />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data, isLoading, error, refetch } = useProduct(slug);
  const product = data?.product;
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState("");
  const { add, pending } = useAddToBag();
  useDocumentTitle(product?.name ?? (error ? "Product not found" : "Loading"));

  if (isLoading) return <ProductSkeleton />;
  if (error?.status === 404) {
    return (
      <div className="container">
        <EmptyState
          icon={<PackageX size={24} />}
          title="This shirt has left the building"
          action={
            <Button to="/shop" variant="dark">
              Browse all shirts
            </Button>
          }
        >
          We couldn't find that product. It may have sold out for good or the link may be wrong.
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="container"><ErrorState error={error} onRetry={refetch} /></div>;

  const selected = product.sizes.find((s) => s.label === size);
  const maxQty = Math.min(10, selected?.stock ?? 10);

  async function onAdd() {
    if (!size) {
      setSizeError("Choose a size first.");
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
            <ChevronRight size={14} aria-hidden />
          </li>
          <li>
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            <ChevronRight size={14} aria-hidden />
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className={`container ${styles.layout}`}>
        <ProductGallery images={product.images} name={product.name} />

        <div className={styles.info}>
          <div className={styles.kicker}>
            <span>{product.team}</span>
            {product.season && <span className={styles.season}>{product.season}</span>}
            <Badge>{KIT_TYPE_LABEL[product.kitType]}</Badge>
          </div>
          <h1 className={`display ${styles.name}`}>{product.name}</h1>
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" showSaving />
          <p className={styles.taxNote}>Inclusive of all taxes. Free shipping over ₹2,999.</p>

          <div className={styles.purchase}>
            <SizePicker
              sizes={product.sizes}
              value={size}
              onChange={(value) => {
                setSize(value);
                setSizeError("");
                setQuantity((q) => Math.min(q, product.sizes.find((s) => s.label === value)?.stock ?? q));
              }}
              error={sizeError}
            />
            <StockLine product={product} size={size} />
            <div className={styles.buyRow}>
              <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} disabled={product.stock === 0} />
              <Button size="lg" block onClick={onAdd} loading={pending} disabled={product.stock === 0}>
                {product.stock === 0 ? "Sold out" : "Add to bag"}
              </Button>
            </div>
            <button type="button" className={styles.askChotu} onClick={() => window.dispatchEvent(new CustomEvent("chotu:open"))}>
              <MessageCircle size={16} aria-hidden /> Unsure about fit? Ask Chotu about this shirt
            </button>
          </div>

          <div className={styles.details}>
            <Accordion title="Description" defaultOpen>
              {product.description.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              {product.details.length > 0 && (
                <ul className={styles.bullets}>
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
              {product.sku && <p className={styles.sku}>SKU {product.sku}</p>}
            </Accordion>
            <Accordion title="Size guide" icon={<Ruler size={18} aria-hidden />}>
              <SizeTable />
            </Accordion>
            <Accordion title="Delivery" icon={<Truck size={18} aria-hidden />}>
              <p>
                Free shipping on orders of ₹2,999 or more, otherwise ₹99. Orders placed before 2 pm on a weekday leave the studio the same
                day and arrive in 3–5 business days in metro cities. Cash on delivery available across India.
              </p>
            </Accordion>
            <Accordion title="Returns and exchanges" icon={<RotateCcw size={18} aria-hidden />}>
              <p>
                Free returns or size exchanges within 30 days of delivery, as long as the shirt is unworn with its tags on.{" "}
                <Link to="/help#returns">Read the full policy</Link>.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className={`container ${styles.related}`} aria-labelledby="related-title">
          <h2 id="related-title" className={`display ${styles.relatedTitle}`}>
            More from {product.category.name}
          </h2>
          <ProductGrid products={data.related} />
        </section>
      )}
    </>
  );
}
