import { InventoryPageClient } from "@/components/inventory/inventory-page-client";
import { AccessDenied } from "@/components/auth/access-denied";
import { hasPermission } from "@/lib/auth/permissions";
import { requireDashboardSession } from "@/lib/auth/server-access";

export default async function InventoryPage() {
  const session = await requireDashboardSession();
  const role = session.user.role ?? "STAFF";

  if (!hasPermission(role, "VIEW_INVENTORY")) {
    return (
      <AccessDenied description="You do not have permission to access inventory." />
    );
  }
  return (
    <InventoryPageClient
      canSendNotifications={hasPermission(role, "SEND_NOTIFICATIONS")}
    />
  );
}
