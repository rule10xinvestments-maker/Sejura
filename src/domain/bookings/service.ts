import { getNightsCount } from "@/domain/bookings/date";
import { BookingDomainError } from "@/domain/bookings/errors";
import type { BookingRepository } from "@/domain/bookings/repository";
import type {
  BookingCalendarSyncPort,
  CalendarSyncResult
} from "@/domain/bookings/calendar-sync";
import type { BookingNotificationPort } from "@/domain/bookings/notifications";
import { GoogleCalendarError } from "@/domain/google-calendar/errors";
import type {
  AuthContext,
  AvailabilityInput,
  BookingInput,
  BookingRecord,
  BookingStatus,
  RoomBlockInput,
  RoomBlockUpdateInput
} from "@/domain/bookings/types";

function normalizeAuthContext(authContext: AuthContext) {
  return {
    ownerId: authContext.ownerId,
    actorType: authContext.actorType ?? "owner"
  } as const;
}

function validatePositiveGuests(guestsCount: number) {
  if (!Number.isInteger(guestsCount) || guestsCount <= 0) {
    throw new BookingDomainError("VALIDATION", "Numarul de oaspeti este invalid.");
  }
}

function totalPrice(pricePerNight: number | null | undefined, nightsCount: number) {
  return typeof pricePerNight === "number" ? pricePerNight * nightsCount : null;
}

function normalizeSyncError(
  error: unknown,
  eventId: string | null = null
): CalendarSyncResult {
  if (error instanceof GoogleCalendarError) {
    return {
      eventId,
      status:
        error.code === "GOOGLE_RECONNECT_REQUIRED" ||
        error.code === "GOOGLE_REFRESH_TOKEN_MISSING" ||
        error.code === "GOOGLE_TOKEN_REFRESH_FAILED"
          ? "needs_reconnect"
          : "failed",
      syncedAt: null,
      errorCode: error.code,
      errorMessage: error.message
    };
  }

  return {
    eventId,
    status: "failed",
    syncedAt: null,
    errorCode: "GOOGLE_EVENT_CREATE_FAILED",
    errorMessage: "Google Calendar nu a putut fi sincronizat."
  };
}

export class AvailabilityService {
  constructor(private repository: BookingRepository) {}

  async checkAvailability(input: AvailabilityInput, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    const nightsCount = getNightsCount(input.startDate, input.endDate);
    validatePositiveGuests(input.guestsCount);

    const property = await this.repository.getProperty(ownerId, input.propertyId);
    if (!property) {
      throw new BookingDomainError("NOT_FOUND", "Proprietatea nu a fost gasita.");
    }

    const room = await this.repository.getRoom(ownerId, input.propertyId, input.roomId);
    if (!room) {
      throw new BookingDomainError("NOT_FOUND", "Camera nu a fost gasita.");
    }

    const reasons: string[] = [];

    if (room.status !== "active") {
      reasons.push("Camera este inactiva.");
    }

    if (input.guestsCount > room.max_guests) {
      reasons.push("Numarul de oaspeti depaseste capacitatea camerei.");
    }

    const blockingBookings = await this.repository.listBlockingBookings({
      ownerId,
      roomId: input.roomId,
      startDate: input.startDate,
      endDate: input.endDate,
      excludeBookingId: input.excludeBookingId
    });

    if (blockingBookings.length > 0) {
      reasons.push("Camera nu mai este disponibilă pentru perioada aleasă.");
    }

    const roomBlocks = await this.repository.listRoomBlocks({
      ownerId,
      roomId: input.roomId,
      startDate: input.startDate,
      endDate: input.endDate
    });

    if (roomBlocks.length > 0) {
      reasons.push("Camera este blocata in acest interval.");
    }

    return {
      available: reasons.length === 0,
      nightsCount,
      reasons
    };
  }
}

export class BookingService {
  private availabilityService: AvailabilityService;

