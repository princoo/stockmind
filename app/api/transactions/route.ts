import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  TransactionServiceError,
  toTransactionErrorMessage,
} from "@/server/transactions/errors";
import { getTransactions } from "@/server/transactions/service";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_TRANSACTIONS");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const result = await getTransactions(query);
    return NextResponse.json(result);
  } catch (error) {
    const status =
      error instanceof TransactionServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toTransactionErrorMessage(error) },
      { status },
    );
  }
}
