import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { getReportsData } from "@/server/reports/service";
import {
  ReportsServiceError,
  toReportsErrorMessage,
} from "@/server/reports/errors";

type ExportSection =
  | "stock-summary"
  | "low-stock"
  | "transaction-summary"
  | "available-products";

function escapeCell(value: string | number) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\n");
}

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_REPORTS");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const section = (url.searchParams.get("section") ??
      "stock-summary") as ExportSection;
    const query = Object.fromEntries(url.searchParams.entries());
    delete query.section;
    const data = await getReportsData(query);

    let csv = "";
    let filename: string;

    if (section === "low-stock") {
      filename = "low-stock-report.csv";
      csv = toCsv(
        ["Product", "SKU", "Category", "Quantity", "Low Stock Threshold"],
        data.lowStock.map((r) => [
          r.name,
          r.sku,
          r.categoryName,
          r.quantity,
          r.lowStockThreshold,
        ]),
      );
    } else if (section === "transaction-summary") {
      filename = "transaction-summary.csv";
      csv = toCsv(
        [
          "Total Transactions",
          "Stock In Count",
          "Stock In Quantity",
          "Stock Out Count",
          "Stock Out Quantity",
          "Net Quantity",
        ],
        [
          [
            data.transactionSummary.totalTransactions,
            data.transactionSummary.stockInCount,
            data.transactionSummary.stockInQuantity,
            data.transactionSummary.stockOutCount,
            data.transactionSummary.stockOutQuantity,
            data.transactionSummary.netQuantity,
          ],
        ],
      );
    } else if (section === "available-products") {
      filename = "available-products.csv";
      csv = toCsv(
        ["Product", "SKU", "Category", "Quantity", "Unit Price (RWF)", "Stock Value (RWF)"],
        data.availableProducts.map((r) => [
          r.name,
          r.sku,
          r.categoryName,
          r.quantity,
          Math.round(r.unitPrice),
          Math.round(r.stockValue),
        ]),
      );
    } else {
      filename = "stock-summary.csv";
      csv = toCsv(
        [
          "Category",
          "Product Count",
          "Total Quantity",
          "Total Stock Value (RWF)",
          "Low Stock Count",
        ],
        data.stockSummary.map((r) => [
          r.categoryName,
          r.productCount,
          r.totalQuantity,
          Math.round(r.totalValue),
          r.lowStockCount,
        ]),
      );
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const status = error instanceof ReportsServiceError ? error.status : 500;
    return NextResponse.json({ message: toReportsErrorMessage(error) }, { status });
  }
}
