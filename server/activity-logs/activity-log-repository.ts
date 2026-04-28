import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type ListArgs = {
  where: Prisma.AuditLogWhereInput;
  orderBy: Prisma.AuditLogOrderByWithRelationInput;
  skip: number;
  take: number;
};

export async function listActivityLogs(args: ListArgs) {
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where: args.where }),
  ]);
  return { rows, total };
}
