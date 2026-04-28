export class EmailServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toEmailErrorMessage(error: unknown): string {
  if (error instanceof EmailServiceError) return error.message;
  return "Unexpected email service error.";
}
