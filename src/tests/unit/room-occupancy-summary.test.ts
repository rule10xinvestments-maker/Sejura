import { describe, expect, it } from "vitest";
import {
  buildRoomOccupancySummaries,
  formatRomanianBookingDateTime,
  roomOccupancyBookingCopy
} from "@/domain/bookings/room-occupancy-summary";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

function room(id = "room-1", ownerId = "owner-1"): Room {
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

function block(patch: Partial<RoomBlockRecord> = {}): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
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

function summaries(input: {
  rooms?: Room[];
  bookings?: BookingRecord[];
  blocks?: RoomBlockRecord[];
  today?: string;
}) {
  return buildRoomOccupancySummaries({
    rooms: input.rooms ?? [room()],
    bookings: input.bookings ?? [],
    roomBlocks: input.blocks ?? [],
    today: input.today ?? "2026-07-05",
    checkInTime: "15:00",
    checkOutTime: "11:00"
  });
}

describe("buildRoomOccupancySummaries", () => {
  it("shows an occupied room with the current confirmed booking", () => {
    const [summary] = summaries({ bookings: [booking()] });

    expect(summary).toMatchObject({
      status: "occupied",
      statusLabel: "Ocupată acum",
      currentBooking: expect.objectContaining({ guest_name: "Ana Pop" })
    });
  });

  it("shows a free room with the next confirmed booking", () => {
    const [summary] = summaries({
      bookings: [
        booking({
          start_date: "2026-08-10",
          end_date: "2026-08-12"
        })
      ]
    });

    expect(summary).toMatchObject({
      status: "free-now",
      statusLabel: "Liberă acum",
      nextBooking: expect.objectContaining({ start_date: "2026-08-10" })
    });
  });

  it("shows free state when there are no future confirmed bookings", () => {
    const [summary] = summaries({
      bookings: [
        booking({
          start_date: "2026-06-01",
          end_date: "2026-06-03"
        })
      ]
    });

    expect(summary).toMatchObject({
      status: "free",
      statusLabel: "Liberă",
      nextBooking: null
    });
  });

  it("shows pending bookings separately without marking the room occupied", () => {
    const [summary] = summaries({
      bookings: [
        booking({
          id: "pending-1",
          status: "pending",
          confirmed_at: null
        })
      ]
    });

    expect(summary.status).toBe("free");
    expect(summary.pendingBookings).toHaveLength(1);
    expect(summary.pendingBookings[0].status).toBe("pending");
  });

  it("ignores cancelled and rejected bookings for occupancy", () => {
    const [summary] = summaries({
      bookings: [
        booking({ id: "cancelled", status: "cancelled" }),
        booking({ id: "rejected", status: "rejected" })
      ]
    });

    expect(summary.status).toBe("free");
    expect(summary.currentBooking).toBeNull();
    expect(summary.nextBooking).toBeNull();
  });

  it("formats dates readably without raw ISO values", () => {
    const formatted = formatRomanianBookingDateTime("2026-07-05", "15:00");
    const copy = roomOccupancyBookingCopy(booking(), "15:00", "11:00");

    expect(formatted).toContain("5 iulie 2026");
    expect(formatted).not.toContain("2026-07-05");
    expect(copy.checkout).toContain("7 iulie 2026");
    expect(copy.email).toBe("Email nesetat");
  });

  it("does not include cross-owner bookings or blocks", () => {
    const [summary] = summaries({
      rooms: [room("room-1", "owner-1")],
      bookings: [
        booking({
          owner_id: "owner-2",
          property_id: "property-2",
          room_id: "room-1"
        })
      ],
      blocks: [
        block({
          owner_id: "owner-2",
          property_id: "property-2",
          room_id: "room-1"
        })
      ]
    });

    expect(summary.status).toBe("free");
    expect(summary.currentBooking).toBeNull();
    expect(summary.currentBlock).toBeNull();
  });

  it("shows current room blocks as blocked", () => {
    const [summary] = summaries({ blocks: [block()] });

    expect(summary).toMatchObject({
      status: "blocked",
      statusLabel: "Blocată acum",
      currentBlock: expect.objectContaining({ reason: "Renovare" })
    });
  });
});
