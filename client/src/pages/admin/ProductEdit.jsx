import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, ExternalLink } from "lucide-react";
import { api } from "../../lib/api.js";
import { formatDate, formatDateTime, GENDER_LABEL } from "../../lib/format.js";
import { useCategories } from "../../hooks/queries.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, Panel } from "../../components/admin/AdminUI.jsx";
import { ImageUploader } from "../../components/admin/ImageUploader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Checkbox, Select, TextArea, TextInput } from "../../components/ui/Field.jsx";
import { ErrorState, Notice, PageLoader } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

const SIZE_PRESETS = [
  { label: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Men's shoes", sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
  { label: "Women's shoes", sizes: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"] },
  { label: "One size", sizes: ["One size"] },
];
const SIZE_LABEL = /^[A-Za-z0-9][A-Za-z0-9 ./-]{0,15}$/;

const EMPTY = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "",
  brand: "",
  gender: "unisex",
  details: [],
  images: [],
  sizes: [{ label: "One size", stock: "" }],
  sku: "",
  isFeatured: false,
  isActive: true,
};

function fromProduct(p) {
  return {
    name: p.name,
    description: p.description,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    category: p.category?.id ?? p.category ?? "",
    brand: p.brand ?? "",
    gender: p.gender ?? "unisex",
    details: p.details ?? [],
    images: p.images ?? [],
    sizes: p.sizes.map((s) => ({ label: s.label, stock: String(s.stock) })),
    sku: p.sku ?? "",
    isFeatured: p.isFeatured,
    isActive: p.isActive,
  };
}

function toPayload(v) {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    price: Number(v.price),
    compareAtPrice: v.compareAtPrice === "" ? null : Number(v.compareAtPrice),
    category: v.category,
    brand: v.brand.trim(),
    gender: v.gender,
    details: v.details.map((d) => d.trim()).filter(Boolean),
    images: v.images.map(({ url, publicId, width, height, format, bytes, alt }) => ({ url, publicId, width, height, format, bytes, alt: alt ?? "" })),
    sizes: v.sizes.map((s) => ({ label: s.label.trim(), stock: Number(s.stock || 0) })),
    sku: v.sku.trim(),
    isFeatured: v.isFeatured,
    isActive: v.isActive,
  };
}

function validate(v) {
  const e = {};
  if (v.name.trim().length < 3) e.name = "Name must be at least 3 characters.";
  if (v.description.trim().length < 20) e.description = "Write at least 20 characters so shoppers know what they're buying.";
  if (!/^\d+$/.test(v.price)) e.price = "Enter the price in whole rupees.";
  if (v.compareAtPrice !== "" && !/^\d+$/.test(v.compareAtPrice)) e.compareAtPrice = "Enter a whole number or leave empty.";
  else if (v.compareAtPrice !== "" && Number(v.compareAtPrice) <= Number(v.price)) e.compareAtPrice = "Must be higher than the price to show as a sale.";
  if (!v.category) e.category = "Choose a category.";
  const labels = v.sizes.map((s) => s.label.trim());
  if (!v.sizes.length) e.sizes = "Add at least one size.";
  else if (labels.some((l) => !SIZE_LABEL.test(l))) e.sizes = "Size names can use letters, numbers, spaces, dots, slashes and dashes (up to 16 characters).";
  else if (new Set(labels).size !== labels.length) e.sizes = "Each size can only be listed once.";
  else if (v.sizes.some((s) => s.stock !== "" && !/^\d+$/.test(s.stock))) e.sizes = "Stock must be a whole number.";
  if (!v.images.length) e.images = "Add at least one image.";
  return e;
}

