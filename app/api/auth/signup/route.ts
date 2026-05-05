import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Public registration is disabled. Ask an administrator to create your account.",
    },
    { status: 403 },
  );
}
