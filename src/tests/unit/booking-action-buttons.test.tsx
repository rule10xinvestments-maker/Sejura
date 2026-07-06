import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingActionButtons } from "@/components/bookings/booking-action-buttons";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn()
  })
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BookingActionButtons", () => {
  it("shows same-owner conflict details when confirmation fails", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        code: "ROOM_NOT_AVAILABLE",
        error: "Camera nu mai este disponibilă pentru perioada aleasă.",
        conflict: {
          bookingId: "booking-confirmed",
          guestName: "Ana Pop",
          guestPhone: "0700000000",
          startDate: "2026-09-10",
          endDate: "2026-09-12"
        }
      })
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingActionButtons
        bookingId="booking-pending"
        checkOutTime="11:00"
        status="pending"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirma rezervarea" }));

    await waitFor(() => {
      expect(
        screen.getByText("Camera nu mai este disponibilă pentru perioada aleasă.")
      ).toBeVisible();
    });
    expect(screen.getByText("Camera este deja ocupată de Ana Pop.")).toBeVisible();
    expect(screen.getByText("Perioadă: 2026-09-10 – 2026-09-12")).toBeVisible();
    expect(screen.getByText("Se eliberează: 2026-09-12 la 11:00")).toBeVisible();
    expect(screen.getByText("Telefon: 0700000000")).toBeVisible();
    expect(screen.getByRole("link", { name: "Vezi rezervarea existentă" }))
      .toHaveAttribute("href", "/app/bookings/booking-confirmed");
  });
});
