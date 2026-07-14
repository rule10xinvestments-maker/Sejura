import { BookingDomainError } from "@/domain/bookings/errors";
import type { BookingRepository } from "@/domain/bookings/repository";
import type {
  BookingEventRecord,
  BookingRecord,
  RoomBlockRecord
} from "@/domain/bookings/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";

const ROOM_NOT_AVAILABLE_MESSAGE =
  "Camera nu mai este disponibilă pentru perioada aleasă.";

export class SupabaseBookingRepository implements BookingRepository {
  constructor(private supabase: AppSupabaseClient) {}

  private isOverlapConstraintError(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23P01"
    );
  }

  async getProperty(ownerId: string, propertyId: string) {
    const { data, error } = await this.supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("id", propertyId)
      .maybeSingle();

    if (error) {
      if (this.isOverlapConstraintError(error)) {
        throw new BookingDomainError(
          "NOT_AVAILABLE",
          ROOM_NOT_AVAILABLE_MESSAGE
        );
      }
      throw error;
    }
    return data;
  }

  async getPropertySettings(ownerId: string, propertyId: string) {
    const { data, error } = await this.supabase
      .from("property_settings")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getRoom(ownerId: string, propertyId: string, roomId: string) {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId)
      .eq("id", roomId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listRooms(ownerId: string, propertyId: string) {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async listBookings(ownerId: string, propertyId?: string) {
    let query = this.supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  }

  async getBooking(ownerId: string, bookingId: string) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("id", bookingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listBookingEvents(ownerId: string, bookingId: string) {
    const { data, error } = await this.supabase
      .from("booking_events")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BookingEventRecord[];
  }

  async listBlockingBookings(input: {
    ownerId: string;
    roomId: string;
    startDate: string;
    endDate: string;
    excludeBookingId?: string;
  }) {
    let query = this.supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", input.ownerId)
      .eq("room_id", input.roomId)
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .lt("start_date", input.endDate)
      .gt("end_date", input.startDate);

    if (input.excludeBookingId) {
      query = query.neq("id", input.excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async listRoomBlocks(input: {
    ownerId: string;
    roomId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = this.supabase
      .from("room_blocks")
      .select("*")
      .eq("owner_id", input.ownerId)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (input.roomId) query = query.eq("room_id", input.roomId);
    if (input.propertyId) query = query.eq("property_id", input.propertyId);
    if (input.startDate && input.endDate) {
      query = query.lt("start_date", input.endDate).gt("end_date", input.startDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async insertBooking(input: Omit<BookingRecord, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase
      .from("bookings")
      .insert(input)
      .select("*")
      .single();

    if (error) {
      if (this.isOverlapConstraintError(error)) {
        throw new BookingDomainError(
          "NOT_AVAILABLE",
          ROOM_NOT_AVAILABLE_MESSAGE
        );
      }
      throw error;
    }
    return data;
  }

  async updateBooking(ownerId: string, bookingId: string, patch: Partial<BookingRecord>) {
    const { data, error } = await this.supabase
      .from("bookings")
      .update(patch)
      .eq("owner_id", ownerId)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (error) {
      if (this.isOverlapConstraintError(error)) {
        throw new BookingDomainError(
          "NOT_AVAILABLE",
          ROOM_NOT_AVAILABLE_MESSAGE
        );
      }
      throw new BookingDomainError("NOT_FOUND", "Rezervarea nu a fost gasita.");
    }
    return data;
  }

  async insertBookingEvent(input: Omit<BookingEventRecord, "id" | "created_at">) {
    const { data, error } = await this.supabase
      .from("booking_events")
      .insert(input)
      .select("*")
      .single();

    if (error) throw error;
    return data as BookingEventRecord;
  }

  async insertRoomBlock(input: Omit<RoomBlockRecord, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase
      .from("room_blocks")
      .insert(input)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async getRoomBlock(ownerId: string, blockId: string) {
    const { data, error } = await this.supabase
      .from("room_blocks")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("id", blockId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateRoomBlock(ownerId: string, blockId: string, patch: Partial<RoomBlockRecord>) {
    const { data, error } = await this.supabase
      .from("room_blocks")
      .update(patch)
      .eq("owner_id", ownerId)
      .eq("id", blockId)
      .select("*")
      .single();

    if (error) {
      throw new BookingDomainError("NOT_FOUND", "Blocarea nu a fost gasita.");
    }
    return data;
  }
}
