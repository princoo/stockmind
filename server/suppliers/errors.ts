export class SupplierServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toSupplierErrorMessage(error: unknown) {
  if (error instanceof SupplierServiceError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected suppliers error.";
}
