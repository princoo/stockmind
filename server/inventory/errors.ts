export class InventoryServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toInventoryErrorMessage(error: unknown): string {
  if (error instanceof InventoryServiceError) {
    return error.message;
  }
  return "Unexpected inventory error.";
}
