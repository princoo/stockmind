import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { requireApiPermission } from "@/lib/auth/server-access";
import { createUser, findUserByEmail, listUsersForAdmin } from "@/lib/auth/users";

function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "STAFF";
}

export async function GET() {
  const auth = await requireApiPermission("MANAGE_USERS");
  if (!auth.ok) return auth.response;

  try {
    const users = await listUsersForAdmin();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { message: "Unable to load users." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("MANAGE_USERS");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const password =
      typeof payload.password === "string" ? payload.password : "";
    const role = payload.role;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (!isRole(role)) {
      return NextResponse.json(
        { message: "Role must be ADMIN or STAFF." },
        { status: 400 },
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to create user." },
      { status: 500 },
    );
  }
}
