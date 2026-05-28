import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import {
  hasPermission,
  type AppPermission,
} from "@/lib/auth/permissions";

export type DashboardNavItem = {
  label: string;
  href: string;
  permission: AppPermission;
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    permission: "VIEW_DASHBOARD",
    icon: LayoutDashboard,
  },
  { label: "Users", href: "/users", permission: "MANAGE_USERS", icon: Users },
  {
    label: "Products",
    href: "/products",
    permission: "VIEW_PRODUCTS",
    icon: Package,
  },
  {
    label: "Categories",
    href: "/categories",
    permission: "VIEW_CATEGORIES",
    icon: Tags,
  },
  {
    label: "Inventory",
    href: "/inventory",
    permission: "VIEW_INVENTORY",
    icon: Warehouse,
  },
  {
    label: "Transactions",
    href: "/transactions",
    permission: "VIEW_TRANSACTIONS",
    icon: ArrowLeftRight,
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    permission: "VIEW_SUPPLIERS",
    icon: Truck,
  },
  {
    label: "Reports",
    href: "/reports",
    permission: "VIEW_REPORTS",
    icon: BarChart3,
  },
  {
    label: "Activity Logs",
    href: "/activity-logs",
    permission: "VIEW_ACTIVITY_LOGS",
    icon: Activity,
  },
];

export function getNavItemsForRole(role: Role) {
  return dashboardNavItems.filter((item) => hasPermission(role, item.permission));
}

export const STOCKPILOT_PATH = "/stockpilot";

export function canAccessStockPilot(role: Role) {
  return hasPermission(role, "VIEW_INVENTORY");
}
