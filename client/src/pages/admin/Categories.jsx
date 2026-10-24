import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { api } from "../../lib/api.js";
import { pluralize } from "../../lib/format.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { AdminHeader, ConfirmDialog, TableWrap } from "../../components/admin/AdminUI.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { TextArea, TextInput } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Notice, PageLoader } from "../../components/ui/Feedback.jsx";
import { Modal } from "../../components/ui/Overlay.jsx";
import styles from "./AdminPages.module.css";

const BLANK = { name: "", description: "", sortOrder: "0" };

function CategoryForm({ initial, onSubmit, onCancel, busy, serverErrors, serverMessage }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const allErrors = { ...serverErrors, ...errors };

  function submit(e) {
    e.preventDefault();
    const found = {};
    if (values.name.trim().length < 2) found.name = "Name must be at least 2 characters.";
    if (!/^\d{1,3}$/.test(values.sortOrder)) found.sortOrder = "Use a number from 0 to 999.";
    setErrors(found);
    if (!Object.keys(found).length) onSubmit({ name: values.name.trim(), description: values.description.trim(), sortOrder: Number(values.sortOrder) });
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16, paddingBottom: 20 }}>
      {serverMessage && <Notice tone="error">{serverMessage}</Notice>}
      <TextInput label="Name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} error={allErrors.name} maxLength={60} data-autofocus />
      <TextArea
        label="Description"
        optional
        rows={3}
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
        error={allErrors.description}
        maxLength={280}
        hint="Shown at the top of the category page."
      />
      <TextInput
        label="Position"
        inputMode="numeric"
        value={values.sortOrder}
        onChange={(e) => setValues({ ...values, sortOrder: e.target.value.replace(/\D/g, "") })}
        error={allErrors.sortOrder}
        hint="Lower numbers appear first in the navigation."
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Save category
        </Button>
      </div>
    </form>
  );
}

export default function Categories() {
  useDocumentTitle("Categories");
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | "new" | category
  const [toDelete, setToDelete] = useState(null);

  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await api.get("/admin/categories")).items,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const save = useMutation({
    mutationFn: (payload) => (editing === "new" ? api.post("/admin/categories", payload) : api.put(`/admin/categories/${editing.id}`, payload)),
    onSuccess: ({ category }) => {
      invalidate();
      toast.success(editing === "new" ? `${category.name} was added.` : "Category updated.");
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success(`Deleted ${toDelete.name}.`);
      setToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setToDelete(null);
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <AdminHeader
        title="Categories"
        description="Categories drive the store navigation and shop filters."
        actions={
          <Button size="sm" onClick={() => { save.reset(); setEditing("new"); }}>
            <Plus size={16} aria-hidden /> Add category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState icon={<Tags size={24} />} title="No categories yet" action={<Button onClick={() => setEditing("new")}>Add a category</Button>}>
          Products need a category before they can be added.
        </EmptyState>
      ) : (
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th scope="col">Position</th>
                <th scope="col">Category</th>
                <th scope="col">Products</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="tabular">{c.sortOrder}</td>
                  <td>
                    <div className={styles.catName}>{c.name}</div>
                    <div className={styles.muted}>/{c.slug}</div>
                    {c.description && <div className={styles.muted} style={{ maxWidth: 520, marginTop: 4 }}>{c.description}</div>}
                  </td>
                  <td>
                    <Link className={styles.link} to={`/admin/products?category=${c.slug}`}>
                      {pluralize(c.productCount, "product")}
                    </Link>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={styles.iconAction} onClick={() => { save.reset(); setEditing(c); }} aria-label={`Edit ${c.name}`} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button type="button" className={styles.iconAction} data-danger onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`} title="Delete">
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

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Add category" : `Edit ${editing?.name ?? ""}`}>
        {editing && (
          <CategoryForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? BLANK : { name: editing.name, description: editing.description ?? "", sortOrder: String(editing.sortOrder) }}
            busy={save.isPending}
            serverErrors={save.error?.fields ?? {}}
            serverMessage={save.error && !Object.keys(save.error.fields ?? {}).length ? save.error.message : ""}
            onSubmit={(payload) => save.mutate(payload)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${toDelete?.name ?? "category"}?`}
        description={
          toDelete?.productCount
            ? `This category still has ${pluralize(toDelete.productCount, "product")}. Move them to another category first; the store won't delete a category that's in use.`
            : "It will disappear from the store navigation."
        }
        confirmLabel="Delete category"
        busy={remove.isPending}
        onConfirm={() => remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
