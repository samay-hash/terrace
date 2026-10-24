import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, SearchX } from "lucide-react";
import { useCategories, useProducts } from "../hooks/queries.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPrice, KIT_TYPE_LABEL, pluralize } from "../lib/format.js";
import { ProductGrid } from "../components/product/ProductCard.jsx";
import { Pagination } from "../components/ui/Controls.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Checkbox, Select } from "../components/ui/Field.jsx";
import { EmptyState, ErrorState } from "../components/ui/Feedback.jsx";
import { Drawer } from "../components/ui/Overlay.jsx";
import styles from "./Shop.module.css";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Bestselling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const PRICE_BANDS = [
  { id: "u1500", label: `Under ${formatPrice(1500)}`, max: 1499 },
  { id: "1500-2000", label: `${formatPrice(1500)} to ${formatPrice(2000)}`, min: 1500, max: 2000 },
  { id: "2000-2500", label: `${formatPrice(2000)} to ${formatPrice(2500)}`, min: 2000, max: 2500 },
  { id: "o2500", label: `Over ${formatPrice(2500)}`, min: 2501 },
];
const PAGE_SIZE = 12;

// Shop state lives in the URL so filtered views can be shared and the back
// button behaves.
function useShopParams() {
  const [params, setParams] = useSearchParams();
  const state = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    size: params.get("size") ?? "",
    kitType: params.get("kitType") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    onSale: params.get("onSale") === "true",
    inStock: params.get("inStock") === "true",
    sort: params.get("sort") ?? "featured",
    page: Math.max(1, Number(params.get("page")) || 1),
  };

  function update(changes, { keepPage = false } = {}) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === false || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    if (!keepPage) next.delete("page");
    if (next.get("sort") === "featured") next.delete("sort");
    setParams(next);
  }

  return [state, update, () => setParams(state.q ? { q: state.q } : {})];
}