  constructor(
    private repository: BookingRepository,
    private calendarSync?: BookingCalendarSyncPort,
    private notifications?: BookingNotificationPort
  ) {
    this.availabilityService = new AvailabilityService(repository);
  }

  async listBookings(authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    return this.repository.listBookings(ownerId);
  }

  async getBooking(bookingId: string, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    const booking = await this.repository.getBooking(ownerId, bookingId);
    if (!booking || booking.deleted_at) {
      throw new BookingDomainError("NOT_FOUND", "Rezervarea nu a fost gasita.");
    }
    return booking;
  }

  async getBookingEvents(bookingId: string, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    await this.getBooking(bookingId, authContext);
    return this.repository.listBookingEvents(ownerId, bookingId);
  }

  async createPendingBooking(input: BookingInput, authContext: AuthContext) {
    const booking = await this.createBooking(input, authContext, "pending");
    await this.safeNotify(() => this.notifications?.notifyBookingPending(booking.id));
    return booking;
  }

  async createManualBooking(input: BookingInput, authContext: AuthContext) {
    await this.ensureAvailable(input, authContext);
    const booking = await this.createBooking(input, authContext, "confirmed");
    const syncedBooking = await this.syncManualConfirmedBooking(booking, authContext);
    await this.recordEvent(
      syncedBooking,
      "booking_confirmed",
      "pending",
      "confirmed",
      authContext
    );
    await this.safeNotify(() => this.notifications?.notifyBookingConfirmed(syncedBooking.id));
    if (
      syncedBooking.calendar_sync_status === "failed" ||
      syncedBooking.calendar_sync_status === "needs_reconnect"
    ) {
      await this.safeNotify(() => this.notifications?.notifyCalendarSyncFailed(syncedBooking.id));
    }
    return syncedBooking;
  }

  async confirmBooking(bookingId: string, authContext: AuthContext) {
    const booking = await this.getBooking(bookingId, authContext);

    if (booking.status === "confirmed") {
      return booking;
    }

    if (booking.status !== "pending") {
      throw new BookingDomainError(
        "INVALID_STATUS_TRANSITION",
        "Doar rezervarile in asteptare pot fi confirmate."
      );
    }

    await this.availabilityService.checkAvailability(
      {
        propertyId: booking.property_id,
        roomId: booking.room_id,
        startDate: booking.start_date,
        endDate: booking.end_date,
        guestsCount: booking.guests_count,
        excludeBookingId: booking.id
      },
      authContext
    ).then((availability) => {
      if (!availability.available) {
        throw new BookingDomainError("NOT_AVAILABLE", availability.reasons[0]);
      }
    });

    return this.confirmPendingBookingRecord(booking, authContext);
  }

  async rejectBooking(bookingId: string, authContext: AuthContext) {
    const booking = await this.getBooking(bookingId, authContext);
    if (booking.status !== "pending") {
      throw new BookingDomainError(
        "INVALID_STATUS_TRANSITION",
        "Doar rezervarile in asteptare pot fi respinse."
      );
    }

    const updated = await this.transitionBooking(booking, "rejected", authContext);
    await this.safeNotify(() => this.notifications?.notifyBookingRejected(updated.id));
    return updated;
  }

  async cancelBooking(bookingId: string, authContext: AuthContext) {
    const booking = await this.getBooking(bookingId, authContext);
    if (booking.status === "cancelled" || booking.status === "rejected") {
      throw new BookingDomainError(
        "INVALID_STATUS_TRANSITION",
        "Rezervarea nu mai poate fi anulata."
      );
    }

    const syncPatch = await this.tryMarkCancelledInCalendar(booking, authContext);
    const updated = await this.transitionBooking(
      booking,
      "cancelled",
      authContext,
      syncPatch
    );
    await this.safeNotify(() => this.notifications?.notifyBookingCancelled(updated.id));
    if (
      updated.calendar_sync_status === "failed" ||
      updated.calendar_sync_status === "needs_reconnect"
    ) {
      await this.safeNotify(() => this.notifications?.notifyCalendarSyncFailed(updated.id));
    }
    return updated;
  }

