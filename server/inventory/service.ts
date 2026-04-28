import {
  recordStockMovementTx,
  getInventorySummaryStats,
} from "@/server/inventory/inventory-repository";
import { sendSupplierRestockRequestBestEffort } from "@/server/email/service";
import { validateStockMovementPayload } from "@/server/inventory/validation";
import { notifyAdminsBestEffort } from "@/server/notifications/service";

export async function recordStockMovement(
  userId: string,
  rawPayload: Record<string, unknown>,
) {
  const input = validateStockMovementPayload(rawPayload);
  const result = await recordStockMovementTx({
    productId: input.productId,
    userId,
    type: input.type,
    quantity: input.quantity,
  });

  const { movement, product } = result;
  const href = "/inventory";

  if (movement.type === "STOCK_OUT") {
    await notifyAdminsBestEffort({
      type: "ALERT",
      message: `Stock out: ${movement.quantity} units removed from ${product.name} (${product.sku}).`,
      entityType: "TRANSACTION",
      entityId: movement.id,
      href,
      extraUserIds: [userId],
    });
  }

  if (product.quantity === 0) {
    await sendSupplierRestockRequestBestEffort({
      productId: product.id,
      trigger: "OUT_OF_STOCK",
    });
  } else if (product.quantity <= product.lowStockThreshold) {
    await sendSupplierRestockRequestBestEffort({
      productId: product.id,
      trigger: "LOW_STOCK",
    });
  }

  if (product.quantity <= product.lowStockThreshold) {
    await notifyAdminsBestEffort({
      type: "WARNING",
      message: `Low stock warning: ${product.name} (${product.sku}) is at ${product.quantity} units.`,
      entityType: "PRODUCT",
      entityId: product.id,
      href,
      extraUserIds: [userId],
    });
  }

  return movement;
}

export async function getInventorySummary() {
  return getInventorySummaryStats();
}
