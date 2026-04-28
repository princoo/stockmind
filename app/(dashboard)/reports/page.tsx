import { AccessDenied } from "@/components/auth/access-denied";
import { ReportsPageClient } from "@/components/reports/reports-page-client";
import { hasPagePermission } from "@/lib/auth/server-access";

export default async function ReportsPage() {
  if (!(await hasPagePermission("VIEW_REPORTS"))) {
    return (
      <AccessDenied description="Reports are available to admins only." />
    );
  }
  return <ReportsPageClient />;
}