function Filters({ state, update, categories }) {
  const band = PRICE_BANDS.find((b) => String(b.min ?? "") === state.minPrice && String(b.max ?? "") === state.maxPrice);

  return (
    <div className={styles.filters}>
      <fieldset className={styles.group}>
        <legend>Category</legend>
        <div className={styles.list}>
          <label className={styles.radio}>
            <input type="radio" name="category" checked={!state.category} onChange={() => update({ category: "" })} />
            <span>All shirts</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className={styles.radio}>
              <input type="radio" name="category" checked={state.category === c.slug} onChange={() => update({ category: c.slug })} />
              <span>{c.name}</span>
              <span className={styles.count}>{c.productCount}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Size in stock</legend>
        <div className={styles.chips}>
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={state.size === size}
              onClick={() => update({ size: state.size === size ? "" : size })}
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Price</legend>
        <div className={styles.list}>
          {PRICE_BANDS.map((b) => (
            <label key={b.id} className={styles.radio}>
              <input
                type="radio"
                name="price"
                checked={band?.id === b.id}
                onChange={() => update({ minPrice: b.min ?? "", maxPrice: b.max ?? "" })}
              />
              <span>{b.label}</span>
            </label>
          ))}
          {(state.minPrice || state.maxPrice) && (
            <button type="button" className={styles.reset} onClick={() => update({ minPrice: "", maxPrice: "" })}>
              Any price
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Kit</legend>
        <div className={styles.chips}>
          {Object.entries(KIT_TYPE_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={state.kitType === value}
              onClick={() => update({ kitType: state.kitType === value ? "" : value })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.group}>
        <Checkbox label="On sale" checked={state.onSale} onChange={(e) => update({ onSale: e.target.checked })} />
        <Checkbox label="Hide sold out" checked={state.inStock} onChange={(e) => update({ inStock: e.target.checked })} />
      </div>
    </div>
  );
}

export default function Shop() {
  const [state, update, clearAll] = useShopParams();
  const { data: categories = [] } = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = categories.find((c) => c.slug === state.category);

  const query = {
    q: state.q || undefined,
    category: state.category || undefined,
    size: state.size || undefined,
    kitType: state.kitType || undefined,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    onSale: state.onSale ? "true" : undefined,
    inStock: state.inStock ? "true" : undefined,
    sort: state.sort,
    page: state.page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, error, refetch } = useProducts(query);

  const title = state.q ? `Results for “${state.q}”` : state.onSale && !category ? "Sale" : category?.name ?? "All shirts";
  useDocumentTitle(state.q ? `Search: ${state.q}` : title);

  const chips = useMemo(() => {
    const list = [];
    if (state.q) list.push({ key: "q", label: `“${state.q}”` });
    if (category) list.push({ key: "category", label: category.name });
    if (state.size) list.push({ key: "size", label: `Size ${state.size}` });
    if (state.kitType) list.push({ key: "kitType", label: KIT_TYPE_LABEL[state.kitType] });
    if (state.minPrice || state.maxPrice) {
      const label = state.minPrice && state.maxPrice
        ? `${formatPrice(state.minPrice)} to ${formatPrice(state.maxPrice)}`
        : state.minPrice ? `Over ${formatPrice(Number(state.minPrice) - 1)}` : `Under ${formatPrice(Number(state.maxPrice) + 1)}`;
      list.push({ key: "price", label });
    }
    if (state.onSale) list.push({ key: "onSale", label: "On sale" });
    if (state.inStock) list.push({ key: "inStock", label: "In stock" });
    return list;
  }, [state, category]);

  function removeChip(key) {
    if (key === "price") update({ minPrice: "", maxPrice: "" });
    else update({ [key]: "" });
  }

  const total = data?.pagination?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {category?.description && !state.q && <p className={styles.description}>{category.description}</p>}
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Filters">
          <Filters state={state} update={update} categories={categories} />
        </aside>

        <section className={styles.results} aria-labelledby="results-count">
          <div className={styles.toolbar}>
            <p id="results-count" className={styles.resultCount} aria-live="polite">
              {isLoading ? "Loading shirts…" : pluralize(total, "shirt")}
            </p>
            <div className={styles.toolbarRight}>
              <Button variant="secondary" size="sm" className={styles.filterButton} onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={16} aria-hidden /> Filters{chips.length ? ` (${chips.length})` : ""}
              </Button>
              <Select className={styles.sort} value={state.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort: {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={styles.active}>
              {chips.map((chip) => (
                <button key={chip.key} type="button" className={styles.activeChip} onClick={() => removeChip(chip.key)} aria-label={`Remove filter ${chip.label}`}>
                  {chip.label} <X size={14} aria-hidden />
                </button>
              ))}
              <button type="button" className={styles.clear} onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}

          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !isLoading && items.length === 0 ? (
            <EmptyState
              icon={<SearchX size={24} />}
              title="No shirts match these filters"
              action={
                <Button variant="dark" onClick={() => (state.q ? update({ q: "" }) : clearAll())}>
                  {state.q ? "Clear search" : "Clear filters"}
                </Button>
              }
            >
              Try a different size or price, or remove a filter. Chotu can also help you find something.
            </EmptyState>
          ) : (
            <div className={styles.grid} data-fetching={isFetching && !isLoading ? "" : undefined}>
              <ProductGrid products={items} loading={isLoading} columns={3} skeletonCount={6} />
            </div>
          )}

          <div className={styles.pagination}>
            <Pagination
              page={state.page}
              totalPages={data?.pagination?.totalPages ?? 1}
              onChange={(page) => {
                update({ page }, { keepPage: true });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className={styles.drawerFoot}>
            <Button variant="secondary" onClick={clearAll}>
              Clear all
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Show {pluralize(total, "shirt")}</Button>
          </div>
        }
      >
        <Filters state={state} update={update} categories={categories} />
      </Drawer>
    </div>
  );
}
