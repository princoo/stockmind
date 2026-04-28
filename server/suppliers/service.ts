import { SupplierServiceError } from "@/server/suppliers/errors";
import {
  countSupplierProducts,
  createSupplier,
  deleteSupplier,
  deleteSupplierWithAudit,
  findSupplierById,
  listSuppliers,
  updateSupplier,
} from "@/server/suppliers/supplier-repository";
import {
  parseSupplierListQuery,
  validateSupplierPayload,
} from "@/server/suppliers/validation";
import type { SupplierListResult, SupplierStatus } from "@/types/suppliers";
import { notifyAdminsBestEffort } from "@/server/notifications/service";

export async function getSuppliers(
  rawQuery: Record<string, string>,
): Promise<SupplierListResult> {
  const query = parseSupplierListQuery(rawQuery);
  const { rows, total } = await listSuppliers(query);
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contactPerson ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      status: getStatus(row.isActive),
      productCount: row._count.products,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function createSupplierEntry(payload: Record<string, unknown>) {
  const parsed = validateSupplierPayload(payload);
  return createSupplier(parsed);
}

export async function updateSupplierEntry(
  id: string,
  payload: Record<string, unknown>,
) {
  const current = await findSupplierById(id);
  if (!current) throw new SupplierServiceError("Supplier not found.", 404);
  const parsed = validateSupplierPayload(payload);
  return updateSupplier(id, parsed);
}

export async function removeSupplierEntry(id: string, userId?: string) {
  const current = await findSupplierById(id);
  if (!current) throw new SupplierServiceError("Supplier not found.", 404);
  const linkedProducts = await countSupplierProducts(id);
  if (linkedProducts > 0) {
    throw new SupplierServiceError(
      "Cannot delete supplier linked to products.",
      409,
    );
  }
  if (userId) {
    await deleteSupplierWithAudit(id, userId);
    await notifyAdminsBestEffort({
      type: "ALERT",
      message: `Supplier deleted: ${current.name}.`,
      entityType: "SUPPLIER",
      entityId: current.id,
      href: "/suppliers",
    });
    return;
  }
  await deleteSupplier(id);
}

function getStatus(isActive: boolean): SupplierStatus {
  return isActive ? "ACTIVE" : "INACTIVE";
}
