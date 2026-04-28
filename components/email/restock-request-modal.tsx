"use client";

import { useState } from "react";

type RestockRequestModalProps = Readonly<{
  open: boolean;
  productName: string;
  currentStock: number;
  requestedQuantityDefault: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { requestedQuantity: number; message: string }) => void;
}>;

export function RestockRequestModal({
  open,
  productName,
  currentStock,
  requestedQuantityDefault,
  submitting,
  onClose,
  onSubmit,
}: RestockRequestModalProps) {
  const [requestedQuantity, setRequestedQuantity] = useState(
    String(requestedQuantityDefault),
  );
  const [message, setMessage] = useState(
    `We are running low on ${productName}. Current stock is ${currentStock}. Please restock ${requestedQuantityDefault} units.`,
  );
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const quantityValue = Number(requestedQuantity);
  const quantityError =
    touched && (!Number.isInteger(quantityValue) || quantityValue <= 0)
      ? "Requested quantity must be a positive number."
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-900">Send restock request</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md border border-zinc-200 px-2 py-0.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            x
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-600">
          Product: <span className="font-medium text-zinc-900">{productName}</span> - Current stock:{" "}
          <span className="font-medium text-zinc-900">{currentStock}</span>
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Requested quantity</span>
            <input
              type="number"
              min={1}
              value={requestedQuantity}
              onChange={(event) => setRequestedQuantity(event.target.value)}
              onBlur={() => setTouched(true)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#0058be]"
            />
            {quantityError ? <span className="mt-1 block text-xs text-red-600">{quantityError}</span> : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Message</span>
            <textarea
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#0058be]"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={Boolean(quantityError) || submitting}
            onClick={() => {
              setTouched(true);
              if (quantityError) return;
              onSubmit({
                requestedQuantity: quantityValue,
                message: message.trim(),
              });
            }}
            className="rounded-md bg-[#0058be] px-3 py-2 text-sm font-semibold text-white hover:bg-[#004ca3] disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
