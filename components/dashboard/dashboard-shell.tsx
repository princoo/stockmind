import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
import { DashboardMain } from "@/components/dashboard/dashboard-main";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

type DashboardShellProps = Readonly<{
  children: ReactNode;
  userName: string;
  userEmail: string;
  role: Role;
}>;

export function DashboardShell({
  children,
  userName,
  userEmail,
  role,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar userName={userName} userEmail={userEmail} role={role} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Topbar role={role} />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </div>
  );
}
