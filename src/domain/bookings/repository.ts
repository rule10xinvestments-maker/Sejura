import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";
import type { Database } from "@/lib/supabase/database.types";
import type {
  BookingEventRecord,
  BookingRecord,
  BookingStatus,
  RoomBlockRecord
} from "@/domain/bookings/types";

export type BookingRepository = {
  getProperty(ownerId: string, propertyId: string): Promise<Property | null>;
  getPropertySettings(
    ownerId: string,
    propertyId: string
  ): Promise<Database["public"]["Tables"]["property_settings"]["Row"] | null>;
  getRoom(ownerId: string, propertyId: string, roomId: string): Promise<Room | null>;
  listRooms(ownerId: string, propertyId: string): Promise<Room[]>;
  listBookings(ownerId: string, propertyId?: string): Promise<BookingRecord[]>;
  getBooking(ownerId: string, bookingId: string): Promise<BookingRecord | null>;
  listBookingEvents(ownerId: string, bookingId: string): Promise<BookingEventRecord[]>;
  listBlockingBookings(input: {
    ownerId: string;
    roomId: string;
    startDate: string;
    endDate: string;
    excludeBookingId?: string;
  }): Promise<BookingRecord[]>;
  listRoomBlocks(input: {
    ownerId: string;
    roomId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RoomBlockRecord[]>;
  insertBooking(input: Omit<BookingRecord, "id" | "created_at" | "updated_at">): Promise<BookingRecord>;
  updateBooking(
    ownerId: string,
    bookingId: string,
    patch: Partial<BookingRecord>
  ): Promise<BookingRecord>;
  insertBookingEvent(
    input: Omit<BookingEventRecord, "id" | "created_at">
  ): Promise<BookingEventRecord>;
  insertRoomBlock(
    input: Omit<RoomBlockRecord, "id" | "created_at" | "updated_at">
  ): Promise<RoomBlockRecord>;
  getRoomBlock(ownerId: string, blockId: string): Promise<RoomBlockRecord | null>;
  updateRoomBlock(
    ownerId: string,
    blockId: string,
    patch: Partial<RoomBlockRecord>
  ): Promise<RoomBlockRecord>;
  transitionBookingStatusAtomic?(input: {
    ownerId: string;
    bookingId: string;
    nextStatus: BookingStatus;
    patch: Partial<BookingRecord>;
  }): Promise<BookingRecord>;
};