  private async confirmPendingBookingRecord(
    booking: BookingRecord,
    authContext: AuthContext
  ) {
    const { ownerId } = normalizeAuthContext(authContext);
    const settings = await this.repository.getPropertySettings(
      ownerId,
      booking.property_id
    );
    const calendarRequired =
      settings?.calendar_required_for_confirmation ?? false;

    const syncPatch = await this.trySyncConfirmedBooking(
      booking,
      authContext,
      calendarRequired
    );

    const updated = await this.transitionBooking(
      booking,
      "confirmed",
      authContext,
      syncPatch
    );
    await this.safeNotify(() => this.notifications?.notifyBookingConfirmed(updated.id));
    if (
      updated.calendar_sync_status === "failed" ||
      updated.calendar_sync_status === "needs_reconnect"
    ) {
      await this.safeNotify(() => this.notifications?.notifyCalendarSyncFailed(updated.id));
    }
    return updated;
  }

  private async syncManualConfirmedBooking(
    booking: BookingRecord,
    authContext: AuthContext
  ) {
    const { ownerId } = normalizeAuthContext(authContext);
    const settings = await this.repository.getPropertySettings(
      ownerId,
      booking.property_id
    );
    const calendarRequired =
      settings?.calendar_required_for_confirmation ?? false;

    try {
      const syncPatch = await this.trySyncConfirmedBooking(
        booking,
        authContext,
        calendarRequired
      );
      if (!syncPatch) return booking;
      return this.repository.updateBooking(ownerId, booking.id, {
        calendar_sync_status: syncPatch.status,
        google_calendar_event_id: syncPatch.eventId,
        calendar_sync_error_code: syncPatch.errorCode,
        calendar_sync_error_message: syncPatch.errorMessage,
        calendar_synced_at: syncPatch.syncedAt
      });
    } catch (error) {
      if (error instanceof BookingDomainError && error.code === "NOT_AVAILABLE") {
        return this.getBooking(booking.id, authContext);
      }
      throw error;
    }
  }

  private async ensureAvailable(input: BookingInput, authContext: AuthContext) {
    const availability = await this.availabilityService.checkAvailability(
      {
        propertyId: input.propertyId,
        roomId: input.roomId,
        startDate: input.startDate,
        endDate: input.endDate,
        guestsCount: input.guestsCount
      },
      authContext
    );

    if (!availability.available) {
      throw new BookingDomainError("NOT_AVAILABLE", availability.reasons[0]);
    }

    return availability;
  }

  private async createBooking(
    input: BookingInput,
    authContext: AuthContext,
    status: BookingStatus
  ) {
    const { ownerId, actorType } = normalizeAuthContext(authContext);
    const nightsCount = getNightsCount(input.startDate, input.endDate);
    validatePositiveGuests(input.guestsCount);

    const property = await this.repository.getProperty(ownerId, input.propertyId);
    if (!property) {
      throw new BookingDomainError("NOT_FOUND", "Proprietatea nu a fost gasita.");
    }

    const room = await this.repository.getRoom(ownerId, input.propertyId, input.roomId);
    if (!room) {
      throw new BookingDomainError("NOT_FOUND", "Camera nu a fost gasita.");
    }

    if (room.status !== "active") {
      throw new BookingDomainError("NOT_AVAILABLE", "Camera este inactiva.");
    }

    if (input.guestsCount > room.max_guests) {
      throw new BookingDomainError(
        "VALIDATION",
        "Numarul de oaspeti depaseste capacitatea camerei."
      );
    }

    const now = new Date().toISOString();
    const booking = await this.repository.insertBooking({
      owner_id: ownerId,
      property_id: input.propertyId,
      room_id: input.roomId,
      guest_name: input.guestName,
      guest_phone: input.guestPhone ?? null,
      guest_email: input.guestEmail ?? null,
      guest_notes: input.guestNotes ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      guests_count: input.guestsCount,
      price_per_night: input.pricePerNight ?? null,
      nights_count: nightsCount,
      total_estimated_price: totalPrice(input.pricePerNight, nightsCount),
      currency: "RON",
      status,
      source: input.source ?? "manual_owner",
      conversation_id: input.conversationId ?? null,
      calendar_sync_status: status === "confirmed" ? "pending" : "not_required",
      google_calendar_event_id: null,
      calendar_sync_error_code: null,
      calendar_sync_error_message: null,
      calendar_synced_at: null,
      confirmed_at: status === "confirmed" ? now : null,
      cancelled_at: null,
      rejected_at: null,
      created_by_actor_type: actorType,
      created_by_owner_id: actorType === "owner" ? ownerId : null,
      deleted_at: null
    });

    await this.recordEvent(booking, "booking_created", null, status, authContext);
    return booking;
  }