export default function ProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => (await api.get(`/admin/products/${id}`)).product,
    enabled: !isNew,
  });

  useEffect(() => {
    if (product) setValues(fromProduct(product));
  }, [product]);

  useDocumentTitle(isNew ? "Add product" : `Edit ${product?.name ?? "product"}`);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"], predicate: (q) => q.queryKey[1] !== "product" });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const save = useMutation({
    mutationFn: (payload) => (isNew ? api.post("/admin/products", payload) : api.put(`/admin/products/${id}`, payload)),
    onSuccess: ({ product: saved }) => {
      invalidate();
      queryClient.setQueryData(["admin", "product", saved.id], saved);
      toast.success(isNew ? `${saved.name} was added.` : "Changes saved.");
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
    },
    onError: (err) => {
      setErrors(err.fields);
      setFormError(err.message);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      // Drop the deleted product's cache before refreshing lists, so nothing
      // tries to refetch it.
      queryClient.removeQueries({ queryKey: ["admin", "product", id] });
      navigate("/admin/products", { replace: true });
      invalidate();
      toast.success("Product deleted.");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isNew && isLoading) return <PageLoader />;
  if (!isNew && error) return <ErrorState error={error} onRetry={refetch} />;

  const set = (field) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }));
  };

  function onSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) {
      setFormError("Some fields need attention before this can be saved.");
      return;
    }
    save.mutate(toPayload(values));
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Link to="/admin/products" className={styles.link} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <ArrowLeft size={16} aria-hidden /> All products
      </Link>
      <AdminHeader
        title={isNew ? "Add product" : product?.name}
        description={
          isNew
            ? "New products appear in the store as soon as they're saved as live."
            : `Added ${formatDate(product?.createdAt)}, last updated ${formatDateTime(product?.updatedAt)}`
        }
        actions={
          !isNew &&
          product?.isActive && (
            <Button href={`/product/${product.slug}`} target="_blank" rel="noreferrer" variant="secondary" size="sm">
              <ExternalLink size={15} aria-hidden /> View in store
            </Button>
          )
        }
      />

      {formError && (
        <div style={{ marginBottom: 20 }}>
          <Notice tone="error">{formError}</Notice>
        </div>
      )}

      <div className={styles.formLayout}>
        <div className={styles.formMain}>
          <Panel title="Details">
            <div className={styles.fieldGrid}>
              <TextInput className={styles.span2} label="Name" value={values.name} onChange={set("name")} error={errors.name} maxLength={120} />
              <TextArea
                className={styles.span2}
                label="Description"
                value={values.description}
                onChange={set("description")}
                error={errors.description}
                hint="Shown on the product page. Leave a blank line between paragraphs."
                maxLength={4000}
                rows={6}
              />
              <TextInput label="Brand" value={values.brand} onChange={set("brand")} error={errors.brand} optional maxLength={60} placeholder="e.g. Puma" />
              <Select label="For" value={values.gender} onChange={set("gender")} error={errors.gender}>
                {Object.entries(GENDER_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </Panel>

          <Panel title="Images">
            <ImageUploader images={values.images} onChange={set("images")} error={errors.images} />
          </Panel>

          <Panel title="Sizes and stock">
            <div className={styles.presets}>
              <span className={styles.help}>Start from:</span>
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.preset}
                  onClick={() => {
                    setValues((v) => ({
                      ...v,
                      sizes: preset.sizes.map((label) => ({ label, stock: v.sizes.find((s) => s.label === label)?.stock ?? "" })),
                    }));
                    setErrors((x) => ({ ...x, sizes: undefined }));
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <ul className={styles.sizeRows}>
              {values.sizes.map((row, i) => (
                <li key={i}>
                  <input
                    className={styles.sizeLabel}
                    value={row.label}
                    maxLength={16}
                    placeholder="Size"
                    aria-label={`Size name ${i + 1}`}
                    onChange={(e) => setValues((v) => ({ ...v, sizes: v.sizes.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)) }))}
                  />
                  <input
                    className={styles.sizeStock}
                    inputMode="numeric"
                    value={row.stock}
                    placeholder="0"
                    aria-label={`Stock for ${row.label || `size ${i + 1}`}`}
                    onChange={(e) => {
                      const stock = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setValues((v) => ({ ...v, sizes: v.sizes.map((s, j) => (j === i ? { ...s, stock } : s)) }));
                      if (errors.sizes) setErrors((x) => ({ ...x, sizes: undefined }));
                    }}
                  />
                  <span className={styles.help}>in stock</span>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => setValues((v) => ({ ...v, sizes: v.sizes.filter((_, j) => j !== i) }))}
                    aria-label={`Remove size ${row.label || i + 1}`}
                    disabled={values.sizes.length === 1}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {values.sizes.length < 12 && (
              <button type="button" className={styles.addLink} onClick={() => setValues((v) => ({ ...v, sizes: [...v.sizes, { label: "", stock: "" }] }))}>
                <Plus size={16} aria-hidden /> Add a size
              </button>
            )}
            {errors.sizes && (
              <p role="alert" style={{ marginTop: 8, color: "var(--sale)", fontSize: "var(--text-sm)" }}>
                {errors.sizes}
              </p>
            )}
            <p className={styles.help} style={{ marginTop: 12 }}>
              Total: {values.sizes.reduce((n, s) => n + (Number(s.stock) || 0), 0)} units. Sizes show to shoppers in this order; 0 shows as sold out.
            </p>
          </Panel>

          <Panel title="Highlights">
            <div style={{ display: "grid", gap: 10 }}>
              {values.details.map((detail, i) => (
                <div key={i} className={styles.detailRow}>
                  <TextInput
                    value={detail}
                    maxLength={160}
                    onChange={(e) => setValues((v) => ({ ...v, details: v.details.map((d, j) => (j === i ? e.target.value : d)) }))}
                    aria-label={`Highlight ${i + 1}`}
                    error={errors[`details.${i}`]}
                  />
                  <button
                    type="button"
                    className={styles.iconAction}
                    style={{ height: 48, width: 48 }}
                    onClick={() => setValues((v) => ({ ...v, details: v.details.filter((_, j) => j !== i) }))}
                    aria-label={`Remove highlight ${i + 1}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {values.details.length < 8 && (
                <button type="button" className={styles.addLink} onClick={() => setValues((v) => ({ ...v, details: [...v.details, ""] }))}>
                  <Plus size={16} aria-hidden /> Add a highlight
                </button>
              )}
            </div>
          </Panel>
        </div>

        <div className={styles.formSide}>
          <Panel title="Visibility">
            <div style={{ display: "grid", gap: 14 }}>
              <Checkbox label="Live in the store" description="Hidden products can't be viewed or bought." checked={values.isActive} onChange={set("isActive")} />
              <Checkbox label="Featured" description="Eligible for the home page stage and menu pick." checked={values.isFeatured} onChange={set("isFeatured")} />
            </div>
          </Panel>

          <Panel title="Pricing">
            <div style={{ display: "grid", gap: 16 }}>
              <TextInput label="Price" prefix="₹" inputMode="numeric" value={values.price} onChange={set("price")} error={errors.price} />
              <TextInput
                label="Compare-at price"
                prefix="₹"
                inputMode="numeric"
                optional
                value={values.compareAtPrice}
                onChange={set("compareAtPrice")}
                error={errors.compareAtPrice}
                hint="Set higher than the price to show the product as on sale."
              />
            </div>
          </Panel>

          <Panel title="Organisation">
            <div style={{ display: "grid", gap: 16 }}>
              <Select label="Category" value={values.category} onChange={set("category")} error={errors.category}>
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <TextInput label="SKU" optional value={values.sku} onChange={set("sku")} error={errors.sku} maxLength={40} />
            </div>
          </Panel>

          {!isNew && (
            <Panel title="Danger zone">
              <p className={styles.help} style={{ marginBottom: 12 }}>
                Deleting removes the product and its images. Past orders are not affected.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete product
              </Button>
            </Panel>
          )}
        </div>
      </div>

      <div className={styles.stickyBar}>
        <Button variant="secondary" to="/admin/products">
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {isNew ? "Add product" : "Save changes"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${product?.name ?? "this product"}?`}
        description="This can't be undone. To take it off sale temporarily, untick “Live in the store” instead."
        confirmLabel="Delete product"
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </form>
  );
}
