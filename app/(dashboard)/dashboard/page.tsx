import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { AccessDenied } from "@/components/auth/access-denied";
import { hasPagePermission } from "@/lib/auth/server-access";

export default async function DashboardPage() {
  if (!(await hasPagePermission("VIEW_DASHBOARD"))) {
    return (
      <AccessDenied description="You do not have permission to access the dashboard." />
    );
  }
  return <DashboardPageClient />;
}
