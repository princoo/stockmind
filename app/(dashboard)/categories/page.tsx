import { AccessDenied } from "@/components/auth/access-denied";
import { CategoriesPageClient } from "@/components/categories/categories-page-client";
import { requireDashboardSession } from "@/lib/auth/server-access";
import { hasPermission } from "@/lib/auth/permissions";

export default async function CategoriesPage() {
  const session = await requireDashboardSession();
  const role = session.user.role ?? "STAFF";
  if (!hasPermission(role, "VIEW_CATEGORIES")) {
    return (
      <AccessDenied description="You do not have permission to view categories." />
    );
  }
  return (
    <CategoriesPageClient
      canCreateCategory={hasPermission(role, "MANAGE_CATEGORIES")}
      canUpdateCategory={hasPermission(role, "UPDATE_CATEGORIES")}
      canDeleteCategory={hasPermission(role, "MANAGE_CATEGORIES")}
    />
  );
}
