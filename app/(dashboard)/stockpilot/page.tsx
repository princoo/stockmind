import type { Metadata } from "next";
import { StockPilotWorkspace } from "@/components/chat/stockpilot-workspace";
import { AccessDenied } from "@/components/auth/access-denied";
import { hasPermission } from "@/lib/auth/permissions";
import { requireDashboardSession } from "@/lib/auth/server-access";

export const metadata: Metadata = {
  title: "StockPilot | StockMind",
  description: "Your intelligent inventory operations assistant",
};

export default async function StockPilotPage() {
  const session = await requireDashboardSession();
  const role = session.user.role ?? "STAFF";

  if (!hasPermission(role, "VIEW_INVENTORY")) {
    return (
      <AccessDenied description="You do not have permission to open StockPilot." />
    );
  }

  return <StockPilotWorkspace />;
}
