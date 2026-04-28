import { prisma } from "@/lib/prisma";

export function findProductSupplierEmailContext(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      lowStockThreshold: true,
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
