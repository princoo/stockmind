import { SupplierServiceError } from "@/server/suppliers/errors";
import type { SupplierListQuery, SupplierPayload } from "@/types/suppliers";

const sortBySet = new Set(["name", "createdAt"]);
const sortDirSet = new Set(["asc", "desc"]);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

export function parseSupplierListQuery(
  input: Record<string, string>,
): SupplierListQuery {
  const page = Math.max(Number(input.page || "1"), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize || "5"), 1), 50);
  const sortBy = sortBySet.has(input.sortBy) ? input.sortBy : "createdAt";
  const sortDir = sortDirSet.has(input.sortDir) ? input.sortDir : "desc";
  return {
    search: input.search?.trim() || undefined,
    page,
    pageSize,
    sortBy: sortBy as SupplierListQuery["sortBy"],
    sortDir: sortDir as SupplierListQuery["sortDir"],
  };
}

export function validateSupplierPayload(
  payload: Partial<SupplierPayload>,
): Required<SupplierPayload> {
  const name = payload.name?.trim();
  const contactPerson = payload.contactPerson?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const phone = payload.phone?.trim() ?? "";
  const isActive = payload.isActive ?? true;

  if (!name) throw new SupplierServiceError("Supplier name is required.");
  if (email && !emailRegex.test(email)) {
    throw new SupplierServiceError("Please provide a valid email address.");
  }
  if (phone && !phoneRegex.test(phone)) {
    throw new SupplierServiceError("Please provide a valid phone number.");
  }
  if (typeof isActive !== "boolean") {
    throw new SupplierServiceError("Status must be active or inactive.");
  }

  return { name, contactPerson, email, phone, isActive };
}
