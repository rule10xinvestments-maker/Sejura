import type { Json } from "@/lib/supabase/database.types";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "rejected";
export type BookingSource = "ai_chat" | "manual_owner";
export type ActorType = "owner" | "ai" | "system" | "guest";
export type CalendarSyncStatus =
  | "not_required"
  | "pending"
  | "synced"
  | "failed"
  | "needs_reconnect";

export type AuthContext = {
  ownerId: string;
  actorType?: ActorType;
};

export type BookingRecord = {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  guest_notes: string | null;
  start_date: string;
  end_date: string;
  guests_count: number;
  price_per_night: number | null;
  nights_count: number;
  total_estimated_price: number | null;
  currency: string;
  status: BookingStatus;
  source: BookingSource;
  conversation_id: string | null;
  calendar_sync_status: CalendarSyncStatus;
  google_calendar_event_id: string | null;
  calendar_sync_error_code: string | null;
  calendar_sync_error_message: string | null;
  calendar_synced_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  rejected_at: string | null;
  created_by_actor_type: ActorType;
  created_by_owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BookingEventRecord = {
  id: string;
  owner_id: string;
  property_id: string;
  booking_id: string;
  event_type: string;
  actor_type: ActorType;
  actor_owner_id: string | null;
  previous_status: BookingStatus | null;
  new_status: BookingStatus | null;
  metadata: Json;
  created_at: string;
};

export type RoomBlockRecord = {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by_owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AvailabilityInput = {
  propertyId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  guestsCount: number;
  excludeBookingId?: string;
};

export type BookingInput = {
  propertyId: string;
  roomId: string;
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guestNotes?: string | null;
  startDate: string;
  endDate: string;
  guestsCount: number;
  pricePerNight?: number | null;
  source?: BookingSource;
  conversationId?: string | null;
};

export type RoomBlockInput = {
  propertyId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
};

export type RoomBlockUpdateInput = RoomBlockInput & {
  blockId: string;
};
