import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, SearchX, LayoutGrid, Grid3x3, ChevronRight } from "lucide-react";
import { useCategories, useFacets, useProducts } from "../hooks/queries.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPrice, pluralize } from "../lib/format.js";
import { readJSON, writeJSON } from "../lib/storage.js";
import { ProductGrid } from "../components/product/ProductCard.jsx";
import { Pagination } from "../components/ui/Controls.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Checkbox, Select } from "../components/ui/Field.jsx";
import { EmptyState, ErrorState } from "../components/ui/Feedback.jsx";
import { Drawer } from "../components/ui/Overlay.jsx";
import styles from "./Shop.module.css";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Bestselling" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];
const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];
const PRICE_BANDS = [
  { id: "u2k", label: `Under ${formatPrice(2000)}`, max: 1999 },
  { id: "2-10k", label: `${formatPrice(2000)} – ${formatPrice(10000)}`, min: 2000, max: 10000 },
  { id: "10-50k", label: `${formatPrice(10000)} – ${formatPrice(50000)}`, min: 10000, max: 50000 },
  { id: "o50k", label: `Over ${formatPrice(50000)}`, min: 50001 },
];
const PAGE_SIZE = 12;
const BRANDS_COLLAPSED = 8;

// Shop state lives in the URL so filtered views can be shared and the back
// button behaves.
function useShopParams() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) ?? "";
  const state = {
    q: get("q"),
    category: get("category"),
    brand: get("brand"),
    gender: get("gender"),
    size: get("size"),
    minPrice: get("minPrice"),
    maxPrice: get("maxPrice"),
    minRating: get("minRating"),
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

  const clearAll = () => setParams(state.q ? { q: state.q } : state.category ? { category: state.category } : {});
  return [state, update, clearAll];
}

