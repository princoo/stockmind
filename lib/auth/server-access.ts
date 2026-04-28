import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import {
  getRoleFromSession,
  hasPermission,
  type AppPermission,
} from "@/lib/auth/permissions";

export async function requireApiPermission(permission: AppPermission) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }
  const role = getRoleFromSession(session);
  if (!role || !hasPermission(role, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Access denied: insufficient permissions." },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, role };
}

export async function requireDashboardSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function hasPagePermission(permission: AppPermission) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = getRoleFromSession(session);
  return Boolean(role && hasPermission(role, permission));
}
