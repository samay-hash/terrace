import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, assetUrl } from "../../lib/api.js";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../../lib/format.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { AdminHeader, Panel, StatTile, TableWrap } from "../../components/admin/AdminUI.jsx";
import { Badge } from "../../components/ui/Controls.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { ErrorState, PageLoader } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

export default function Overview() {
  useDocumentTitle("Admin overview");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "overview"], queryFn: () => api.get("/admin/overview") });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { counts, last30Days, lowStock, recentOrders, lowStockThreshold } = data;

  return (
    <>
      <AdminHeader
        title="Overview"
        description="How the store is doing over the last 30 days."
        actions={
          <Button to="/admin/products/new" size="sm">
            <Plus size={16} aria-hidden /> Add product
          </Button>
        }
      />

      <div className={styles.stats}>
        <StatTile tone="dark" label="Revenue, last 30 days" value={formatPrice(last30Days.revenue)} note="Excludes cancelled orders" />
        <StatTile label="Orders, last 30 days" value={last30Days.orders} />
        <StatTile label="Waiting to ship" value={counts.openOrders} note="Placed or packed" />
        <StatTile label="Live products" value={`${counts.activeProducts} / ${counts.products}`} note={`${counts.categories} categories`} />
        <StatTile label="Sold out" value={counts.outOfStock} tone={counts.outOfStock ? "alert" : undefined} note="Products with no stock" />
        <StatTile label="Customers" value={counts.customers} />
      </div>

      <div className={styles.split}>
        <Panel title="Recent orders" action={<Link to="/admin/orders" className={styles.link}>All orders</Link>}>
          {recentOrders.length === 0 ? (
            <p className={styles.muted}>No orders yet.</p>
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Status</th>
                    <th scope="col" className={styles.right}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <div className={styles.muted}>{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td>{order.user?.name ?? "Deleted user"}</td>
                      <td>
                        <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      </td>
                      <td className={`${styles.right} tabular`}>{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        <Panel title="Running low" action={<Link to="/admin/products?stock=low" className={styles.link}>See all</Link>}>
          {lowStock.length === 0 ? (
            <p className={styles.muted}>Nothing at or under {lowStockThreshold} units. Nice.</p>
          ) : (
            <ul className={styles.lowList}>
              {lowStock.map((p) => (
                <li key={p.id}>
                  <img src={assetUrl(p.images[0]?.url)} alt="" width="44" height="55" />
                  <Link to={`/admin/products/${p.id}`} className={styles.lowName}>
                    {p.name}
                    <span className={styles.muted}>
                      {p.sizes.filter((s) => s.stock === 0).map((s) => s.label).join(", ") || "All sizes in stock"}
                      {p.sizes.some((s) => s.stock === 0) && " sold out"}
                    </span>
                  </Link>
                  <Badge tone="warn">{p.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
