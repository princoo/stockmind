"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendRestockRequestEmail } from "@/components/email/restock-request-client";
import { RestockRequestModal } from "@/components/email/restock-request-modal";
import { PaginationControls } from "@/components/products/pagination-controls";
import { ProductFormModal } from "@/components/products/product-form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsToolbar } from "@/components/products/products-toolbar";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  useProductsData,
  type ProductListItem,
} from "@/components/products/use-products-data";

type ProductsPageClientProps = Readonly<{
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  canSendNotifications: boolean;
}>;

export function ProductsPageClient({
  canManageProducts,
  canDeleteProducts,
  canSendNotifications,
}: ProductsPageClientProps) {
  const { query, setQuery, result, options, loading, error, reload } = useProductsData();





  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductListItem | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailTarget, setEmailTarget] = useState<ProductListItem | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const setSort = (value: string) => {
    const [sortBy, sortDir] = value.split(":");
    setQuery((v) => ({ ...v, page: 1, sortBy, sortDir }));
  };

  const submit = async (payload: Record<string, unknown>) => {
    if (!canManageProducts) return;
    try {
      setSubmitting(true);
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      setModalOpen(false);
      setEditing(undefined);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (row: ProductListItem) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!canDeleteProducts) return;
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Product deleted.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const submitRestockEmail = async (payload: {
    requestedQuantity: number;
    message: string;
  }) => {
    if (!emailTarget) return;
    try {
      setSendingEmail(true);
      const result = await sendRestockRequestEmail({
        productId: emailTarget.id,
        requestedQuantity: payload.requestedQuantity,
        message: payload.message,
      });
      toast.success(
        result?.supplierEmail
          ? `Restock request sent to ${result.supplierEmail}.`
          : "Restock request sent.",
      );
      setEmailTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email send failed");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      <ProductsToolbar
        search={query.search}
        categoryId={query.categoryId}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        categories={options.categories}
        onSearch={(search) => setQuery((v) => ({ ...v, page: 1, search }))}
        onCategory={(categoryId) => setQuery((v) => ({ ...v, page: 1, categoryId }))}
        onSort={setSort}
        canManageProducts={canManageProducts}
        onOpenCreate={() => { setEditing(undefined); setModalOpen(true); }}
      />
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <ProductsTable
        rows={result.items}
        loading={loading}
        canManageProducts={canManageProducts}
        canDeleteProducts={canDeleteProducts}
        canSendNotifications={canSendNotifications}
        onEdit={(row) => { setEditing(row); setModalOpen(true); }}
        onDelete={requestDelete}
        onSendRestockEmail={(row) => setEmailTarget(row)}
      />
      <PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} pageSize={result.pageSize} onPage={(page) => setQuery((v) => ({ ...v, page }))} />
      <ProductFormModal open={modalOpen && canManageProducts} submitting={submitting} categories={options.categories} suppliers={options.suppliers} product={editing} onClose={() => setModalOpen(false)} onSubmit={submit} />
      <ConfirmDialog
        open={deleteTarget !== null && canDeleteProducts}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete product?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}" (${deleteTarget.sku}) from the catalog.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => { void confirmDelete(); }}
      />
      {emailTarget ? (
        <RestockRequestModal
          key={emailTarget.id}
          open={emailTarget !== null}
          productName={emailTarget.name}
          currentStock={emailTarget.quantity}
          requestedQuantityDefault={Math.max(
            1,
            emailTarget.lowStockThreshold * 2 - emailTarget.quantity,
          )}
          submitting={sendingEmail}
          onClose={() => {
            if (!sendingEmail) setEmailTarget(null);
          }}
          onSubmit={(payload) => {
            void submitRestockEmail(payload);
          }}
        />
      ) : null}
    </div>
  );
}
