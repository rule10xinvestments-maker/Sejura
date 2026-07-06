import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomsList } from "@/components/rooms/rooms-list";
import type { BookingRecord } from "@/domain/bookings/types";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

const property = {
  id: "property-1",
  owner_id: "owner-1",
  name: "Pensiunea Brad",
  slug: "pensiunea-brad",
  status: "draft",
  contact_phone: "0712345678",
  contact_email: "gazda@example.com",
  check_in_time: "15:00",
  check_out_time: "11:00",
  rules: "Fara fumat.",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Property;

const room = {
  id: "room-1",
  owner_id: "owner-1",
  property_id: "property-1",
  name: "Camera Verde",
  max_guests: 2,
  base_price_per_night: 220,
  status: "active",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Room;

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
    start_date: "2026-07-04",
    end_date: "2026-07-07",
    guests_count: 2,
    price_per_night: 200,
    nights_count: 3,
    total_estimated_price: 600,
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

describe("RoomsList", () => {
  it("shows a friendly property setup message when property is missing", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={null}
        rooms={[]}
        saveAction={vi.fn()}
      />
    );

    expect(
      screen.getByText("Adaug\u0103 mai \u00eent\u00e2i detaliile propriet\u0103\u021bii.")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Configureaza proprietatea" })
    ).toHaveAttribute("href", "/app/property");
  });

  it("renders an empty room form safely when no rooms exist", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={property}
        rooms={[]}
        saveAction={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Adauga camera" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Adauga camera" })).toHaveAttribute(
      "href",
      "#camera-noua"
    );
    expect(screen.getByLabelText("Nume camer\u0103/unitate")).toBeVisible();
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 camera" })
    ).toBeVisible();
  });

  it("renders edit save copy and page-level success feedback", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={property}
        rooms={[room]}
        saveAction={vi.fn()}
        successMessage={"Camera a fost dezactivat\u0103."}
      />
    );

    expect(screen.getByText("Camera a fost dezactivat\u0103.")).toBeVisible();
    fireEvent.click(screen.getByText("Editeaza"));
    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 modific\u0103rile" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Dezactiveaza camera" })
    ).toHaveAttribute("type", "submit");
  });

  it("renders room occupancy details and booking links for owners", () => {
    const currentBooking = booking();
    const pendingBooking = booking({
      id: "pending-1",
      status: "pending",
      confirmed_at: null,
      guest_name: "Mihai Test"
    });

    render(
      <RoomsList
        checkInTime="15:00"
        checkOutTime="11:00"
        deactivateAction={vi.fn()}
        occupancySummaries={[
          {
            roomId: room.id,
            status: "occupied",
            statusLabel: "Ocupată acum",
            currentBooking,
            nextBooking: currentBooking,
            pendingBookings: [pendingBooking],
            currentBlock: null,
            nextBlock: null
          }
        ]}
        property={property}
        rooms={[room]}
        saveAction={vi.fn()}
      />
    );

    expect(screen.getByText("Ocupare camere")).toBeVisible();
    expect(screen.getByText("Ocupată acum")).toBeVisible();
    expect(screen.getByText("Ana Pop")).toBeVisible();
    expect(screen.getByText(/Se eliberează:/)).toBeVisible();
    expect(screen.getByText("Cereri în așteptare pentru această cameră")).toBeVisible();
    expect(screen.getByText("Nu blochează camera până la confirmare.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Vezi rezervarea" })).toHaveAttribute(
      "href",
      "/app/bookings/booking-1"
    );
    expect(screen.getByRole("link", { name: "Vezi cererea" })).toHaveAttribute(
      "href",
      "/app/bookings/pending-1"
    );
  });
});
