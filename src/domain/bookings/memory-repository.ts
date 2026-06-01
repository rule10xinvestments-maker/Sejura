import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";
import { overlaps } from "@/domain/bookings/date";
import { BookingDomainError } from "@/domain/bookings/errors";
import type { BookingRepository } from "@/domain/bookings/repository";
import type {
  BookingEventRecord,
  BookingRecord,
  RoomBlockRecord
} from "@/domain/bookings/types";
import type { Database } from "@/lib/supabase/database.types";

export class MemoryBookingRepository implements BookingRepository {
  properties: Property[] = [];
  propertySettings: Database["public"]["Tables"]["property_settings"]["Row"][] = [];
  rooms: Room[] = [];
  bookings: BookingRecord[] = [];
  bookingEvents: BookingEventRecord[] = [];
  roomBlocks: RoomBlockRecord[] = [];
  private idCounter = 1;

  constructor(seed?: Partial<MemoryBookingRepository>) {
    Object.assign(this, seed);
  }

  private id(prefix: string) {
    const value = `${prefix}-${this.idCounter}`;
    this.idCounter += 1;
    return value;
  }

  async getProperty(ownerId: string, propertyId: string) {
    return (
      this.properties.find(
        (property) => property.id === propertyId && property.owner_id === ownerId
      ) ?? null
    );
  }

  async getPropertySettings(ownerId: string, propertyId: string) {
    return (
      this.propertySettings.find(
        (settings) =>
          settings.owner_id === ownerId && settings.property_id === propertyId
      ) ?? {
        id: "settings-default",
        owner_id: ownerId,
        property_id: propertyId,
        ai_enabled: false,
        public_booking_enabled: false,
        allow_auto_confirmation: false,
        calendar_required_for_confirmation: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
  }

  async getRoom(ownerId: string, propertyId: string, roomId: string) {
    return (
      this.rooms.find(
        (room) =>
          room.id === roomId &&
          room.owner_id === ownerId &&
          room.property_id === propertyId
      ) ?? null
    );
  }

  async listRooms(ownerId: string, propertyId: string) {
    return this.rooms.filter(
      (room) => room.owner_id === ownerId && room.property_id === propertyId
    );
  }

  async listBookings(ownerId: string) {
    return this.bookings.filter(
      (booking) => booking.owner_id === ownerId && !booking.deleted_at
    );
  }

  async getBooking(ownerId: string, bookingId: string) {
    return (
      this.bookings.find(
        (booking) => booking.id === bookingId && booking.owner_id === ownerId
      ) ?? null
    );
  }

  async listBookingEvents(ownerId: string, bookingId: string) {
    return this.bookingEvents.filter(
      (event) => event.owner_id === ownerId && event.booking_id === bookingId
    );
  }

  async listBlockingBookings(input: {
    ownerId: string;
    roomId: string;
    startDate: string;
    endDate: string;
    excludeBookingId?: string;
  }) {
    return this.bookings.filter((booking) => {
      return (
        booking.owner_id === input.ownerId &&
        booking.room_id === input.roomId &&
        booking.status === "confirmed" &&
        !booking.deleted_at &&
        booking.id !== input.excludeBookingId &&
        overlaps(input.startDate, input.endDate, booking.start_date, booking.end_date)
      );
    });
  }

  async listRoomBlocks(input: {
    ownerId: string;
    roomId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.roomBlocks.filter((block) => {
      const matchesRange =
        input.startDate && input.endDate
          ? overlaps(input.startDate, input.endDate, block.start_date, block.end_date)
          : true;

      return (
        block.owner_id === input.ownerId &&
        !block.deleted_at &&
        (!input.roomId || block.room_id === input.roomId) &&
        (!input.propertyId || block.property_id === input.propertyId) &&
        matchesRange
      );
    });
  }

  async insertBooking(input: Omit<BookingRecord, "id" | "created_at" | "updated_at">) {
    const booking: BookingRecord = {
      ...input,
      id: this.id("booking"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.bookings.push(booking);
    return booking;
  }

  async updateBooking(ownerId: string, bookingId: string, patch: Partial<BookingRecord>) {
    const booking = await this.getBooking(ownerId, bookingId);
    if (!booking) {
      throw new BookingDomainError("NOT_FOUND", "Rezervarea nu a fost gasita.");
    }
    Object.assign(booking, patch, { updated_at: new Date().toISOString() });
    return booking;
  }

  async insertBookingEvent(input: Omit<BookingEventRecord, "id" | "created_at">) {
    const event: BookingEventRecord = {
      ...input,
      id: this.id("event"),
      created_at: new Date().toISOString()
    };
    this.bookingEvents.push(event);
    return event;
  }

  async insertRoomBlock(input: Omit<RoomBlockRecord, "id" | "created_at" | "updated_at">) {
    const block: RoomBlockRecord = {
      ...input,
      id: this.id("block"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.roomBlocks.push(block);
    return block;
  }

  async getRoomBlock(ownerId: string, blockId: string) {
    return (
      this.roomBlocks.find((block) => block.id === blockId && block.owner_id === ownerId) ??
      null
    );
  }

  async updateRoomBlock(ownerId: string, blockId: string, patch: Partial<RoomBlockRecord>) {
    const block = await this.getRoomBlock(ownerId, blockId);
    if (!block) {
      throw new BookingDomainError("NOT_FOUND", "Blocarea nu a fost gasita.");
    }
    Object.assign(block, patch, { updated_at: new Date().toISOString() });
    return block;
  }
}
