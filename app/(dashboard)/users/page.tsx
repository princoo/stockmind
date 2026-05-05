import { AccessDenied } from "@/components/auth/access-denied";
import { UsersPageClient } from "@/components/users/users-page-client";
import { listUsersForAdmin } from "@/lib/auth/users";
import { hasPagePermission } from "@/lib/auth/server-access";
import type { AdminUserRow } from "@/types/users-admin";

export default async function UsersPage() {
  if (!(await hasPagePermission("MANAGE_USERS"))) {
    return (
      <AccessDenied description="Only administrators can manage users." />
    );
  }

  const rows = await listUsersForAdmin();
  const initialUsers: AdminUserRow[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersPageClient initialUsers={initialUsers} />;
}
