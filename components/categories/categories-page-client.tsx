"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryFormModal } from "@/components/categories/category-form-modal";
import { CategoriesGrid } from "@/components/categories/categories-grid";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategoriesData,
} from "@/components/categories/use-categories-data";
import type { CategoryItem } from "@/types/categories";

type CategoriesPageClientProps = Readonly<{
  canCreateCategory: boolean;
  canUpdateCategory: boolean;
  canDeleteCategory: boolean;
}>;

export function CategoriesPageClient({
  canCreateCategory,
  canUpdateCategory,
  canDeleteCategory,
}: CategoriesPageClientProps) {
  const { search, setSearch, items, loading, error } = useCategoriesData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const subtitle = useMemo(() => "Create, update and organize product groups.", []);

  const submit = async (name: string, description: string) => {
    if (editing && !canUpdateCategory) return;
    if (!editing && !canCreateCategory) return;
    try {
      setSubmitting(true);
      if (editing) await updateCategory(editing.id, name, description);
      else await createCategory(name, description);
      toast.success(editing ? "Category updated." : "Category created.");
      globalThis.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (item: CategoryItem) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!canDeleteCategory) return;
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Category deleted.");
      globalThis.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="ui-page-title ui-title-primary">Categories</h1>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
        {canCreateCategory ? (
          <button onClick={() => { setEditing(undefined); setOpen(true); }} className="ui-btn-primary h-10">
            + Add Category
          </button>
        ) : null}
      </div>
      <div className="ui-glass p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories" className="ui-input md:w-80" />
      </div>
      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <CategoriesGrid
        items={items}
        loading={loading}
        onEdit={(item) => { setEditing(item); setOpen(true); }}
        onDelete={requestDelete}
        onCreate={() => { setEditing(undefined); setOpen(true); }}
        canCreate={canCreateCategory}
        canUpdate={canUpdateCategory}
        canDelete={canDeleteCategory}
      />
      <CategoryFormModal open={open && (canCreateCategory || canUpdateCategory)} item={editing} submitting={submitting} onClose={() => setOpen(false)} onSubmit={submit} />
      <ConfirmDialog
        open={deleteTarget !== null && canDeleteCategory}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete category?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}". You cannot delete a category that still has products.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => { void confirmDelete(); }}
      />
    </div>
  );
}
