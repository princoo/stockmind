import type { Role } from "@/generated/prisma/enums";
import {
  hasPermission,
  type AppPermission,
} from "@/lib/auth/permissions";

export type DashboardNavItem = {
  label: string;
  href: string;
  permission: AppPermission;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "VIEW_DASHBOARD" },
  { label: "Users", href: "/users", permission: "MANAGE_USERS" },
  { label: "Products", href: "/products", permission: "VIEW_PRODUCTS" },
  { label: "Categories", href: "/categories", permission: "VIEW_CATEGORIES" },
  { label: "Inventory", href: "/inventory", permission: "VIEW_INVENTORY" },
  { label: "Transactions", href: "/transactions", permission: "VIEW_TRANSACTIONS" },
  { label: "Suppliers", href: "/suppliers", permission: "VIEW_SUPPLIERS" },
  { label: "Reports", href: "/reports", permission: "VIEW_REPORTS" },
  { label: "Activity Logs", href: "/activity-logs", permission: "VIEW_ACTIVITY_LOGS" },
];

export function getNavItemsForRole(role: Role) {
  return dashboardNavItems.filter((item) => hasPermission(role, item.permission));
}
