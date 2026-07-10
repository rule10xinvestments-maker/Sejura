import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InternalRoomCalendar } from "@/components/calendar/internal-room-calendar";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

function room(id: string, name: string, ownerId = "owner-1"): Room {
  return {
    id,
    owner_id: ownerId,
    property_id: ownerId === "owner-1" ? "property-1" : "property-2",
    name,
    max_guests: 2,
    base_price_per_night: 220,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}

function booking(patch: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "booking-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    guest_name: "Ana Pop",
    guest_phone: "0700000000",
    guest_email: null,
    guest_notes: null,
    start_date: "2026-06-12",
    end_date: "2026-06-15",
    guests_count: 2,
    price_per_night: 220,
    nights_count: 3,
    total_estimated_price: 660,
    currency: "RON",
    status: "confirmed",
    source: "manual_owner",
    conversation_id: null,
    calendar_sync_status: "not_required",
    google_calendar_event_id: null,
    calendar_sync_error_code: null,
    calendar_sync_error_message: null,
    calendar_synced_at: null,
    confirmed_at: "2026-06-01T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function block(patch: Partial<RoomBlockRecord> = {}): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-2",
    start_date: "2026-06-13",
    end_date: "2026-06-14",
    reason: "Renovare",
    created_by_owner_id: "owner-1",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function renderCalendar(bookings: BookingRecord[] = [booking()]) {
  return render(
    <InternalRoomCalendar
      rooms={[room("room-1", "Camera Verde"), room("room-2", "Camera Albastră")]}
      bookings={bookings}
      roomBlocks={[block()]}
      startDate="2026-06-12"
      daysCount={4}
      checkInTime="15:00"
      checkOutTime="11:00"
    />
  );
}

describe("InternalRoomCalendar", () => {
  it("shows rooms as owner-scoped rows with occupied days", () => {
    renderCalendar();

    expect(screen.getByRole("heading", { name: "Ocupare pe camere" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Camera" })).toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Camera Verde" })).toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Camera Albastră" })).toBeVisible();
    expect(screen.getAllByText("Ocupată").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ana Pop").length).toBeGreaterThan(0);
  });

  it("lets different rooms be occupied on the same dates", () => {
    renderCalendar([
      booking({ id: "booking-1", room_id: "room-1", guest_name: "Ana Pop" }),
      booking({ id: "booking-2", room_id: "room-2", guest_name: "Mihai Ionescu" })
    ]);

    expect(screen.getAllByText("Ana Pop").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mihai Ionescu").length).toBeGreaterThan(0);
  });

  it("shows pending requests separately and does not mark them occupied", () => {
    renderCalendar([
      booking({
        id: "pending-1",
        status: "pending",
        confirmed_at: null,
        guest_name: "Ioana Test"
      })
    ]);

    const pendingSection = screen
      .getByRole("heading", { name: "Cereri în așteptare" })
      .closest("section")!;
    expect(within(pendingSection).getByText("Ioana Test")).toBeVisible();
    expect(
      within(pendingSection).getByText("Nu blochează camera până la confirmare.")
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: /Vezi rezervarea Ioana Test/ })).not.toBeInTheDocument();
  });

  it("ignores cancelled and rejected bookings in active occupancy", () => {
    renderCalendar([
      booking({ id: "cancelled", status: "cancelled", cancelled_at: "2026-06-10T00:00:00.000Z" }),
      booking({ id: "rejected", status: "rejected", rejected_at: "2026-06-10T00:00:00.000Z" })
    ]);

    expect(screen.queryByText("Ana Pop")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Vezi rezervarea Ana Pop/ })).not.toBeInTheDocument();
  });

  it("shows room blocks as unavailable", () => {
    renderCalendar([]);

    expect(screen.getAllByText("Indisponibilă").length).toBeGreaterThan(0);
    expect(screen.getByText("Renovare")).toBeVisible();
  });

  it("links booking blocks to booking detail without raw ISO dates", () => {
    const { container } = renderCalendar();

    expect(screen.getAllByRole("link", { name: /Vezi rezervarea Ana Pop/ })[0]).toHaveAttribute(
      "href",
      "/app/bookings/booking-1"
    );
    expect(screen.getAllByText(/Se eliberează:/)[0]).toHaveTextContent(
      "15 iunie 2026"
    );
    expect(container.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
