"use client";

import { useState } from "react";
import type { ProductListItem } from "@/types/products";

type MovementType = "STOCK_IN" | "STOCK_OUT";

type Props = {
  open: boolean;
  type: MovementType;
  product: ProductListItem | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (quantity: number) => void;
};

export function StockMovementModal(props: Readonly<Props>) {
  if (!props.open || !props.product) return null;

  return (
    <StockMovementModalInner
      key={`${props.type}-${props.product.id}-${props.open ? "open" : "closed"}`}
      {...props}
      product={props.product}
    />
  );
}

function StockMovementModalInner(props: Readonly<Props> & { product: ProductListItem }) {
  const [quantity, setQuantity] = useState("");
  const [touched, setTouched] = useState(false);

  const qtyNum = Number(quantity);
  const isInt = Number.isInteger(qtyNum);
  const tooLow = touched && (!quantity.trim() || !isInt || qtyNum < 1);
  const tooHigh =
    touched &&
    props.type === "STOCK_OUT" &&
    isInt &&
    qtyNum > props.product.quantity;
  let fieldError: string | null = null;
  if (tooLow) {
    fieldError = "Enter a whole number of at least 1.";
  } else if (tooHigh) {
    fieldError = `Cannot remove more than ${props.product.quantity} on hand.`;
  }

  const title = props.type === "STOCK_IN" ? "Stock in" : "Stock out";
  const submit = (
    e: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    e.preventDefault();
    setTouched(true);
    if (tooLow || tooHigh) return;
    props.onSubmit(qtyNum);
  };

  return (
    <div
      className="ui-modal-overlay"
    >
      <form
        onSubmit={submit}
        className="ui-modal max-w-md space-y-4 p-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {props.product.name}{" "}
            <span className="font-mono text-zinc-500">({props.product.sku})</span>
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Current on hand:{" "}
            <span className="font-semibold text-zinc-800">
              {props.product.quantity}
            </span>
            {props.type === "STOCK_OUT" ? (
              <span className="text-zinc-500"> — stock-out cannot exceed this.</span>
            ) : null}
          </p>
        </div>
        <div>
          <label
            htmlFor="stock-qty"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Quantity
          </label>
          <input
            id="stock-qty"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replaceAll(/\D/g, ""))}
            onBlur={() => setTouched(true)}
            placeholder="e.g. 10"
            className="ui-input mt-1"
            disabled={props.submitting}
            autoFocus
          />
          {fieldError ? (
            <p className="mt-1.5 text-xs text-red-600" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={props.submitting}
            onClick={props.onClose}
            className="ui-btn-secondary px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={props.submitting}
            className={
              props.type === "STOCK_IN"
                ? "ui-btn-primary px-3 py-2"
                : "ui-btn-danger border border-rose-200 px-3 py-2"
            }
          >
            {props.submitting ? "Saving…" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
