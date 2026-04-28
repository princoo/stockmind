import { AccessDenied } from "@/components/auth/access-denied";
import { ActivityLogsPageClient } from "@/components/activity-logs/activity-logs-page-client";
import { hasPagePermission } from "@/lib/auth/server-access";

export default async function ActivityLogsPage() {
  if (!(await hasPagePermission("VIEW_ACTIVITY_LOGS"))) {
    return (
      <AccessDenied description="System activity logs are available to admins only." />
    );
  }
  return <ActivityLogsPageClient />;
}
