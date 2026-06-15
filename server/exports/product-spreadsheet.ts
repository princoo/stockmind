import * as XLSX from "xlsx";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductExportScope = "all" | "low_stock" | "available";

export type ProductExportFilters = {
  search?: string;
  categoryId?: string;
  scope?: ProductExportScope;
};

const MAX_EXPORT_ROWS = 10_000;

function resolveStockStatus(quantity: number, lowStockThreshold: number): string {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

function buildWhere(filters: ProductExportFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
    ];
  }

  if (filters.scope === "available") {
    where.quantity = { gt: 0 };
  }

  return where;
}

export async function buildProductsSpreadsheet(
  filters: ProductExportFilters = {},
): Promise<{ buffer: Buffer; rowCount: number; filename: string }> {
  const scope = filters.scope ?? "all";
  const products = await prisma.product.findMany({
    where: buildWhere(filters),
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
    take: MAX_EXPORT_ROWS,
  });

  const rows = products
    .map((product) => {
      const unitPrice = Number(product.price);
      const stockValue = unitPrice * product.quantity;
      const status = resolveStockStatus(
        product.quantity,
        product.lowStockThreshold,
      );

      return {
        Name: product.name,
        SKU: product.sku,
        Category: product.category.name,
        Supplier: product.supplier.name,
        Quantity: product.quantity,
        "Low Stock Threshold": product.lowStockThreshold,
        "Unit Price (RWF)": Math.round(unitPrice),
        "Stock Value (RWF)": Math.round(stockValue),
        Status: status,
      };
    })
    .filter((row) => {
      if (scope !== "low_stock") return true;
      return row.Status === "LOW_STOCK" || row.Status === "OUT_OF_STOCK";
    });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  const scopeSlug =
    scope === "low_stock"
      ? "low-stock"
      : scope === "available"
        ? "available"
        : "all";
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `stockmind-products-${scopeSlug}-${dateSlug}.xlsx`;

  return { buffer, rowCount: rows.length, filename };
}
