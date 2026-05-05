"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/enums";
import type { AdminUserRow } from "@/types/users-admin";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type UsersPageClientProps = Readonly<{
  initialUsers: AdminUserRow[];
}>;

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const payload = (await res.json().catch(() => null)) as
        | AdminUserRow[]
        | { message?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Failed to load users.",
        );
      }
      setUsers(payload as AdminUserRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const payload = (await res.json().catch(() => null)) as
        | AdminUserRow
        | { message?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Failed to create user.",
        );
      }
      toast.success("User created.");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      await refreshUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="ui-page-title ui-title-primary">Users</h1>
          <p className="text-sm text-zinc-600">
            Create accounts and assign roles. Only administrators can manage users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ui-btn-primary h-10 shrink-0"
        >
          Create user
        </button>
      </div>

      <div className="ui-table-shell">
        <table className="min-w-full text-sm">
          <thead className="ui-table-head">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {dateFmt.format(new Date(u.createdAt))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="ui-modal-overlay">
          <div className="ui-modal max-w-md space-y-4 p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Create user</h2>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label htmlFor="user-name" className="mb-1 block text-xs font-semibold text-zinc-600">
                  Name
                </label>
                <input
                  id="user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="ui-input"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="user-email" className="mb-1 block text-xs font-semibold text-zinc-600">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ui-input"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="user-password" className="mb-1 block text-xs font-semibold text-zinc-600">
                  Temporary password
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ui-input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="user-role" className="mb-1 block text-xs font-semibold text-zinc-600">
                  Role
                </label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="ui-select"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ui-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-btn-primary px-4 py-2">
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