  private async transitionBooking(
    booking: BookingRecord,
    nextStatus: BookingStatus,
    authContext: AuthContext,
    calendarSyncResult?: CalendarSyncResult | null
  ) {
    const timestamp = new Date().toISOString();
    const previousStatus = booking.status;
    const patch: Partial<BookingRecord> = {
      status: nextStatus,
      confirmed_at: nextStatus === "confirmed" ? timestamp : booking.confirmed_at,
      rejected_at: nextStatus === "rejected" ? timestamp : booking.rejected_at,
      cancelled_at: nextStatus === "cancelled" ? timestamp : booking.cancelled_at,
      calendar_sync_status:
        calendarSyncResult?.status ?? booking.calendar_sync_status,
      google_calendar_event_id:
        calendarSyncResult?.eventId ?? booking.google_calendar_event_id,
      calendar_sync_error_code:
        calendarSyncResult?.errorCode ?? booking.calendar_sync_error_code,
      calendar_sync_error_message:
        calendarSyncResult?.errorMessage ?? booking.calendar_sync_error_message,
      calendar_synced_at:
        calendarSyncResult?.syncedAt ?? booking.calendar_synced_at
    };

    const updated = await this.repository.updateBooking(
      authContext.ownerId,
      booking.id,
      patch
    );
    await this.recordEvent(
      updated,
      `booking_${nextStatus}`,
      previousStatus,
      nextStatus,
      authContext
    );

    return updated;
  }

  private async trySyncConfirmedBooking(
    booking: BookingRecord,
    authContext: AuthContext,
    calendarRequired: boolean
  ): Promise<CalendarSyncResult | null> {
    if (!this.calendarSync) {
      if (calendarRequired) {
        await this.repository.updateBooking(authContext.ownerId, booking.id, {
          calendar_sync_status: "needs_reconnect",
          calendar_sync_error_code: "GOOGLE_CALENDAR_DISCONNECTED",
          calendar_sync_error_message: "Google Calendar este deconectat."
        });
        throw new BookingDomainError(
          "NOT_AVAILABLE",
          "Rezervarea nu poate fi confirmata deoarece Google Calendar este obligatoriu pentru aceasta pensiune. Conecteaza calendarul sau dezactiveaza cerinta din setari."
        );
      }

      return {
        eventId: null,
        status: "not_required",
        syncedAt: null,
        errorCode: null,
        errorMessage: null
      };
    }

    try {
      return await this.calendarSync.syncConfirmedBooking(
        authContext.ownerId,
        booking.id
      );
    } catch (error) {
      const syncError = normalizeSyncError(error);
      await this.repository.updateBooking(authContext.ownerId, booking.id, {
        calendar_sync_status: syncError.status,
        calendar_sync_error_code: syncError.errorCode,
        calendar_sync_error_message: syncError.errorMessage
      });

      if (calendarRequired) {
        throw new BookingDomainError(
          "NOT_AVAILABLE",
          "Rezervarea nu poate fi confirmata deoarece Google Calendar este obligatoriu pentru aceasta pensiune. Conecteaza calendarul sau dezactiveaza cerinta din setari."
        );
      }

      return syncError;
    }
  }

