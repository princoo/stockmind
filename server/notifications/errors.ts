export class NotificationServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toNotificationErrorMessage(error: unknown): string {
  if (error instanceof NotificationServiceError) return error.message;
  return "Unexpected notifications error.";
}
