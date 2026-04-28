import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { EmailServiceError, toEmailErrorMessage } from "@/server/email/errors";
import { sendSupplierRestockRequest } from "@/server/email/service";

export async function POST(request: Request) {
  const auth = await requireApiPermission("SEND_NOTIFICATIONS");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as {
      productId?: string;
      requestedQuantity?: number;
      message?: string;
    };

    if (!payload.productId) {
      return NextResponse.json({ message: "Product is required." }, { status: 400 });
    }

    const result = await sendSupplierRestockRequest({
      productId: payload.productId,
      requestedQuantity: payload.requestedQuantity,
      message: payload.message,
      trigger: "MANUAL",
      requestedByName: auth.session.user.name ?? undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof EmailServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toEmailErrorMessage(error) },
      { status },
    );
  }
}
