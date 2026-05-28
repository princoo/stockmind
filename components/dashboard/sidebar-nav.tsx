"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/components/dashboard/nav-items";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

type SidebarNavProps = Readonly<{
  items: DashboardNavItem[];
  collapsed?: boolean;
}>;

export function SidebarNav({ items, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 space-y-1 px-2">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={[
              "group flex items-center rounded-xl text-sm transition-all duration-200",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "bg-blue-50/95 font-semibold text-[#0058be] shadow-sm ring-1 ring-blue-100/80"
                : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-[#0058be]" : "text-zinc-500 group-hover:text-zinc-700",
              ].join(" ")}
              aria-hidden
            />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
