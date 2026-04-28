import { prisma } from "@/lib/prisma";
import type { TransactionType } from "@/generated/prisma/enums";
import { InventoryServiceError } from "@/server/inventory/errors";

export async function recordStockMovementTx(input: {
  productId: string;
  userId: string;
  type: TransactionType;
  quantity: number;
}) {
  return prisma.$transaction(async (tx) => {
    const productCount = await tx.product.count({
      where: { id: input.productId },
    });
    if (productCount === 0) {
      throw new InventoryServiceError("Product not found.", 404);
    }

    if (input.type === "STOCK_IN") {
      await tx.product.update({
        where: { id: input.productId },
        data: { quantity: { increment: input.quantity } },
      });
    } else {
      const updated = await tx.product.updateMany({
        where: {
          id: input.productId,
          quantity: { gte: input.quantity },
        },
        data: { quantity: { decrement: input.quantity } },
      });
      if (updated.count !== 1) {
        throw new InventoryServiceError(
          "Stock-out would exceed available quantity.",
          400,
        );
      }
    }

    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        lowStockThreshold: true,
      },
    });
    if (!product) {
      throw new InventoryServiceError("Product not found.", 404);
    }

    const movement = await tx.transaction.create({
      data: {
        type: input.type,
        quantity: input.quantity,
        productId: input.productId,
        userId: input.userId,
      },
    });
    return { movement, product };
  });
}

export async function getInventorySummaryStats() {
  const products = await prisma.product.findMany({
    select: {
      price: true,
      quantity: true,
      lowStockThreshold: true,
    },
  });

  let totalInventoryValue = 0;
  let itemsNeedingReorder = 0;

  for (const p of products) {
    totalInventoryValue += Number(p.price) * p.quantity;
    if (p.quantity <= p.lowStockThreshold) {
      itemsNeedingReorder += 1;
    }
  }

  return {
    totalSkus: products.length,
    totalInventoryValue,
    itemsNeedingReorder,
  };
}
