import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireDashboardSession } from "@/lib/auth/server-access";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await requireDashboardSession();
  return (
    <DashboardShell
      userName={session.user?.name ?? "Unknown user"}
      userEmail={session.user?.email ?? "no-email"}
      role={session.user.role ?? "STAFF"}
    >
      {children}
    </DashboardShell>
  );
}
