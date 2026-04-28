export class DashboardServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toDashboardErrorMessage(error: unknown): string {
  if (error instanceof DashboardServiceError) return error.message;
  return "Unexpected dashboard error.";
}
