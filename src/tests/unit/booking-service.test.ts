import { describe, expect, it, vi } from "vitest";
import { BookingDomainError } from "@/domain/bookings/errors";
import { MemoryBookingRepository } from "@/domain/bookings/memory-repository";
import { AvailabilityService, BookingService, RoomBlockService } from "@/domain/bookings/service";
import type { BookingCalendarSyncPort } from "@/domain/bookings/calendar-sync";
import { GoogleCalendarError } from "@/domain/google-calendar/errors";
import type { BookingRecord } from "@/domain/bookings/types";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";

const ownerId = "owner-1";
const otherOwnerId = "owner-2";
const propertyId = "property-1";
const roomId = "room-1";
const otherRoomId = "room-2";

function property(id: string, owner: string): Property {
  return {
    id,
    owner_id: owner,
    name: "Pensiunea Test",
    slug: "pensiunea-test",
    status: "draft",
    contact_phone: "0700000000",
    contact_email: "test@example.com",
    check_in_time: "15:00",
    check_out_time: "11:00",
    rules: "",
    city: null,
    public_description: null,
    public_contact_phone: null,
    public_contact_email: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}

function room(id: string, owner: string, status: Room["status"] = "active"): Room {
  return {
    id,
    owner_id: owner,
    property_id: owner === ownerId ? propertyId : "property-2",
    name: id,
    max_guests: 2,
    base_price_per_night: 200,
    status,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}

function booking(patch: Partial<BookingRecord> = {}): BookingRecord {
  const base: BookingRecord = {
    id: "booking-1",
    owner_id: ownerId,
    property_id: propertyId,
    room_id: roomId,
    guest_name: "Ana Pop",
    guest_phone: null,
    guest_email: null,
    guest_notes: null,
    start_date: "2026-07-10",
    end_date: "2026-07-12",
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
    confirmed_at: "2026-01-01T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: ownerId,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null
  };

  return { ...base, ...patch };
}

function repository() {
  return new MemoryBookingRepository({
    properties: [property(propertyId, ownerId), property("property-2", otherOwnerId)],
    rooms: [room(roomId, ownerId), room(otherRoomId, ownerId)],
    propertySettings: [
      {
        id: "settings-1",
        owner_id: ownerId,
        property_id: propertyId,
        ai_enabled: false,
        public_booking_enabled: false,
        allow_auto_confirmation: false,
        calendar_required_for_confirmation: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      }
    ]
  });
}

function requireCalendarRepository() {
  const repo = repository();
  repo.propertySettings[0].calendar_required_for_confirmation = true;
  return repo;
}

function syncedPort(eventId = "google-event-1"): BookingCalendarSyncPort {
  return {
    syncConfirmedBooking: vi.fn(async () => ({
      eventId,
      status: "synced" as const,
      syncedAt: "2026-01-01T01:00:00.000Z",
      errorCode: null,
      errorMessage: null
    })),
    markCancelledBooking: vi.fn(async () => ({
      eventId,
      status: "synced" as const,
      syncedAt: "2026-01-01T01:30:00.000Z",
      errorCode: null,
      errorMessage: null
    }))
  };
}

const validInput = {
  propertyId,
  roomId,
  guestName: "Maria Ionescu",
  startDate: "2026-07-15",
  endDate: "2026-07-17",
  guestsCount: 2,
  pricePerNight: 250
};

describe("booking availability and transitions", () => {
  it("allows adjacent confirmed bookings", async () => {
    const repo = repository();
    repo.bookings.push(booking());
    const service = new AvailabilityService(repo);

    await expect(
      service.checkAvailability(
        {
          propertyId,
          roomId,
          startDate: "2026-07-12",
          endDate: "2026-07-14",
          guestsCount: 2
        },
        { ownerId }
      )
    ).resolves.toMatchObject({ available: true, nightsCount: 2 });
  });

  it("allows adjacent bookings that end on an existing start date", async () => {
    const repo = repository();
    repo.bookings.push(booking());
    const service = new AvailabilityService(repo);

    await expect(
      service.checkAvailability(
        {
          propertyId,
          roomId,
          startDate: "2026-07-08",
          endDate: "2026-07-10",
          guestsCount: 2
        },
        { ownerId }
      )
    ).resolves.toMatchObject({ available: true, nightsCount: 2 });
  });

  it("blocks overlapping confirmed bookings", async () => {
    const repo = repository();
    repo.bookings.push(booking());
    const service = new AvailabilityService(repo);
    const result = await service.checkAvailability(
      {
        propertyId,
        roomId,
        startDate: "2026-07-11",
        endDate: "2026-07-13",
        guestsCount: 2
      },
      { ownerId }
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain("Exista deja o rezervare confirmata in acest interval.");
  });

  it("ignores cancelled and rejected bookings for availability", async () => {
    const repo = repository();
    repo.bookings.push(
      booking({ id: "cancelled", status: "cancelled" }),
      booking({ id: "rejected", status: "rejected" })
    );
    const service = new AvailabilityService(repo);

    await expect(
      service.checkAvailability(
        {
          propertyId,
          roomId,
          startDate: "2026-07-11",
          endDate: "2026-07-13",
          guestsCount: 2
        },
        { ownerId }
      )
    ).resolves.toMatchObject({ available: true });
  });

  it("blocks inactive rooms and room blocks", async () => {
    const repo = repository();
    repo.rooms = [room(roomId, ownerId, "inactive")];
    const blockService = new RoomBlockService(repo);
    await blockService.createRoomBlock(
      {
        propertyId,
        roomId,
        startDate: "2026-07-20",
        endDate: "2026-07-22",
        reason: "Renovare"
      },
      { ownerId }
    );

    const result = await new AvailabilityService(repo).checkAvailability(
      {
        propertyId,
        roomId,
        startDate: "2026-07-21",
        endDate: "2026-07-23",
        guestsCount: 2
      },
      { ownerId }
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain("Camera este inactiva.");
    expect(result.reasons).toContain("Camera este blocata in acest interval.");
  });

  it("creates pending bookings and ignores client owner_id input", async () => {
    const repo = repository();
    const service = new BookingService(repo);
    const created = await service.createPendingBooking(
      { ...validInput, owner_id: "client-owner" } as never,
      { ownerId }
    );

    expect(created.status).toBe("pending");
    expect(created.owner_id).toBe(ownerId);
    expect(created.calendar_sync_status).toBe("not_required");
  });

  it("creates AI chat bookings as pending only", async () => {
    const created = await new BookingService(repository()).createPendingBooking(
      { ...validInput, source: "ai_chat" },
      { ownerId, actorType: "ai" }
    );

    expect(created.status).toBe("pending");
    expect(created.source).toBe("ai_chat");
    expect(created.created_by_actor_type).toBe("ai");
    expect(created.google_calendar_event_id).toBeNull();
  });

  it("creates confirmed manual bookings when available", async () => {
    const created = await new BookingService(repository()).createManualBooking(
      validInput,
      { ownerId }
    );

    expect(created.status).toBe("confirmed");
    expect(created.nights_count).toBe(2);
    expect(created.total_estimated_price).toBe(500);
  });

  it("rejects overlapping manual confirmed bookings", async () => {
    const repo = repository();
    repo.bookings.push(booking());

    await expect(
      new BookingService(repo).createManualBooking(
        {
          ...validInput,
          startDate: "2026-07-11",
          endDate: "2026-07-13"
        },
        { ownerId }
      )
    ).rejects.toMatchObject({ code: "NOT_AVAILABLE" });
  });

  it("rechecks availability before confirming pending bookings", async () => {
    const repo = repository();
    const service = new BookingService(repo);
    const pending = await service.createPendingBooking(validInput, { ownerId });
    repo.bookings.push(
      booking({
        id: "blocking",
        start_date: validInput.startDate,
        end_date: validInput.endDate
      })
    );

    await expect(service.confirmBooking(pending.id, { ownerId })).rejects.toMatchObject({
      code: "NOT_AVAILABLE"
    });
  });

  it("rejects and cancels valid status transitions", async () => {
    const repo = repository();
    const service = new BookingService(repo);
    const pending = await service.createPendingBooking(validInput, { ownerId });
    const rejected = await service.rejectBooking(pending.id, { ownerId });
    const confirmed = await service.createManualBooking(
      { ...validInput, roomId: otherRoomId, startDate: "2026-08-01", endDate: "2026-08-03" },
      { ownerId }
    );
    const cancelled = await service.cancelBooking(confirmed.id, { ownerId });

    expect(rejected.status).toBe("rejected");
    expect(cancelled.status).toBe("cancelled");
  });

  it("rejects invalid status transitions", async () => {
    const repo = repository();
    const service = new BookingService(repo);
    const confirmed = await service.createManualBooking(validInput, { ownerId });

    await expect(service.rejectBooking(confirmed.id, { ownerId })).rejects.toBeInstanceOf(
      BookingDomainError
    );
  });

  it("blocks cross-owner booking and room block access", async () => {
    const repo = repository();
    const service = new BookingService(repo);
    const blockService = new RoomBlockService(repo);
    const created = await service.createManualBooking(validInput, { ownerId });

    await expect(service.getBooking(created.id, { ownerId: otherOwnerId })).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(
      blockService.createRoomBlock(
        {
          propertyId,
          roomId,
          startDate: "2026-09-01",
          endDate: "2026-09-02"
        },
        { ownerId: otherOwnerId }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates a Google Calendar event when confirming a pending booking", async () => {
    const repo = requireCalendarRepository();
    const port = syncedPort("google-event-created");
    const service = new BookingService(repo, port);
    const pending = await service.createPendingBooking(validInput, { ownerId });
    const confirmed = await service.confirmBooking(pending.id, { ownerId });

    expect(port.syncConfirmedBooking).toHaveBeenCalledOnce();
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.google_calendar_event_id).toBe("google-event-created");
    expect(confirmed.calendar_sync_status).toBe("synced");
  });

  it("leaves booking pending when calendar is required and sync fails", async () => {
    const repo = requireCalendarRepository();
    const port: BookingCalendarSyncPort = {
      syncConfirmedBooking: vi.fn(async () => {
        throw new GoogleCalendarError(
          "GOOGLE_EVENT_CREATE_FAILED",
          "Google Calendar nu a putut fi sincronizat."
        );
      }),
      markCancelledBooking: vi.fn()
    };
    const service = new BookingService(repo, port);
    const pending = await service.createPendingBooking(validInput, { ownerId });

    await expect(service.confirmBooking(pending.id, { ownerId })).rejects.toMatchObject({
      code: "NOT_AVAILABLE"
    });
    expect((await service.getBooking(pending.id, { ownerId })).status).toBe("pending");
    expect((await service.getBooking(pending.id, { ownerId })).calendar_sync_status).toBe("failed");
  });

  it("allows confirmation with failed sync when calendar is optional", async () => {
    const repo = repository();
    const port: BookingCalendarSyncPort = {
      syncConfirmedBooking: vi.fn(async () => {
        throw new GoogleCalendarError(
          "GOOGLE_EVENT_CREATE_FAILED",
          "Google Calendar nu a putut fi sincronizat."
        );
      }),
      markCancelledBooking: vi.fn()
    };
    const service = new BookingService(repo, port);
    const pending = await service.createPendingBooking(validInput, { ownerId });
    const confirmed = await service.confirmBooking(pending.id, { ownerId });

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.calendar_sync_status).toBe("failed");
  });

  it("marks Google Calendar event as cancelled when cancelling a synced booking", async () => {
    const repo = requireCalendarRepository();
    const port = syncedPort("google-event-cancel");
    const service = new BookingService(repo, port);
    const pending = await service.createPendingBooking(validInput, { ownerId });
    const confirmed = await service.confirmBooking(pending.id, { ownerId });
    const cancelled = await service.cancelBooking(confirmed.id, { ownerId });

    expect(port.markCancelledBooking).toHaveBeenCalledOnce();
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.google_calendar_event_id).toBe("google-event-cancel");
    expect(cancelled.calendar_sync_status).toBe("synced");
  });
});
