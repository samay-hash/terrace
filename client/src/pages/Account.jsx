import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useMyOrders } from "../hooks/queries.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { assetUrl } from "../lib/api.js";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, pluralize } from "../lib/format.js";
import { Badge } from "../components/ui/Controls.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/Feedback.jsx";
import styles from "./Account.module.css";

export default function Account() {
  useDocumentTitle("My orders");
  const { user, logout } = useAuth();
  const { data: orders, isLoading, error, refetch } = useMyOrders();

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <h1 className={`display ${styles.title}`}>Hi, {user.name.split(" ")[0]}</h1>
          <p className={styles.muted}>Signed in as {user.email}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      </header>

      <section aria-labelledby="orders-title">
        <h2 id="orders-title" className={styles.sectionTitle}>
          Your orders
        </h2>
        {isLoading ? (
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={96} radius="var(--radius-lg)" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title="No orders yet" action={<Button to="/shop" variant="dark">Find your first shirt</Button>}>
            When you place an order it will show up here with its delivery status.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {orders.map((order) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className={styles.order}>
                  <div className={styles.thumbs} aria-hidden>
                    {order.items.slice(0, 3).map((item, i) => (
                      <img key={i} src={assetUrl(item.image)} alt="" width="52" height="65" />
                    ))}
                  </div>
                  <div className={styles.orderText}>
                    <strong>{order.orderNumber}</strong>
                    <span className={styles.muted}>
                      {formatDate(order.createdAt)}, {pluralize(order.items.reduce((n, i) => n + i.quantity, 0), "item")}
                    </span>
                  </div>
                  <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                  <span className={`${styles.total} tabular`}>{formatPrice(order.total)}</span>
                  <ChevronRight size={18} className={styles.chevron} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
