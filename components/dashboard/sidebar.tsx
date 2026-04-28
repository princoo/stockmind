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
        <p className="text-sm font-semibold text-zinc-800">{userName}</p>
        <p className="text-xs text-zinc-500">{userEmail}</p>
      </div>
    </aside>
  );
}
