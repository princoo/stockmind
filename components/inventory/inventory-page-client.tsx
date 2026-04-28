"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendRestockRequestEmail } from "@/components/email/restock-request-client";
import { RestockRequestModal } from "@/components/email/restock-request-modal";
import { PaginationControls } from "@/components/products/pagination-controls";
import { InventorySummaryCards } from "@/components/inventory/inventory-summary-cards";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryToolbar } from "@/components/inventory/inventory-toolbar";
import { StockMovementModal } from "@/components/inventory/stock-movement-modal";
import {
  postStockMovement,
  useInventoryData,
} from "@/components/inventory/use-inventory-data";
import type { ProductListItem } from "@/types/products";

type ModalState =
  | { open: false }
  | { open: true; type: "STOCK_IN" | "STOCK_OUT"; product: ProductListItem };

type InventoryPageClientProps = Readonly<{
  canSendNotifications: boolean;
}>;

export function InventoryPageClient({ canSendNotifications }: InventoryPageClientProps) {
  const { query, setQuery, result, options, summary, loading, error, reload } =
    useInventoryData();

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    product: ProductListItem | null;
  }>({ open: false, product: null });
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const setSort = (value: string) => {
    const [sortBy, sortDir] = value.split(":");
    setQuery((v) => ({ ...v, page: 1, sortBy, sortDir }));
  };

  const closeModal = () => {
    if (!submitting) setModal({ open: false });
  };

  const submitMovement = async (quantity: number) => {
    if (modal.open !== true) return;
    try {
      setSubmitting(true);
      await postStockMovement({
        productId: modal.product.id,
        type: modal.type,
        quantity,
      });
      toast.success(
        modal.type === "STOCK_IN"
          ? "Stock-in recorded."
          : "Stock-out recorded.",
      );
      setModal({ open: false });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRestockEmail = async (payload: {
    requestedQuantity: number;
    message: string;
  }) => {
    if (!emailModal.product) return;

    try {
      setSendingEmail(true);
      const result = await sendRestockRequestEmail({
        productId: emailModal.product.id,
        requestedQuantity: payload.requestedQuantity,
        message: payload.message,
      });
      toast.success(
        result?.supplierEmail
          ? `Restock request sent to ${result.supplierEmail}.`
          : "Restock request sent.",
      );
      setEmailModal({ open: false, product: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send restock email.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <InventoryToolbar
        search={query.search}
        categoryId={query.categoryId}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        categories={options.categories}
        onSearch={(search) => setQuery((v) => ({ ...v, page: 1, search }))}
        onCategory={(categoryId) =>
          setQuery((v) => ({ ...v, page: 1, categoryId }))
        }
        onSort={setSort}
      />

      <InventorySummaryCards summary={summary} loading={loading} />

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <InventoryTable
        rows={result.items}
        loading={loading}
        canSendNotifications={canSendNotifications}
        onStockIn={(row) => setModal({ open: true, type: "STOCK_IN", product: row })}
        onStockOut={(row) =>
          setModal({ open: true, type: "STOCK_OUT", product: row })
        }
        onSendRestockEmail={(row) => setEmailModal({ open: true, product: row })}
      />

      {!loading && result.total > 0 ? (
        <PaginationControls
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          onPage={(page) => setQuery((v) => ({ ...v, page }))}
          itemLabel="entries"
        />
      ) : null}

      <StockMovementModal
        open={modal.open}
        type={modal.open ? modal.type : "STOCK_IN"}
        product={modal.open ? modal.product : null}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={(qty) => {
          void submitMovement(qty);
        }}
      />
      {emailModal.product ? (
        <RestockRequestModal
          key={`${emailModal.product.id}-${emailModal.open ? "open" : "closed"}`}
          open={emailModal.open}
          productName={emailModal.product.name}
          currentStock={emailModal.product.quantity}
          requestedQuantityDefault={Math.max(
            1,
            emailModal.product.lowStockThreshold * 2 - emailModal.product.quantity,
          )}
          submitting={sendingEmail}
          onClose={() => {
            if (!sendingEmail) setEmailModal({ open: false, product: null });
          }}
          onSubmit={(payload) => {
            void submitRestockEmail(payload);
          }}
        />
      ) : null}
    </div>
  );
}
