import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, PackageX } from "lucide-react";
import { useOrder } from "../hooks/queries.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { assetUrl } from "../lib/api.js";
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from "../lib/format.js";
import { SummaryRows } from "../components/cart/CartSummary.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, PageLoader } from "../components/ui/Feedback.jsx";
import styles from "./OrderPage.module.css";

const TIMELINE = ["placed", "packed", "shipped", "delivered"];

export function OrderTimeline({ status }) {
  if (status === "cancelled") return <p className={styles.cancelled}>This order was cancelled. Any stock was returned to the shelf.</p>;
  const reached = TIMELINE.indexOf(status);
  return (
    <ol className={styles.timeline} aria-label="Order progress">
      {TIMELINE.map((step, i) => (
        <li key={step} data-reached={i <= reached ? "" : undefined} aria-current={i === reached ? "step" : undefined}>
          <span className={styles.node} aria-hidden />
          {ORDER_STATUS_LABEL[step]}
        </li>
      ))}
    </ol>
  );
}

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const justPlaced = params.get("placed") === "1";
  const { data: order, isLoading, error, refetch } = useOrder(id);
  useDocumentTitle(order ? `Order ${order.orderNumber}` : "Order");

  if (isLoading) return <PageLoader />;
  if (error?.status === 404) {
    return (
      <div className="container">
        <EmptyState icon={<PackageX size={24} />} title="Order not found" action={<Button to="/account" variant="dark">See my orders</Button>}>
          We couldn't find this order in your account.
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="container"><ErrorState error={error} onRetry={refetch} /></div>;

  const address = order.shippingAddress;

  return (
    <div className={`container ${styles.page}`}>
      {justPlaced && (
        <div className={styles.thanks}>
          <CheckCircle2 size={28} aria-hidden />
          <div>
            <h1 className={`display ${styles.thanksTitle}`}>Thanks, {address.fullName.split(" ")[0]}. Your order is in.</h1>
            <p>We'll pack it at the studio and text {address.phone} when it ships. Pay when it arrives.</p>
          </div>
        </div>
      )}

      <div className={styles.head}>
        <div>
          {!justPlaced && <h1 className={`display ${styles.title}`}>Order {order.orderNumber}</h1>}
          {justPlaced && <h2 className={styles.number}>Order {order.orderNumber}</h2>}
          <p className={styles.muted}>Placed on {formatDate(order.createdAt)}. Cash on delivery.</p>
        </div>
        <Link to="/account" className={styles.back}>
          All orders
        </Link>
      </div>

      <OrderTimeline status={order.status} />

      <div className={styles.layout}>
        <section aria-label="Items">
          <ul className={styles.items}>
            {order.items.map((item, i) => (
              <li key={`${item.slug}-${item.size}-${i}`}>
                <Link to={`/product/${item.slug}`} className={styles.thumb}>
                  <img src={assetUrl(item.image)} alt="" width="80" height="100" />
                </Link>
                <div className={styles.itemText}>
                  <Link to={`/product/${item.slug}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <span className={styles.muted}>
                    Size {item.size}, quantity {item.quantity}
                  </span>
                </div>
                <span className="tabular">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>
        <aside className={styles.side}>
          <div className={styles.card}>
            <h2>Payment</h2>
            <SummaryRows summary={{ subtotal: order.subtotal, shippingFee: order.shippingFee, total: order.total }} />
          </div>
          <div className={styles.card}>
            <h2>Delivering to</h2>
            <address className={styles.address}>
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              +91 {address.phone}
            </address>
          </div>
        </aside>
      </div>

      {justPlaced && (
        <div className={styles.continue}>
          <Button to="/shop" variant="secondary">
            Keep shopping
          </Button>
        </div>
      )}
    </div>
  );
}
