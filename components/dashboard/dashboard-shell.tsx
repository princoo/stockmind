import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar userName={userName} userEmail={userEmail} role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar role={role} />
        <main className="flex-1 p-5 md:p-6 lg:p-7">
          <div className="ui-stack-lg mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