function FilterGroup({ title, children }) {
  return (
    <fieldset className={styles.group}>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function Filters({ state, update, categories, facets }) {
  const [allBrands, setAllBrands] = useState(false);
  const band = PRICE_BANDS.find((b) => String(b.min ?? "") === state.minPrice && String(b.max ?? "") === state.maxPrice);
  const brands = facets?.brands ?? [];
  const shownBrands = allBrands ? brands : brands.slice(0, BRANDS_COLLAPSED);

  return (
    <div className={styles.filters}>
      <FilterGroup title="Category">
        <div className={styles.list}>
          <label className={styles.radio}>
            <input type="radio" name="category" checked={!state.category} onChange={() => update({ category: "", size: "", brand: "" })} />
            <span>Everything</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className={styles.radio}>
              <input type="radio" name="category" checked={state.category === c.slug} onChange={() => update({ category: c.slug, size: "", brand: "" })} />
              <span>{c.name}</span>
              <span className={styles.count}>{c.productCount}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="For">
        <div className={styles.chips}>
          {GENDERS.map((g) => (
            <button key={g.value} type="button" aria-pressed={state.gender === g.value} onClick={() => update({ gender: state.gender === g.value ? "" : g.value })}>
              {g.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {facets?.sizes?.length > 1 && (
        <FilterGroup title="Size in stock">
          <div className={styles.chips}>
            {facets.sizes.map((size) => (
              <button key={size} type="button" aria-pressed={state.size === size} onClick={() => update({ size: state.size === size ? "" : size })}>
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          <div className={styles.list}>
            {shownBrands.map((b) => (
              <label key={b.name} className={styles.radio}>
                <input type="radio" name="brand" checked={state.brand === b.name} onChange={() => update({ brand: b.name })} />
                <span>{b.name}</span>
                <span className={styles.count}>{b.count}</span>
              </label>
            ))}
            {brands.length > BRANDS_COLLAPSED && (
              <button type="button" className={styles.reset} onClick={() => setAllBrands((v) => !v)}>
                {allBrands ? "Show fewer" : `Show all ${brands.length}`}
              </button>
            )}
            {state.brand && (
              <button type="button" className={styles.reset} onClick={() => update({ brand: "" })}>
                Any brand
              </button>
            )}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <div className={styles.list}>
          {PRICE_BANDS.map((b) => (
            <label key={b.id} className={styles.radio}>
              <input type="radio" name="price" checked={band?.id === b.id} onChange={() => update({ minPrice: b.min ?? "", maxPrice: b.max ?? "" })} />
              <span>{b.label}</span>
            </label>
          ))}
          {(state.minPrice || state.maxPrice) && (
            <button type="button" className={styles.reset} onClick={() => update({ minPrice: "", maxPrice: "" })}>
              Any price
            </button>
          )}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className={styles.chips}>
          {[4, 3].map((r) => (
            <button key={r} type="button" aria-pressed={state.minRating === String(r)} onClick={() => update({ minRating: state.minRating === String(r) ? "" : r })}>
              {r}★ and up
            </button>
          ))}
        </div>
      </FilterGroup>

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
  const { data: facets } = useFacets(state.category || undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columns, setColumns] = useState(() => (readJSON("terrace.grid", 3) === 2 ? 2 : 3));
  const category = categories.find((c) => c.slug === state.category);

  const query = {
    q: state.q || undefined,
    category: state.category || undefined,
    brand: state.brand || undefined,
    gender: state.gender || undefined,
    size: state.size || undefined,
    minPrice: state.minPrice || undefined,
    maxPrice: state.maxPrice || undefined,
    minRating: state.minRating || undefined,
    onSale: state.onSale ? "true" : undefined,
    inStock: state.inStock ? "true" : undefined,
    sort: state.sort,
    page: state.page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, error, refetch } = useProducts(query);

  const title = state.q ? `“${state.q}”` : state.brand && !category ? state.brand : state.onSale && !category ? "Sale" : category?.name ?? "Everything";
  useDocumentTitle(state.q ? `Search: ${state.q}` : title);

  const chips = useMemo(() => {
    const list = [];
    if (state.q) list.push({ key: "q", label: `Search: ${state.q}` });
    if (state.brand) list.push({ key: "brand", label: state.brand });
    if (state.gender) list.push({ key: "gender", label: state.gender === "men" ? "Men" : "Women" });
    if (state.size) list.push({ key: "size", label: `Size ${state.size}` });
    if (state.minPrice || state.maxPrice) {
      const band = PRICE_BANDS.find((b) => String(b.min ?? "") === state.minPrice && String(b.max ?? "") === state.maxPrice);
      list.push({ key: "price", label: band?.label ?? "Price range" });
    }
    if (state.minRating) list.push({ key: "minRating", label: `${state.minRating}★ and up` });
    if (state.onSale) list.push({ key: "onSale", label: "On sale" });
    if (state.inStock) list.push({ key: "inStock", label: "In stock" });
    return list;
  }, [state]);

  const removeChip = (key) => (key === "price" ? update({ minPrice: "", maxPrice: "" }) : update({ [key]: "" }));
  const setGrid = (n) => {
    setColumns(n);
    writeJSON("terrace.grid", n);
  };

  const total = data?.pagination?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} aria-hidden />
        {category ? (
          <>
            <Link to="/shop">Shop</Link>
            <ChevronRight size={13} aria-hidden />
            <span aria-current="page">{category.name}</span>
          </>
        ) : (
          <span aria-current="page">Shop</span>
        )}
      </nav>

      <header className={styles.header}>
        <div>
          <h1 className={`display ${styles.title}`}>{title}</h1>
          <p className={styles.description}>
            {state.q
              ? `${pluralize(total, "result")} for your search.`
              : category?.description ?? "Everything we stock, from trainers and watches to cricket bats."}
          </p>
        </div>
        <ul className={`${styles.catChips} no-scrollbar`} aria-label="Categories">
          <li>
            <Link to="/shop" aria-current={!state.category ? "page" : undefined}>
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link to={`/shop?category=${c.slug}`} aria-current={state.category === c.slug ? "page" : undefined}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className={styles.toolbar}>
        <Button variant="secondary" size="sm" className={styles.filterButton} onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={15} aria-hidden /> Filters{chips.length ? ` (${chips.length})` : ""}
        </Button>
        <p className={styles.resultCount} aria-live="polite">
          {isLoading ? "Loading…" : pluralize(total, "product")}
        </p>
        <div className={styles.toolbarRight}>
          <div className={styles.density} role="group" aria-label="Grid size">
            <button type="button" aria-pressed={columns === 2} onClick={() => setGrid(2)} aria-label="Two per row, larger images">
              <LayoutGrid size={17} />
            </button>
            <button type="button" aria-pressed={columns === 3} onClick={() => setGrid(3)} aria-label="Three per row">
              <Grid3x3 size={17} />
            </button>
          </div>
          <Select className={styles.sort} value={state.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Filters">
          <Filters state={state} update={update} categories={categories} facets={facets} />
        </aside>

        <section className={styles.results} aria-label="Products">
          {chips.length > 0 && (
            <div className={styles.active}>
              {chips.map((chip) => (
                <button key={chip.key} type="button" className={styles.activeChip} onClick={() => removeChip(chip.key)} aria-label={`Remove filter ${chip.label}`}>
                  {chip.label} <X size={13} aria-hidden />
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
              title="Nothing matches these filters"
              action={
                <Button variant="dark" onClick={() => (state.q ? update({ q: "" }) : clearAll())}>
                  {state.q ? "Clear search" : "Clear filters"}
                </Button>
              }
            >
              Try a different size, price or brand, or ask Chotu to find something similar.
            </EmptyState>
          ) : (
            <div className={styles.grid} data-fetching={isFetching && !isLoading ? "" : undefined}>
              <ProductGrid products={items} loading={isLoading} columns={columns} skeletonCount={6} />
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
            <Button onClick={() => setFiltersOpen(false)}>Show {pluralize(total, "product")}</Button>
          </div>
        }
      >
        <Filters state={state} update={update} categories={categories} facets={facets} />
      </Drawer>
    </div>
  );
}
