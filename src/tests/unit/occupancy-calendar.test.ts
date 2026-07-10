import { describe, expect, it } from "vitest";
import { buildRoomOccupancyCalendar } from "@/domain/bookings/occupancy-calendar";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

function room(id: string, ownerId = "owner-1"): Room {
  return {
    id,
    owner_id: ownerId,
    property_id: ownerId === "owner-1" ? "property-1" : "property-2",
    name: id,
    max_guests: 2,
    base_price_per_night: 200,
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
    guest_phone: null,
    guest_email: null,
    guest_notes: null,
    start_date: "2026-06-12",
    end_date: "2026-06-16",
    guests_count: 2,
    price_per_night: 200,
    nights_count: 4,
    total_estimated_price: 800,
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

function block(patch: Partial<RoomBlockRecord> = {}): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    start_date: "2026-06-14",
    end_date: "2026-06-15",
    reason: "Renovare",
    created_by_owner_id: "owner-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function calendar(input: {
  rooms?: Room[];
  bookings?: BookingRecord[];
  roomBlocks?: RoomBlockRecord[];
}) {
  return buildRoomOccupancyCalendar({
    rooms: input.rooms ?? [room("room-1")],
    bookings: input.bookings ?? [],
    roomBlocks: input.roomBlocks ?? [],
    startDate: "2026-06-12",
    daysCount: 5
  });
}

describe("buildRoomOccupancyCalendar", () => {
  it("marks confirmed bookings as occupied check-in inclusive and check-out exclusive", () => {
    const result = calendar({ bookings: [booking()] });
    const statuses = result.rows[0].cells.map((cell) => [cell.date, cell.status]);

    expect(statuses).toEqual([
      ["2026-06-12", "occupied"],
      ["2026-06-13", "occupied"],
      ["2026-06-14", "occupied"],
      ["2026-06-15", "occupied"],
      ["2026-06-16", "free"]
    ]);
  });

  it("keeps pending bookings out of occupied calendar cells", () => {
    const result = calendar({
      bookings: [booking({ status: "pending", confirmed_at: null })]
    });

    expect(result.rows[0].cells[0]).toMatchObject({
      status: "free",
      label: "Liber"
    });
  });

  it("shows different rooms independently on the same date", () => {
    const result = calendar({
      rooms: [room("room-1"), room("room-2")],
      bookings: [booking({ room_id: "room-1" })]
    });

    expect(result.rows[0].cells[0].status).toBe("occupied");
    expect(result.rows[1].cells[0].status).toBe("free");
  });

  it("only includes bookings for the supplied owner rooms", () => {
    const result = calendar({
      rooms: [room("room-1")],
      bookings: [
        booking({
          id: "other-owner-booking",
          owner_id: "owner-2",
          property_id: "property-2",
          room_id: "room-1"
        })
      ]
    });

    expect(result.rows[0].cells.every((cell) => cell.status === "free")).toBe(true);
  });

  it("handles no bookings as all rooms free", () => {
    const result = calendar({ rooms: [room("room-1"), room("room-2")] });

    expect(
      result.rows.flatMap((row) => row.cells).every((cell) => cell.status === "free")
    ).toBe(true);
  });

  it("handles multiple rooms over the same period", () => {
    const result = calendar({
      rooms: [room("room-1"), room("room-2")],
      bookings: [
        booking({ room_id: "room-1", status: "confirmed" }),
        booking({
          id: "booking-2",
          room_id: "room-2",
          status: "confirmed"
        })
      ]
    });

    expect(result.rows[0].cells[1].status).toBe("occupied");
    expect(result.rows[1].cells[1].status).toBe("occupied");
  });

  it("ignores cancelled and rejected bookings", () => {
    const result = calendar({
      bookings: [
        booking({ id: "cancelled", status: "cancelled", cancelled_at: "2026-06-11T00:00:00.000Z" }),
        booking({ id: "rejected", status: "rejected", rejected_at: "2026-06-11T00:00:00.000Z" })
      ]
    });

    expect(result.rows[0].cells.every((cell) => cell.status === "free")).toBe(true);
  });

  it("marks blocked dates when room blocks are present", () => {
    const result = calendar({ roomBlocks: [block()] });

    expect(result.rows[0].cells[2]).toMatchObject({
      date: "2026-06-14",
      status: "blocked",
      label: "Blocat"
    });
  });

  it("ignores room blocks that belong to another owner", () => {
    const result = calendar({
      roomBlocks: [
        block({
          owner_id: "owner-2",
          property_id: "property-2"
        })
      ]
    });

    expect(result.rows[0].cells.every((cell) => cell.status === "free")).toBe(true);
  });
});
