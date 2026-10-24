import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Search, Trash2, BadgeCheck } from "lucide-react";
import { api, assetUrl } from "../../lib/api.js";
import { formatDate, pluralize } from "../../lib/format.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, TableWrap } from "../../components/admin/AdminUI.jsx";
import { Pagination, Rating } from "../../components/ui/Controls.jsx";
import { Select } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

export default function Reviews() {
  useDocumentTitle("Reviews");
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const q = useDebounce(search.trim(), 300);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "reviews", { q, rating, page }],
    queryFn: () => api.get("/admin/reviews", { query: { q: q || undefined, rating: rating || undefined, page, limit: 15 } }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      toast.success("Review removed. The product rating has been recalculated.");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  return (
    <>
      <AdminHeader title="Reviews" description={data ? `${pluralize(data.pagination.total, "review")}. Remove anything abusive, off-topic or spam.` : "Moderate customer reviews."} />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search text or reviewer name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search reviews"
          />
        </div>
        <Select
          className={styles.filterSelect}
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          aria-label="Rating"
        >
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={<MessageSquareText size={24} />} title="No reviews match">
          Try another search or rating.
        </EmptyState>
      ) : (
        <TableWrap>
          <table style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Review</th>
                <th scope="col">Reviewer</th>
                <th scope="col">Date</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={5}>
                        <Skeleton height={40} />
                      </td>
                    </tr>
                  ))
                : items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.product ? (
                          <div className={styles.productCell} style={{ minWidth: 200 }}>
                            <img className={`${styles.thumb} product-photo`} src={assetUrl(r.product.images?.[0]?.url)} alt="" width="40" height="40" />
                            <Link to={`/product/${r.product.slug}`} target="_blank" rel="noreferrer">
                              {r.product.name}
                            </Link>
                          </div>
                        ) : (
                          <span className={styles.muted}>Deleted product</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 420 }}>
                        <Rating value={r.rating} count={1} size={12} showValue={false} />
                        {r.title && <div style={{ fontWeight: 600, marginTop: 4 }}>{r.title}</div>}
                        <div className={styles.muted} style={{ fontSize: "var(--text-sm)", marginTop: 2, color: "var(--ink-2)" }}>
                          {r.body}
                        </div>
                      </td>
                      <td>
                        {r.authorName}
                        {r.verified && (
                          <div className={styles.muted} style={{ color: "var(--ok)", display: "flex", gap: 4, alignItems: "center" }}>
                            <BadgeCheck size={13} aria-hidden /> Verified buyer
                          </div>
                        )}
                      </td>
                      <td className={styles.muted}>{formatDate(r.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" className={styles.iconAction} data-danger onClick={() => setToDelete(r)} aria-label={`Remove review by ${r.authorName}`} title="Remove">
                            <Trash2 size={16} />
                          </button>
                        </div>
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
        open={Boolean(toDelete)}
        title="Remove this review?"
        description={toDelete ? `“${toDelete.body.slice(0, 120)}” by ${toDelete.authorName}. The product's rating is recalculated straight away.` : ""}
        confirmLabel="Remove review"
        busy={remove.isPending}
        onConfirm={() => remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
