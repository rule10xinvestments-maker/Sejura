import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManualBookingForm } from "@/components/bookings/manual-booking-form";
import type { BookingRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

function room(patch: Partial<Room> = {}): Room {
  return {
    id: "room-1",
    owner_id: "owner-1",
    property_id: "property-1",
    name: "Camera Verde",
    max_guests: 2,
    base_price_per_night: 220,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

function booking(patch: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "booking-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    guest_name: "Ana Pop",
    guest_phone: null,
    guest_email: null,
    guest_notes: null,
    start_date: "2026-08-12",
    end_date: "2026-08-14",
    guests_count: 2,
    price_per_night: 220,
    nights_count: 2,
    total_estimated_price: 440,
    currency: "RON",
    status: "confirmed",
    source: "manual_owner",
    conversation_id: null,
    calendar_sync_status: "not_required",
    google_calendar_event_id: null,
    calendar_sync_error_code: null,
    calendar_sync_error_message: null,
    calendar_synced_at: null,
    confirmed_at: "2026-01-01T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function renderForm({
  action = vi.fn(),
  bookings = [],
  rooms = [room()]
}: {
  action?: (formData: FormData) => void;
  bookings?: BookingRecord[];
  rooms?: Room[];
} = {}) {
  render(
    <ManualBookingForm
      action={action}
      bookings={bookings}
      propertyId="property-1"
      rooms={rooms}
    />
  );
  return { action };
}

describe("ManualBookingForm", () => {
  it("auto-fills nightly price when selecting a room", () => {
    renderForm({
      rooms: [
        room({ id: "room-1", name: "Camera Verde", base_price_per_night: 220 }),
        room({ id: "room-2", name: "Camera Albastra", base_price_per_night: 310 })
      ]
    });

    expect(screen.getByLabelText("Pret/noapte (RON)")).toHaveValue(220);

    fireEvent.change(screen.getByLabelText("Camera/unitate"), {
      target: { value: "room-2" }
    });

    expect(screen.getByLabelText("Pret/noapte (RON)")).toHaveValue(310);
  });

  it("preserves manual price override when selected room changes", () => {
    renderForm({
      rooms: [
        room({ id: "room-1", name: "Camera Verde", base_price_per_night: 220 }),
        room({ id: "room-2", name: "Camera Albastra", base_price_per_night: 310 })
      ]
    });

    fireEvent.change(screen.getByLabelText("Pret/noapte (RON)"), {
      target: { value: "275" }
    });
    fireEvent.change(screen.getByLabelText("Camera/unitate"), {
      target: { value: "room-2" }
    });

    expect(screen.getByLabelText("Pret/noapte (RON)")).toHaveValue(275);
  });

  it("shows overlapping confirmed rooms as unavailable in the preview", async () => {
    renderForm({
      bookings: [booking()],
      rooms: [
        room({ id: "room-1", name: "Camera Verde" }),
        room({ id: "room-2", name: "Camera Albastra", base_price_per_night: 260 })
      ]
    });

    fireEvent.change(screen.getByLabelText("Sosire"), {
      target: { value: "2026-08-13" }
    });
    fireEvent.change(screen.getByLabelText("Plecare"), {
      target: { value: "2026-08-15" }
    });
    fireEvent.change(screen.getByLabelText("Oaspeti"), {
      target: { value: "2" }
    });

    await waitFor(() => {
      expect(screen.getByText(/Camera Verde - Exista deja/)).toBeVisible();
    });
    expect(screen.getByText(/Camera Albastra - pana la 2 oaspeti/)).toBeVisible();
  });

  it("keeps rooms with overlapping pending bookings available and shows a warning", async () => {
    renderForm({
      bookings: [
        booking({
          status: "pending",
          confirmed_at: null
        })
      ],
      rooms: [room({ id: "room-1", name: "Camera Verde" })]
    });

    fireEvent.change(screen.getByLabelText("Sosire"), {
      target: { value: "2026-08-13" }
    });
    fireEvent.change(screen.getByLabelText("Plecare"), {
      target: { value: "2026-08-15" }
    });
    fireEvent.change(screen.getByLabelText("Oaspeti"), {
      target: { value: "2" }
    });

    await waitFor(() => {
      expect(screen.getByText(/Camera Verde - pana la 2 oaspeti/)).toBeVisible();
    });
    expect(screen.getByText("Cereri în așteptare în acest interval")).toBeVisible();
    expect(screen.getByRole("button", { name: "Salveaza rezervarea" })).toBeEnabled();
  });

  it("does not submit when no room is available for the selected stay", async () => {
    const action = vi.fn();
    renderForm({
      action,
      bookings: [booking()],
      rooms: [room()]
    });

    fireEvent.change(screen.getByLabelText("Sosire"), {
      target: { value: "2026-08-13" }
    });
    fireEvent.change(screen.getByLabelText("Plecare"), {
      target: { value: "2026-08-15" }
    });
    fireEvent.change(screen.getByLabelText("Oaspeti"), {
      target: { value: "2" }
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Salveaza rezervarea" })).toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Salveaza rezervarea" }));
    expect(action).not.toHaveBeenCalled();
  });
});
