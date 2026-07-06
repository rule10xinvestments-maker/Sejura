import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomOverview } from "@/components/dashboard/room-overview";
import type { RoomOccupancySummary } from "@/domain/bookings/room-occupancy-summary";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

function room(patch: Partial<Room> = {}): Room {
  return {
    id: "room-free",
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
    room_id: "room-occupied",
    guest_name: "Ana Pop",
    guest_phone: "0700000000",
    guest_email: null,
    guest_notes: null,
    start_date: "2026-07-04",
    end_date: "2026-07-07",
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
    confirmed_at: "2026-07-01T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function block(patch: Partial<RoomBlockRecord> = {}): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-blocked",
    start_date: "2026-07-05",
    end_date: "2026-07-06",
    reason: "Renovare",
    created_by_owner_id: "owner-1",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function renderOverview() {
  const freeRoom = room({ id: "room-free", name: "Camera Verde" });
  const occupiedRoom = room({ id: "room-occupied", name: "Camera Albastră" });
  const blockedRoom = room({ id: "room-blocked", name: "Camera Blocată" });
  const nextBooking = booking({
    id: "booking-next",
    room_id: "room-free",
    guest_name: "Mihai Ionescu",
    start_date: "2026-08-10",
    end_date: "2026-08-12"
  });
  const currentBooking = booking();
  const pendingBooking = booking({
    id: "pending-1",
    room_id: "room-free",
    guest_name: "Ioana Test",
    status: "pending",
    confirmed_at: null
  });
  const currentBlock = block();
  const summaries: RoomOccupancySummary[] = [
    {
      roomId: freeRoom.id,
      status: "free-now",
      statusLabel: "Liberă acum",
      currentBooking: null,
      nextBooking,
      pendingBookings: [pendingBooking],
      currentBlock: null,
      nextBlock: null
    },
    {
      roomId: occupiedRoom.id,
      status: "occupied",
      statusLabel: "Ocupată acum",
      currentBooking,
      nextBooking: currentBooking,
      pendingBookings: [],
      currentBlock: null,
      nextBlock: null
    },
    {
      roomId: blockedRoom.id,
      status: "blocked",
      statusLabel: "Blocată acum",
      currentBooking: null,
      nextBooking: null,
      pendingBookings: [],
      currentBlock,
      nextBlock: null
    }
  ];

  return render(
    <RoomOverview
      rooms={[freeRoom, occupiedRoom, blockedRoom]}
      occupancySummaries={summaries}
      checkInTime="15:00"
      checkOutTime="11:00"
    />
  );
}

describe("RoomOverview", () => {
  it("shows owner room overview counts and separates blocked rooms from free rooms", () => {
    renderOverview();

    expect(screen.getByRole("heading", { name: "Imagine de ansamblu camere" })).toBeVisible();
    expect(screen.getByText("Camere active").nextElementSibling).toHaveTextContent("3");
    expect(screen.getAllByText("Camere libere")[0].nextElementSibling).toHaveTextContent("1");
    expect(screen.getAllByText("Camere ocupate")[0].nextElementSibling).toHaveTextContent("1");
    expect(screen.getAllByText("Cereri în așteptare")[0].nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("Indisponibilă acum")).toBeVisible();
  });

  it("renders summary cards as quick action links to the relevant sections", () => {
    renderOverview();

    expect(
      screen.getByRole("link", { name: /Vezi toate camerele/ })
    ).toHaveAttribute("href", "/app/rooms");
    expect(
      screen.getByRole("link", { name: /Vezi camerele libere/ })
    ).toHaveAttribute("href", "#camere-libere");
    expect(
      screen.getByRole("link", { name: /Vezi camerele ocupate/ })
    ).toHaveAttribute("href", "#camere-ocupate");
    expect(
      screen.getByRole("link", { name: /Vezi cererile în așteptare/ })
    ).toHaveAttribute("href", "#cereri-in-asteptare");
    expect(
      screen.getByRole("heading", { name: "Camere libere" }).parentElement
    ).toHaveAttribute("id", "camere-libere");
    expect(
      screen.getByRole("heading", { name: "Camere ocupate" }).parentElement
    ).toHaveAttribute("id", "camere-ocupate");
    expect(
      screen.getByRole("heading", { name: "Cereri în așteptare" }).parentElement
    ).toHaveAttribute("id", "cereri-in-asteptare");
  });

  it("shows occupied room guest, period, release date, contact, and booking link", () => {
    renderOverview();

    const occupiedSection = screen.getByRole("heading", { name: "Camere ocupate" }).parentElement!;
    expect(within(occupiedSection).getByText("Camera Albastră")).toBeVisible();
    expect(within(occupiedSection).getByText("Ana Pop")).toBeVisible();
    expect(within(occupiedSection).getByText(/Perioadă:/)).toHaveTextContent("4 iulie 2026");
    expect(within(occupiedSection).getByText(/Se eliberează:/)).toHaveTextContent("7 iulie 2026");
    expect(within(occupiedSection).getByText("Telefon: 0700000000")).toBeVisible();
    expect(within(occupiedSection).getByText("Email: Email nesetat")).toBeVisible();
    expect(within(occupiedSection).getByText("Status: Confirmată")).toBeVisible();
    expect(within(occupiedSection).getByRole("link", { name: "Vezi rezervarea" })).toHaveAttribute(
      "href",
      "/app/bookings/booking-1"
    );
  });

  it("shows free room next confirmed booking and pending requests without raw ISO dates", () => {
    const { container } = renderOverview();

    const freeSection = screen.getByRole("heading", { name: "Camere libere" }).parentElement!;
    expect(within(freeSection).getByText("Camera Verde")).toBeVisible();
    expect(within(freeSection).getByText("Următoarea rezervare")).toBeVisible();
    expect(within(freeSection).getByText("Mihai Ionescu")).toBeVisible();
    expect(within(freeSection).getByRole("link", { name: "Vezi rezervarea" })).toHaveAttribute(
      "href",
      "/app/bookings/booking-next"
    );

    const pendingSection = screen.getByRole("heading", { name: "Cereri în așteptare" }).parentElement!;
    expect(within(pendingSection).getByText("Ioana Test")).toBeVisible();
    expect(within(pendingSection).getByText("Status: În așteptare")).toBeVisible();
    expect(within(pendingSection).getByText("Nu blochează camera până la confirmare.")).toBeVisible();
    expect(within(pendingSection).getByRole("link", { name: "Vezi cererea" })).toHaveAttribute(
      "href",
      "/app/bookings/pending-1"
    );
    expect(container.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
