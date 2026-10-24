import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, ExternalLink } from "lucide-react";
import { api } from "../../lib/api.js";
import { formatDateTime, KIT_TYPE_LABEL } from "../../lib/format.js";
import { useCategories } from "../../hooks/queries.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, Panel } from "../../components/admin/AdminUI.jsx";
import { ImageUploader } from "../../components/admin/ImageUploader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Checkbox, Select, TextArea, TextInput } from "../../components/ui/Field.jsx";
import { ErrorState, Notice, PageLoader } from "../../components/ui/Feedback.jsx";
import styles from "./AdminPages.module.css";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "",
  team: "",
  season: "",
  kitType: "home",
  details: [],
  images: [],
  sizes: { XS: "", S: "", M: "", L: "", XL: "", XXL: "" },
  sku: "",
  isFeatured: false,
  isActive: true,
};

function fromProduct(p) {
  const sizes = { ...EMPTY.sizes };
  for (const s of p.sizes) sizes[s.label] = String(s.stock);
  return {
    name: p.name,
    description: p.description,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    category: p.category?.id ?? p.category ?? "",
    team: p.team ?? "",
    season: p.season ?? "",
    kitType: p.kitType,
    details: p.details ?? [],
    images: p.images ?? [],
    sizes,
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
    team: v.team.trim(),
    season: v.season.trim(),
    kitType: v.kitType,
    details: v.details.map((d) => d.trim()).filter(Boolean),
    images: v.images.map(({ url, publicId, width, height, format, bytes, alt }) => ({ url, publicId, width, height, format, bytes, alt: alt ?? "" })),
    sizes: SIZES.filter((label) => v.sizes[label] !== "").map((label) => ({ label, stock: Number(v.sizes[label]) })),
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
  const offered = SIZES.filter((s) => v.sizes[s] !== "");
  if (!offered.length) e.sizes = "Enter stock for at least one size (0 is fine if it's sold out).";
  else if (offered.some((s) => !/^\d+$/.test(v.sizes[s]))) e.sizes = "Stock must be a whole number.";
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
        description={isNew ? "New products appear in the store as soon as they're saved as live." : `Last updated ${formatDateTime(product?.updatedAt)}`}
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
              <TextInput label="Team" value={values.team} onChange={set("team")} error={errors.team} optional maxLength={80} />
              <TextInput label="Season" value={values.season} onChange={set("season")} error={errors.season} optional placeholder="26/27 or 1995" maxLength={20} />
            </div>
          </Panel>

          <Panel title="Images">
            <ImageUploader images={values.images} onChange={set("images")} error={errors.images} />
          </Panel>

          <Panel title="Stock by size">
            <p className={styles.help} style={{ marginBottom: 12 }}>
              Leave a size empty if it isn't made. Enter 0 to show it as sold out.
            </p>
            <div className={styles.sizeGrid}>
              {SIZES.map((size) => (
                <label key={size} className={styles.sizeInput} data-off={values.sizes[size] === "" ? "" : undefined}>
                  {size}
                  <input
                    inputMode="numeric"
                    value={values.sizes[size]}
                    placeholder="–"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setValues((x) => ({ ...x, sizes: { ...x.sizes, [size]: v } }));
                      if (errors.sizes) setErrors((x) => ({ ...x, sizes: undefined }));
                    }}
                    aria-label={`Stock for size ${size}`}
                  />
                </label>
              ))}
            </div>
            {errors.sizes && (
              <p role="alert" style={{ marginTop: 8, color: "var(--signal)", fontSize: "var(--text-sm)" }}>
                {errors.sizes}
              </p>
            )}
            <p className={styles.help} style={{ marginTop: 12 }}>
              Total: {SIZES.reduce((n, s) => n + (Number(values.sizes[s]) || 0), 0)} units
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
              <Checkbox label="Featured" description="Eligible for the home page and kit of the week." checked={values.isFeatured} onChange={set("isFeatured")} />
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
                hint="Set higher than the price to show the shirt as on sale."
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
              <Select label="Kit type" value={values.kitType} onChange={set("kitType")} error={errors.kitType}>
                {Object.entries(KIT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