  private async tryMarkCancelledInCalendar(
    booking: BookingRecord,
    authContext: AuthContext
  ): Promise<CalendarSyncResult | null> {
    if (!this.calendarSync || !booking.google_calendar_event_id) {
      return {
        eventId: booking.google_calendar_event_id,
        status: booking.calendar_sync_status,
        syncedAt: booking.calendar_synced_at,
        errorCode: booking.calendar_sync_error_code as never,
        errorMessage: booking.calendar_sync_error_message
      };
    }

    try {
      return await this.calendarSync.markCancelledBooking(
        authContext.ownerId,
        booking.id
      );
    } catch (error) {
      return normalizeSyncError(error, booking.google_calendar_event_id);
    }
  }

  private async recordEvent(
    booking: BookingRecord,
    eventType: string,
    previousStatus: BookingStatus | null,
    newStatus: BookingStatus | null,
    authContext: AuthContext
  ) {
    const { ownerId, actorType } = normalizeAuthContext(authContext);

    await this.repository.insertBookingEvent({
      owner_id: ownerId,
      property_id: booking.property_id,
      booking_id: booking.id,
      event_type: eventType,
      actor_type: actorType,
      actor_owner_id: actorType === "owner" ? ownerId : null,
      previous_status: previousStatus,
      new_status: newStatus,
      metadata: {}
    });
  }

  private async safeNotify(send: () => Promise<unknown> | undefined) {
    try {
      await send();
    } catch (error) {
      const detail =
        error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
      console.warn(`[booking notifications] ${detail}`);
    }
  }
}

export class RoomBlockService {
  constructor(private repository: BookingRepository) {}

  async listRoomBlocks(authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    return this.repository.listRoomBlocks({ ownerId });
  }

  async createRoomBlock(input: RoomBlockInput, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    getNightsCount(input.startDate, input.endDate);
    await this.ensureOwnedActiveRoom(input, authContext, false);

    return this.repository.insertRoomBlock({
      owner_id: ownerId,
      property_id: input.propertyId,
      room_id: input.roomId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason ?? null,
      created_by_owner_id: ownerId,
      deleted_at: null
    });
  }

  async updateRoomBlock(input: RoomBlockUpdateInput, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    const block = await this.repository.getRoomBlock(ownerId, input.blockId);
    if (!block || block.deleted_at) {
      throw new BookingDomainError("NOT_FOUND", "Blocarea nu a fost gasita.");
    }

    getNightsCount(input.startDate, input.endDate);
    await this.ensureOwnedActiveRoom(input, authContext, false);

    return this.repository.updateRoomBlock(ownerId, input.blockId, {
      property_id: input.propertyId,
      room_id: input.roomId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason ?? null
    });
  }

  async deleteRoomBlock(blockId: string, authContext: AuthContext) {
    const { ownerId } = normalizeAuthContext(authContext);
    const block = await this.repository.getRoomBlock(ownerId, blockId);
    if (!block || block.deleted_at) {
      throw new BookingDomainError("NOT_FOUND", "Blocarea nu a fost gasita.");
    }

    return this.repository.updateRoomBlock(ownerId, blockId, {
      deleted_at: new Date().toISOString()
    });
  }

  private async ensureOwnedActiveRoom(
    input: RoomBlockInput,
    authContext: AuthContext,
    requireActive: boolean
  ) {
    const { ownerId } = normalizeAuthContext(authContext);
    const property = await this.repository.getProperty(ownerId, input.propertyId);
    if (!property) {
      throw new BookingDomainError("NOT_FOUND", "Proprietatea nu a fost gasita.");
    }

    const room = await this.repository.getRoom(ownerId, input.propertyId, input.roomId);
    if (!room) {
      throw new BookingDomainError("NOT_FOUND", "Camera nu a fost gasita.");
    }

    if (requireActive && room.status !== "active") {
      throw new BookingDomainError("NOT_AVAILABLE", "Camera este inactiva.");
    }
  }
}
