"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type DashboardMainProps = Readonly<{
  children: ReactNode;
}>;

function isStockPilotPath(pathname: string | null) {
  return pathname === "/stockpilot" || pathname?.startsWith("/stockpilot/");
}

export function DashboardMain({ children }: DashboardMainProps) {
  const pathname = usePathname();
  const immersive = isStockPilotPath(pathname);

  if (immersive) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 overflow-y-auto">
      <div className="ui-stack-lg ui-page-container mx-auto w-full max-w-[1440px] min-h-full">
        {children}
      </div>
    </main>
  );
}
