export class CategoryServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toCategoryErrorMessage(error: unknown) {
  if (error instanceof CategoryServiceError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Unexpected categories error.";
}
