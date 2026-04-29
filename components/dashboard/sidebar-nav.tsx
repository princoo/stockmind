"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/components/dashboard/nav-items";

function isActive(pathname: string | null, href: string) {
  return pathname === href;
}

type SidebarNavProps = Readonly<{
  items: DashboardNavItem[];
}>;

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-5 space-y-1.5 px-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-blue-50/90 font-semibold text-blue-700 shadow-sm"
                : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900",
            ].join(" ")}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
