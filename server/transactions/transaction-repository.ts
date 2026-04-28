import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type ListArgs = {
  where: Prisma.TransactionWhereInput;
  orderBy: Prisma.TransactionOrderByWithRelationInput;
  skip: number;
  take: number;
};

export async function listTransactions(args: ListArgs) {
  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.transaction.count({ where: args.where }),
  ]);
  return { rows, total };
}
