"use client";

import { useId } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions (delete) use a red confirm button. */
  variant?: "danger" | "neutral";
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog(props: Readonly<ConfirmDialogProps>) {
  const titleId = useId();
  const descId = useId();
  if (!props.open) return null;

  const confirmLabel = props.confirmLabel ?? "Confirm";
  const cancelLabel = props.cancelLabel ?? "Cancel";
  const variant = props.variant ?? "neutral";
  const loading = props.loading ?? false;

  const confirmClass =
    variant === "danger"
      ? "ui-btn-danger px-3 py-2"
      : "ui-btn-primary px-3 py-2";

  return (
    <div
      className="ui-modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        disabled={loading}
        onClick={() => {
          if (!loading) props.onClose();
        }}
      />
      <div className="ui-modal relative max-w-md space-y-4 p-5">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
          {props.title}
        </h2>
        <p id={descId} className="text-sm text-zinc-600">
          {props.description}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="ui-btn-secondary px-3 py-2"
            disabled={loading}
            onClick={props.onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            disabled={loading}
            onClick={props.onConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
