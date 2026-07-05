import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingDomainError } from "@/domain/bookings/errors";
import { GoogleCalendarError } from "@/domain/google-calendar/errors";

function publicBookingError(error: BookingDomainError) {
  const message = error.message.toLowerCase();

  if (
    message.includes("camera nu mai este disponibil") ||
    message.includes("rezervare confirmata") ||
    message.includes("rezervare confirmată")
  ) {
    return {
      code: "ROOM_NOT_AVAILABLE",
      error: "Camera nu mai este disponibilă pentru perioada aleasă."
    };
  }

  if (message.includes("google calendar este obligatoriu")) {
    return {
      code: "GOOGLE_CALENDAR_REQUIRED",
      error: "Google Calendar trebuie conectat înainte de confirmare."
    };
  }

  return {
    code: error.code,
    error: error.message
  };
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Datele trimise nu sunt valide.",
        fields: error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  if (error instanceof BookingDomainError) {
    const status =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_AVAILABLE" ||
              error.code === "INVALID_STATUS_TRANSITION"
            ? 409
            : 400;

    return NextResponse.json(publicBookingError(error), { status });
  }

  if (error instanceof GoogleCalendarError) {
    const status =
      error.code === "GOOGLE_CALENDAR_NOT_FOUND"
        ? 404
        : error.code === "GOOGLE_RECONNECT_REQUIRED" ||
            error.code === "GOOGLE_CALENDAR_DISCONNECTED"
          ? 409
          : 400;

    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }

  return NextResponse.json(
    { error: "Nu am putut procesa cererea." },
    { status: 500 }
  );
}
