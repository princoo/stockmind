"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getNavItemsForRole } from "@/components/dashboard/nav-items";

const SIDEBAR_COLLAPSED_KEY = "stockmind-sidebar-collapsed";

type SidebarProps = Readonly<{
  userName: string;
  userEmail: string;
  role: Role;
}>;

export function Sidebar({ userName, userEmail, role }: SidebarProps) {
  const items = getNavItemsForRole(role);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  return (
    <aside
      className={[
        "ui-glass relative m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-[width] duration-300 ease-out",
        collapsed ? "w-[4.5rem]" : "w-72",
      ].join(" ")}
    >
      <div className="border-b border-zinc-200/70 px-4 py-5">
        <div className={collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0058be] text-sm font-bold text-white shadow-sm">
            S
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-zinc-900">StockMind</p>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                Enterprise Inventory
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav items={items} collapsed={collapsed} />
      </div>

      <div className="border-t border-zinc-200/70 bg-white/50 px-3 py-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "mb-2 flex w-full items-center rounded-xl border border-zinc-200/80 bg-white/70 text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900",
            collapsed ? "justify-center p-2" : "gap-2 px-3 py-2 text-xs font-medium",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={collapsed ? userName : undefined}
            className={[
              "flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-zinc-100/70",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0058be] text-xs font-semibold uppercase text-white">
              {userName.slice(0, 2)}
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-800">
                  {userName}
                </span>
                <span className="block truncate text-xs text-zinc-500">{userEmail}</span>
              </span>
            ) : null}
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className={[
                "absolute z-50 w-64 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_35px_rgba(15,23,42,0.14)]",
                collapsed ? "bottom-14 left-12" : "bottom-14 left-0",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-zinc-900">{userName}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{userEmail}</p>
              <p className="mt-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Role: {role}
              </p>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="ui-btn-secondary px-3 py-2"
                >
                  Public site
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="ui-btn-primary px-3 py-2">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
