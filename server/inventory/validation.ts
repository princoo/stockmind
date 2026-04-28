import type { TransactionType } from "@/generated/prisma/enums";
import { TransactionType as TransactionTypeEnum } from "@/generated/prisma/enums";
import { InventoryServiceError } from "@/server/inventory/errors";

export type StockMovementInput = {
  productId: string;
  type: TransactionType;
  quantity: number;
};

export function validateStockMovementPayload(
  payload: Record<string, unknown>,
): StockMovementInput {
  const productId =
    typeof payload.productId === "string" ? payload.productId.trim() : "";
  const typeRaw = payload.type;
  const quantity = Number(payload.quantity);

  if (!productId) {
    throw new InventoryServiceError("Product is required.");
  }

  const type =
    typeRaw === TransactionTypeEnum.STOCK_IN ||
    typeRaw === TransactionTypeEnum.STOCK_OUT
      ? typeRaw
      : null;
  if (!type) {
    throw new InventoryServiceError("Type must be STOCK_IN or STOCK_OUT.");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new InventoryServiceError("Quantity must be a whole number of at least 1.");
  }

  return { productId, type, quantity };
}
