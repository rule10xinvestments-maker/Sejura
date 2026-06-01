export type GoogleCalendarErrorCode =
  | "GOOGLE_OAUTH_STATE_INVALID"
  | "GOOGLE_AUTH_DENIED"
  | "GOOGLE_TOKEN_EXCHANGE_FAILED"
  | "GOOGLE_REFRESH_TOKEN_MISSING"
  | "GOOGLE_TOKEN_REFRESH_FAILED"
  | "GOOGLE_INSUFFICIENT_SCOPES"
  | "GOOGLE_CALENDAR_NOT_FOUND"
  | "GOOGLE_EVENT_CREATE_FAILED"
  | "GOOGLE_EVENT_UPDATE_FAILED"
  | "GOOGLE_RATE_LIMITED"
  | "GOOGLE_NETWORK_ERROR"
  | "GOOGLE_RECONNECT_REQUIRED"
  | "GOOGLE_CALENDAR_DISCONNECTED";

export class GoogleCalendarError extends Error {
  constructor(
    public code: GoogleCalendarErrorCode,
    message: string
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

export function ownerSafeGoogleCalendarMessage(code?: string | null) {
  if (code === "GOOGLE_RECONNECT_REQUIRED" || code === "GOOGLE_REFRESH_TOKEN_MISSING") {
    return "Google Calendar trebuie reconectat pentru ca rezervarile confirmate sa fie sincronizate.";
  }

  if (code === "GOOGLE_CALENDAR_DISCONNECTED") {
    return "Google Calendar este deconectat.";
  }

  return "Google Calendar nu a putut fi sincronizat. Incearca din nou sau verifica permisiunile acordate.";
}
