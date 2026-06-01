import { NextResponse } from "next/server";
import { PublicChatError, guestSafeMessage } from "@/domain/public-chat/errors";

export function publicChatJsonError(error: unknown) {
  if (error instanceof PublicChatError) {
    const status =
      error.code === "CONVERSATION_NOT_FOUND"
        ? 404
        : error.code === "RATE_LIMITED"
          ? 429
          : error.code === "INTERNAL_ERROR"
            ? 500
            : 400;
    return NextResponse.json(
      { ok: false, error: guestSafeMessage(error.code), code: error.code },
      { status }
    );
  }

  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.warn(`[public-chat] INTERNAL_ERROR: ${detail}`);

  return NextResponse.json(
    {
      ok: false,
      error: "Nu am putut trimite mesajul. Te rugam sa incerci din nou.",
      code: "INTERNAL_ERROR"
    },
    { status: 500 }
  );
}
