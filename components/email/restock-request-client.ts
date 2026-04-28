export async function sendRestockRequestEmail(input: {
  productId: string;
  requestedQuantity: number;
  message: string;
}) {
  const response = await fetch("/api/emails/restock-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; supplierEmail?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Failed to send supplier email.");
  }

  return payload;
}
