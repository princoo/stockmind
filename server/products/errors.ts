export class ProductServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof ProductServiceError) {
    return error.message;
  }
  return "Unexpected products error.";
}
