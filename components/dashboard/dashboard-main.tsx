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
    <main className="flex-1 p-5 md:p-6 lg:p-7">
      <div className="ui-stack-lg mx-auto w-full max-w-[1440px]">{children}</div>
    </main>
  );
}
