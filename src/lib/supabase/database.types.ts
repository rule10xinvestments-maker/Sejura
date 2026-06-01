export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      owners: {
        Row: { id: string; email: string | null; created_at: string; updated_at: string };
        Insert: { id: string; email?: string | null };
        Update: { email?: string | null; updated_at?: string };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          status:
            | "draft"
            | "setup_incomplete"
            | "ready_pending_mode"
            | "ready_auto_confirm_mode"
            | "disabled";
          contact_phone: string;
          contact_email: string;
          check_in_time: string;
          check_out_time: string;
          rules: string;
          city: string | null;
          public_description: string | null;
          public_contact_phone: string | null;
          public_contact_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> & {
          owner_id: string;
          name: string;
          slug: string;
          contact_phone: string;
          contact_email: string;
          check_in_time: string;
          check_out_time: string;
          rules: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
        Relationships: [];
      };
      property_settings: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          ai_enabled: boolean;
          public_booking_enabled: boolean;
          allow_auto_confirmation: boolean;
          calendar_required_for_confirmation: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          property_id: string;
          ai_enabled?: boolean;
          public_booking_enabled?: boolean;
          allow_auto_confirmation?: boolean;
          calendar_required_for_confirmation?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["property_settings"]["Row"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          name: string;
          max_guests: number;
          base_price_per_night: number;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          property_id: string;
          name: string;
          max_guests: number;
          base_price_per_night: number;
          status?: "active" | "inactive";
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [];
      };
      property_public_pages: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          is_public: boolean;
          chat_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          property_id: string;
          is_public?: boolean;
          chat_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["property_public_pages"]["Row"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
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
          status: Database["public"]["Enums"]["booking_status"];
          source: Database["public"]["Enums"]["booking_source"];
          conversation_id: string | null;
          calendar_sync_status: Database["public"]["Enums"]["calendar_sync_status"];
          google_calendar_event_id: string | null;
          calendar_sync_error_code: string | null;
          calendar_sync_error_message: string | null;
          calendar_synced_at: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          rejected_at: string | null;
          created_by_actor_type: Database["public"]["Enums"]["audit_actor_type"];
          created_by_owner_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]> & {
          owner_id: string;
          property_id: string;
          room_id: string;
          guest_name: string;
          start_date: string;
          end_date: string;
          guests_count: number;
          nights_count: number;
          source: Database["public"]["Enums"]["booking_source"];
          created_by_actor_type: Database["public"]["Enums"]["audit_actor_type"];
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      booking_events: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          booking_id: string;
          event_type: string;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_owner_id: string | null;
          previous_status: Database["public"]["Enums"]["booking_status"] | null;
          new_status: Database["public"]["Enums"]["booking_status"] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["booking_events"]["Row"]> & {
          owner_id: string;
          property_id: string;
          booking_id: string;
          event_type: string;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
        };
        Update: Partial<Database["public"]["Tables"]["booking_events"]["Row"]>;
        Relationships: [];
      };
      room_blocks: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["room_blocks"]["Row"]> & {
          owner_id: string;
          property_id: string;
          room_id: string;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_blocks"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string | null;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_owner_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          owner_id: string;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          action: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
      google_calendar_connections: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          google_account_email: string | null;
          calendar_id: string | null;
          calendar_name: string | null;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          status: "connected" | "needs_reconnect" | "disconnected" | "error";
          last_sync_at: string | null;
          last_error_code: string | null;
          last_error_message: string | null;
          disconnected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["google_calendar_connections"]["Row"]
        > & {
          owner_id: string;
          property_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["google_calendar_connections"]["Row"]
        >;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          public_session_id: string;
          guest_name: string | null;
          guest_phone: string | null;
          guest_email: string | null;
          guest_language: string | null;
          channel: Database["public"]["Enums"]["conversation_channel"];
          status: Database["public"]["Enums"]["conversation_status"];
          related_booking_id: string | null;
          metadata: Json;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & {
          owner_id: string;
          property_id: string;
          public_session_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          conversation_id: string;
          sender_type: "guest" | "ai" | "owner" | "system" | "tool";
          content: string;
          language: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["conversation_messages"]["Row"]
        > & {
          owner_id: string;
          property_id: string;
          conversation_id: string;
          sender_type: "guest" | "ai" | "owner" | "system" | "tool";
          content: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversation_messages"]["Row"]
        >;
        Relationships: [];
      };
      ai_tool_calls: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          conversation_id: string | null;
          tool_name: string;
          input: Json;
          output: Json | null;
          status: "success" | "failed" | "blocked";
          error_code: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_tool_calls"]["Row"]> & {
          owner_id: string;
          property_id: string;
          tool_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_tool_calls"]["Row"]>;
        Relationships: [];
      };
      owner_notifications: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          booking_id: string | null;
          conversation_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          priority: "critical" | "important" | "info";
          status: Database["public"]["Enums"]["notification_status"];
          title: string;
          body: string;
          channel: "dashboard" | "email" | "dashboard_email";
          action_url: string | null;
          action_label: string | null;
          dedupe_key: string | null;
          metadata: Json;
          sent_at: string | null;
          read_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["owner_notifications"]["Row"]
        > & {
          owner_id: string;
          property_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          priority: "critical" | "important" | "info";
          title: string;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["owner_notifications"]["Row"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "rejected";
      booking_source: "ai_chat" | "manual_owner";
      audit_actor_type: "owner" | "ai" | "system" | "guest";
      calendar_sync_status:
        | "not_required"
        | "pending"
        | "synced"
        | "failed"
        | "needs_reconnect";
      conversation_channel: "web_chat";
      conversation_status:
        | "open"
        | "waiting_for_guest"
        | "waiting_for_owner"
        | "booking_created"
        | "closed"
        | "escalated";
      notification_type:
        | "booking_pending_created"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_rejected"
        | "calendar_sync_failed"
        | "google_token_expired"
        | "google_reconnect_required"
        | "ai_escalation_required"
        | "setup_incomplete"
        | "public_page_enabled"
        | "ai_enabled";
      notification_status: "queued" | "sent" | "failed" | "read";
    };
    CompositeTypes: Record<string, never>;
  };
};
