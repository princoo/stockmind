export class ActivityLogServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toActivityLogErrorMessage(error: unknown): string {
  if (error instanceof ActivityLogServiceError) {
    return error.message;
  }
  return "Unexpected activity logs error.";
}
