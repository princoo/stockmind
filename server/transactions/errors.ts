export class TransactionServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toTransactionErrorMessage(error: unknown): string {
  if (error instanceof TransactionServiceError) {
    return error.message;
  }
  return "Unexpected transactions error.";
}
