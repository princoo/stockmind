"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CircleHelp, Settings } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import type { Role } from "@/generated/prisma/enums";
import { canAccessStockPilot } from "@/components/dashboard/nav-items";
import { StockPilotEntryButton } from "@/components/dashboard/stockpilot-entry-button";
import type { NotificationListResponse } from "@/types/notifications";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function Topbar({ role }: Readonly<{ role: Role }>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<NotificationListResponse>({
    unreadCount: 0,
    items: [],
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=8");
      const payload = (await res.json().catch(() => null)) as
        | NotificationListResponse
        | { message?: string }
        | null;
      if (!res.ok) return;
      setState(payload as NotificationListResponse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let socket: Socket | null = null;
    let mounted = true;

    (async () => {
      const bootstrapRes = await fetch("/api/socket");
      const bootstrapPayload = (await bootstrapRes.json().catch(() => null)) as
        | { url?: string }
        | null;
      if (!mounted) return;
      if (!bootstrapRes.ok || !bootstrapPayload?.url) {
        void loadNotifications();
        return;
      }
      socket = io(bootstrapPayload.url, {
        transports: ["websocket", "polling"],
      });
      socket.on("notifications:refresh", () => {
        void loadNotifications();
      });
      void loadNotifications();
    })();

    return () => {
      mounted = false;
      socket?.disconnect();
    };
  }, []);

  const hasUnread = state.unreadCount > 0;
  const unreadLabel = useMemo(
    () => (state.unreadCount > 99 ? "99+" : String(state.unreadCount)),
    [state.unreadCount],
  );

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setState((prev) => ({
      unreadCount: Math.max(
        prev.unreadCount - (prev.items.some((i) => i.id === id && !i.isRead) ? 1 : 0),
        0,
      ),
      items: prev.items.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
    }));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setState((prev) => ({
      unreadCount: 0,
      items: prev.items.map((i) => ({ ...i, isRead: true })),
    }));
  };

  const badgeClass = (type: string) => {
    if (type === "ALERT") return "bg-indigo-50 text-indigo-700";
    if (type === "WARNING") return "bg-sky-50 text-sky-700";
    return "bg-blue-50 text-blue-700";
  };

  const notificationsBody = (() => {
    if (loading && !state.items.length) {
      return (
        <div className="px-3 py-5 text-sm text-zinc-500">Loading notifications...</div>
      );
    }
    if (!state.items.length) {
      return <div className="px-3 py-5 text-sm text-zinc-500">No notifications yet.</div>;
    }
    return state.items.map((n) => (
      <Link
        key={n.id}
        href={n.href ?? "/dashboard"}
        onClick={() => {
          void markOneRead(n.id);
          setOpen(false);
        }}
        className={`block border-b border-zinc-100 px-3 py-2 transition-colors hover:bg-zinc-50 ${n.isRead ? "bg-white" : "bg-blue-50/40"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass(n.type)}`}>
            {n.type}
          </span>
          <span className="text-[11px] text-zinc-500">
            {dateFmt.format(new Date(n.createdAt))}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-700">{n.message}</p>
      </Link>
    ));
  })();

  return (
    <header className="ui-topbar-glass sticky top-0 z-30 mx-3 mt-3 flex h-16 items-center justify-between px-5">
      <div className="w-full max-w-md">
        <input
          type="search"
          placeholder="Search inventory, SKUs, or transactions..."
          className="ui-input-soft"
        />
      </div>

      <div className="relative ml-4 flex items-center gap-3 text-white">
        {canAccessStockPilot(role) ? <StockPilotEntryButton /> : null}
        <button
          type="button"
          className="ui-icon-btn relative"
          aria-label="Notifications"
          onClick={() => setOpen((v) => !v)}
        >
          <Bell className="mx-auto h-4 w-4" />
          {hasUnread ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-800 px-1 text-[10px] font-semibold text-white">
              {unreadLabel}
            </span>
          ) : null}
        </button>
        {open ? (
          <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
              <p className="ui-title-primary text-sm">Notifications</p>
              <button
                type="button"
                onClick={() => {
                  void markAllRead();
                }}
                className="text-xs font-medium text-[#0058be] hover:text-[#004ca3]"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">{notificationsBody}</div>
          </div>
        ) : null}
        <button
          type="button"
          className="ui-icon-btn"
          aria-label="Help"
        >
          <CircleHelp className="mx-auto h-4 w-4" />
        </button>
        {role === "ADMIN" ? (
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Settings"
          >
            <Settings className="mx-auto h-4 w-4" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
