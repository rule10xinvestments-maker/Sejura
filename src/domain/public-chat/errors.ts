export type PublicChatErrorCode =
  | "PUBLIC_PAGE_DISABLED"
  | "SETUP_INCOMPLETE"
  | "CONVERSATION_NOT_FOUND"
  | "CONVERSATION_ACCESS_DENIED"
  | "AI_DISABLED"
  | "AI_RUNTIME_ERROR"
  | "AI_TOOL_BLOCKED"
  | "AI_TOOL_VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "ROOM_NOT_AVAILABLE"
  | "BOOKING_CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class PublicChatError extends Error {
  constructor(
    public code: PublicChatErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PublicChatError";
  }
}

export function guestSafeMessage(code: PublicChatErrorCode) {
  if (code === "PUBLIC_PAGE_DISABLED") {
    return "Aceasta pagina de rezervari nu este disponibila momentan.";
  }
  if (code === "SETUP_INCOMPLETE") {
    return "Rezervarile online nu sunt disponibile momentan pentru aceasta pensiune.";
  }
  if (code === "AI_DISABLED" || code === "AI_RUNTIME_ERROR") {
    return "Asistentul de rezervari nu este disponibil momentan. Te rugam sa contactezi direct pensiunea.";
  }
  if (code === "ROOM_NOT_AVAILABLE" || code === "BOOKING_CONFLICT") {
    return "Camera nu mai este disponibila pentru perioada aleasa. Pot verifica alte optiuni.";
  }
  if (code === "AI_TOOL_VALIDATION_ERROR" || code === "VALIDATION_ERROR") {
    return "Cererea nu a putut fi creata deoarece lipsesc cateva detalii.";
  }
  return "Nu am putut trimite mesajul. Te rugam sa incerci din nou.";
}
