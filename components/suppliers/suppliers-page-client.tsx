"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PaginationControls } from "@/components/products/pagination-controls";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
  useSuppliersData,
} from "@/components/suppliers/use-suppliers-data";
import type { SupplierItem, SupplierPayload } from "@/types/suppliers";

export function SuppliersPageClient({
  canManageSuppliers,
}: Readonly<{ canManageSuppliers: boolean }>) {
  const { search, setSearch, page, setPage, result, loading, error } =
    useSuppliersData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const subtitle = useMemo(
    () => "Manage and track your inventory supplier network.",
    [],
  );

  const submit = async (payload: SupplierPayload) => {
    if (!canManageSuppliers) return;
    try {
      setSubmitting(true);
      if (editing) await updateSupplier(editing.id, payload);
      else await createSupplier(payload);
      toast.success(editing ? "Supplier updated." : "Supplier created.");
      globalThis.location.reload();
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Save failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!canManageSuppliers) return;
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Supplier deleted.");
      globalThis.location.reload();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="ui-page-title ui-title-primary">Suppliers</h1>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
        {canManageSuppliers ? (
          <button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
            className="ui-btn-primary h-10"
          >
            + New Supplier
          </button>
        ) : null}
      </div>

      <div className="ui-glass p-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by supplier, contact, email, or phone..."
          className="ui-input md:w-96"
        />
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <SuppliersTable
        rows={result.items}
        loading={loading}
        canManageSuppliers={canManageSuppliers}
        onEdit={(row) => {
          setEditing(row);
          setOpen(true);
        }}
        onDelete={(row) => setDeleteTarget(row)}
      />

      <PaginationControls
        page={page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        onPage={setPage}
      />

      <SupplierFormModal
        open={open && canManageSuppliers}
        item={editing}
        submitting={submitting}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={deleteTarget !== null && canManageSuppliers}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete supplier?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}". Suppliers linked to products cannot be deleted.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
