import type { Session } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

export type AppPermission =
  | "VIEW_DASHBOARD"
  | "VIEW_PRODUCTS"
  | "MANAGE_PRODUCTS"
  | "DELETE_PRODUCTS"
  | "VIEW_CATEGORIES"
  | "UPDATE_CATEGORIES"
  | "MANAGE_CATEGORIES"
  | "VIEW_SUPPLIERS"
  | "MANAGE_SUPPLIERS"
  | "VIEW_INVENTORY"
  | "OPERATE_STOCK"
  | "VIEW_TRANSACTIONS"
  | "VIEW_REPORTS"
  | "VIEW_ACTIVITY_LOGS"
  | "SEND_NOTIFICATIONS";

const rolePermissions: Record<Role, Set<AppPermission>> = {
  ADMIN: new Set<AppPermission>([
    "VIEW_DASHBOARD",
    "VIEW_PRODUCTS",
    "MANAGE_PRODUCTS",
    "DELETE_PRODUCTS",
    "VIEW_CATEGORIES",
    "UPDATE_CATEGORIES",
    "MANAGE_CATEGORIES",
    "VIEW_SUPPLIERS",
    "MANAGE_SUPPLIERS",
    "VIEW_INVENTORY",
    "OPERATE_STOCK",
    "VIEW_TRANSACTIONS",
    "VIEW_REPORTS",
    "VIEW_ACTIVITY_LOGS",
    "SEND_NOTIFICATIONS",
  ]),
  STAFF: new Set<AppPermission>([
    "VIEW_DASHBOARD",
    "VIEW_PRODUCTS",
    "VIEW_CATEGORIES",
    "UPDATE_CATEGORIES",
    "VIEW_SUPPLIERS",
    "VIEW_INVENTORY",
    "OPERATE_STOCK",
    "VIEW_TRANSACTIONS",
  ]),
};

export function getRoleFromSession(session: Session | null): Role | null {
  if (!session?.user?.role) return null;
  return session.user.role;
}

export function hasPermission(role: Role, permission: AppPermission): boolean {
  return rolePermissions[role].has(permission);
}
