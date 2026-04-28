import { ProductsPageClient } from "@/components/products/products-page-client";
import { requireDashboardSession } from "@/lib/auth/server-access";
import { hasPermission } from "@/lib/auth/permissions";

export default async function ProductsPage() {
  const session = await requireDashboardSession();
  const role = session.user.role ?? "STAFF";
  return (
    <ProductsPageClient
      canManageProducts={hasPermission(role, "MANAGE_PRODUCTS")}
      canDeleteProducts={hasPermission(role, "DELETE_PRODUCTS")}
      canSendNotifications={hasPermission(role, "SEND_NOTIFICATIONS")}
    />
  );
}
