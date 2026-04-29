"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getNavItemsForRole } from "@/components/dashboard/nav-items";

type SidebarProps = Readonly<{
  userName: string;
  userEmail: string;
  role: Role;
}>;

export function Sidebar({ userName, userEmail, role }: SidebarProps) {
  const items = getNavItemsForRole(role);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    <aside className="ui-glass m-3 flex h-[calc(100vh-1.5rem)] w-72 shrink-0 flex-col overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
      <div className="border-b border-zinc-200/70 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            S
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">StockMind</p>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Enterprise Inventory
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={items} />
      </div>

      <div className="border-t border-zinc-200/70 bg-white/50 px-5 py-4">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-zinc-100/70"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0058be] text-xs font-semibold uppercase text-white">
              {userName.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-zinc-800">{userName}</span>
              <span className="block truncate text-xs text-zinc-500">{userEmail}</span>
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute bottom-14 left-0 z-50 w-64 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_35px_rgba(15,23,42,0.14)]"
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
