export class ReportsServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toReportsErrorMessage(error: unknown): string {
  if (error instanceof ReportsServiceError) return error.message;
  return "Unexpected reports error.";
}
