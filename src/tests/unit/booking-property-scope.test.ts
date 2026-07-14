import { describe, expect, it } from "vitest";
import { BookingService, RoomBlockService } from "@/domain/bookings/service";
import { MemoryBookingRepository } from "@/domain/bookings/memory-repository";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";

function booking(patch: Partial<BookingRecord>): BookingRecord {
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
    price_per_night: 200,
    nights_count: 2,
    total_estimated_price: 400,
    currency: "RON",
    status: "confirmed",
    source: "manual_owner",
    conversation_id: null,
    calendar_sync_status: "not_required",
    google_calendar_event_id: null,
    calendar_sync_error_code: null,
    calendar_sync_error_message: null,
    calendar_synced_at: null,
    confirmed_at: "2026-08-01T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function block(patch: Partial<RoomBlockRecord>): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    start_date: "2026-08-15",
    end_date: "2026-08-16",
    reason: "Renovare",
    created_by_owner_id: "owner-1",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

describe("booking property scoping", () => {
  it("lists bookings and room blocks only for the selected property", async () => {
    const repository = new MemoryBookingRepository();
    repository.bookings = [
      booking({ id: "booking-property-1", property_id: "property-1" }),
      booking({
        id: "booking-property-2",
        property_id: "property-2",
        room_id: "room-2",
        guest_name: "Mihai Pop"
      })
    ];
    repository.roomBlocks = [
      block({ id: "block-property-1", property_id: "property-1" }),
      block({ id: "block-property-2", property_id: "property-2", room_id: "room-2" })
    ];

    await expect(
      new BookingService(repository).listBookings({
        ownerId: "owner-1",
        propertyId: "property-1"
      })
    ).resolves.toMatchObject([{ id: "booking-property-1" }]);
    await expect(
      new RoomBlockService(repository).listRoomBlocks({
        ownerId: "owner-1",
        propertyId: "property-1"
      })
    ).resolves.toMatchObject([{ id: "block-property-1" }]);
  });
});

