import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, ExternalLink, Package } from "lucide-react";
import { api, assetUrl } from "../../lib/api.js";
import { formatDate, formatPrice, pluralize } from "../../lib/format.js";
import { useCategories } from "../../hooks/queries.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, TableWrap } from "../../components/admin/AdminUI.jsx";
import { Badge, Pagination } from "../../components/ui/Controls.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Select } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Products() {
  useDocumentTitle("Products");
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = useDebounce(search.trim(), 300);
  const [toDelete, setToDelete] = useState(null);

  const filters = {
    q: q || undefined,
    category: params.get("category") || undefined,
    status: params.get("status") || "all",
    stock: params.get("stock") || "all",
    sort: params.get("sort") || "updated",
    page: Number(params.get("page")) || 1,
    limit: 15,
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "products", filters],
    queryFn: () => api.get("/admin/products", { query: filters }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const toggle = useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/admin/products/${id}`, patch),
    onSuccess: ({ product }) => {
      invalidate();
      toast.success(`${product.name} is now ${product.isActive ? "live" : "hidden from the store"}.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success(`Deleted ${toDelete.name}.`);
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <>
      <AdminHeader
        title="Products"
        description={data ? `${pluralize(data.pagination.total, "product")} match these filters.` : "Manage the catalogue."}
        actions={
          <Button to="/admin/products/new" size="sm">
            <Plus size={16} aria-hidden /> Add product
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by name, brand or SKU"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilter("page", "");
            }}
            aria-label="Search products"
          />
        </div>
        <Select className={styles.filterSelect} value={params.get("category") ?? ""} onChange={(e) => setFilter("category", e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select className={styles.filterSelect} value={filters.status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Status">
          <option value="all">Any status</option>
          <option value="active">Live</option>
          <option value="draft">Hidden</option>
        </Select>
        <Select className={styles.filterSelect} value={filters.stock} onChange={(e) => setFilter("stock", e.target.value)} aria-label="Stock">
          <option value="all">Any stock</option>
          <option value="low">Running low</option>
          <option value="out">Sold out</option>
        </Select>
        <Select className={styles.filterSelect} value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} aria-label="Sort">
          <option value="updated">Recently updated</option>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
          <option value="stock-asc">Stock, lowest first</option>
          <option value="rating">Top rated</option>
        </Select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title="No products found" action={<Button to="/admin/products/new">Add a product</Button>}>
          Change the filters or add a new product to the catalogue.
        </EmptyState>
      ) : (
        <TableWrap>
          <table style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Live</th>
                <th scope="col">Updated</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={7}>
                        <Skeleton height={44} />
                      </td>
                    </tr>
                  ))
                : items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.productCell}>
                          <img className={styles.thumb} src={assetUrl(p.images[0]?.url)} alt="" width="44" height="55" />
                          <div>
                            <Link to={`/admin/products/${p.id}`}>{p.name}</Link>
                            <div className={styles.muted}>
                              {p.brand}
                              {p.reviewCount > 0 && `, rated ${p.rating.toFixed(1)} (${p.reviewCount})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category?.name}</td>
                      <td className="tabular">
                        {formatPrice(p.price)}
                        {p.compareAtPrice > p.price && <div className={styles.muted}>was {formatPrice(p.compareAtPrice)}</div>}
                      </td>
                      <td>
                        <div className={styles.stockCell}>
                          {p.stock === 0 ? <Badge tone="danger">Sold out</Badge> : <strong className="tabular">{p.stock} units</strong>}
                          <div className={styles.sizeDots} aria-label="Stock by size">
                            {[...p.sizes]
                              .sort((a, b) => SIZE_ORDER.indexOf(a.label) - SIZE_ORDER.indexOf(b.label))
                              .map((s) => (
                                <span key={s.label} data-out={s.stock === 0 ? "" : undefined} data-low={s.stock > 0 && s.stock <= 3 ? "" : undefined} title={`${s.label}: ${s.stock}`}>
                                  {s.label}
                                </span>
                              ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={p.isActive}
                            onChange={(e) => toggle.mutate({ id: p.id, isActive: e.target.checked })}
                            disabled={toggle.isPending}
                            aria-label={`Show ${p.name} in the store`}
                          />
                        </label>
                      </td>
                      <td className={styles.muted}>{formatDate(p.updatedAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          {p.isActive && (
                            <a className={styles.iconAction} href={`/product/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`View ${p.name} in the store`} title="View in store">
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <Link className={styles.iconAction} to={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} title="Edit">
                            <Pencil size={16} />
                          </Link>
                          <button type="button" className={styles.iconAction} data-danger onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} title="Delete">
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
        <Pagination page={filters.page} totalPages={data?.pagination.totalPages ?? 1} onChange={(page) => setFilter("page", String(page))} />
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${toDelete?.name ?? "product"}?`}
        description="This removes the product and its images for good. Past orders keep their own copy of the details. To take it off sale without deleting, switch off “Live” instead."
        confirmLabel="Delete product"
        busy={remove.isPending}
        onConfirm={() => remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
