import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReceiptText, Search } from "lucide-react";
import { api } from "../../lib/api.js";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, pluralize } from "../../lib/format.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, TableWrap } from "../../components/admin/AdminUI.jsx";
import { Badge, Pagination } from "../../components/ui/Controls.jsx";
import { Select } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

// Mirrors the transitions the API allows.
const NEXT = { placed: ["packed", "cancelled"], packed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };

export default function Orders() {
  useDocumentTitle("Orders");
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);
  const q = useDebounce(search.trim(), 300);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "orders", { status, q, page }],
    queryFn: () => api.get("/admin/orders", { query: { status, q: q || undefined, page, limit: 15 } }),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ id, next }) => api.patch(`/admin/orders/${id}/status`, { status: next }),
    onSuccess: ({ order }) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${order.orderNumber} marked ${ORDER_STATUS_LABEL[order.status].toLowerCase()}.`);
      setCancelling(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  function onStatusChange(order, next) {
    if (!next) return;
    if (next === "cancelled") setCancelling(order);
    else update.mutate({ id: order.id, next });
  }

  return (
    <>
      <AdminHeader title="Orders" description={data ? `${pluralize(data.pagination.total, "order")}.` : "Track and fulfil orders."} />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by order number"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search orders"
          />
        </div>
        <Select
          className={styles.filterSelect}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Status"
        >
          <option value="all">All statuses</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={<ReceiptText size={24} />} title="No orders here">
          Orders matching these filters will appear here.
        </EmptyState>
      ) : (
        <TableWrap>
          <table style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Update</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={6}>
                        <Skeleton height={40} />
                      </td>
                    </tr>
                  ))
                : items.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <div className={styles.muted}>{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td>
                        {order.user?.name ?? "Deleted user"}
                        <div className={styles.muted}>
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </div>
                      </td>
                      <td>
                        <div className={styles.orderItems}>
                          {order.items.map((item, i) => (
                            <span key={i}>
                              {item.quantity} × {item.name} ({item.size})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="tabular">{formatPrice(order.total)}</td>
                      <td>
                        <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      </td>
                      <td>
                        {NEXT[order.status].length ? (
                          <select
                            className={styles.statusSelect}
                            value=""
                            onChange={(e) => onStatusChange(order, e.target.value)}
                            disabled={update.isPending}
                            aria-label={`Update status of ${order.orderNumber}`}
                          >
                            <option value="">Mark as…</option>
                            {NEXT[order.status].map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.muted}>Final</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className={styles.footerBar}>
        <span className={styles.muted}>{data && `Page ${data.pagination.page} of ${data.pagination.totalPages}`}</span>
        <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={`Cancel ${cancelling?.orderNumber ?? "order"}?`}
        description="The items go back into stock and the customer sees the order as cancelled. This can't be undone."
        confirmLabel="Cancel order"
        busy={update.isPending}
        onConfirm={() => update.mutate({ id: cancelling.id, next: "cancelled" })}
        onClose={() => setCancelling(null)}
      />
    </>
  );
}
