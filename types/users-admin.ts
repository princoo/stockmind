import type { Role } from "@/generated/prisma/enums";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};
