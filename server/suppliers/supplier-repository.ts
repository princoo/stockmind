import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SupplierListQuery } from "@/types/suppliers";

function buildWhere(query: SupplierListQuery): Prisma.SupplierWhereInput {
  if (!query.search) return {};
  return {
    OR: [
      { name: { contains: query.search, mode: "insensitive" } },
      { contactPerson: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { contactInfo: { contains: query.search, mode: "insensitive" } },
    ],
  };
}

type SupplierWriteInput = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
};

export async function listSuppliers(query: SupplierListQuery) {
  const where = buildWhere(query);
  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);
  return { rows, total };
}

export function findSupplierById(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

export function createSupplier(data: SupplierWriteInput) {
  return prisma.supplier.create({
    data: {
      ...data,
      contactInfo: buildContactInfo(data),
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
    },
  });
}

export function updateSupplier(id: string, data: SupplierWriteInput) {
  return prisma.supplier.update({
    where: { id },
    data: {
      ...data,
      contactInfo: buildContactInfo(data),
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
    },
  });
}

export function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } });
}

export function deleteSupplierWithAudit(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "SUPPLIER",
        entityId: supplier.id,
        userId,
      },
    });
    return supplier;
  });
}

export function countSupplierProducts(id: string) {
  return prisma.product.count({ where: { supplierId: id } });
}

function buildContactInfo(data: Omit<SupplierWriteInput, "name" | "isActive">) {
  return [data.contactPerson, data.email, data.phone].filter(Boolean).join(" | ");
}
