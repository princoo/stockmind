import { AccessDenied } from "@/components/auth/access-denied";
import { SuppliersPageClient } from "@/components/suppliers/suppliers-page-client";
import { requireDashboardSession } from "@/lib/auth/server-access";
import { hasPermission } from "@/lib/auth/permissions";

export default async function SuppliersPage() {
  const session = await requireDashboardSession();
  const role = session.user.role ?? "STAFF";
  if (!hasPermission(role, "VIEW_SUPPLIERS")) {
    return (
      <AccessDenied description="You do not have permission to view suppliers." />
    );
  }
  return (
    <SuppliersPageClient
      canManageSuppliers={hasPermission(role, "MANAGE_SUPPLIERS")}
    />
  );
}
