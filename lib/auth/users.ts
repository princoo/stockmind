import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/generated/prisma/enums";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export async function createUser(input: CreateUserInput) {
  const hashed = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashed,
      role: input.role,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });
}

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
