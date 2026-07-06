export type BookingErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NOT_AVAILABLE"
  | "INVALID_STATUS_TRANSITION";

export class BookingDomainError extends Error {
  constructor(
    public code: BookingErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}
