import type { Database } from "@/lib/supabase/database.types";

export type GoogleCalendarConnection =
  Database["public"]["Tables"]["google_calendar_connections"]["Row"];

export type GoogleCalendarConnectionStatus =
  | "connected"
  | "needs_reconnect"
  | "disconnected"
  | "error";

export type SafeGoogleCalendarConnection = {
  status: GoogleCalendarConnectionStatus;
  google_account_email: string | null;
  calendar_id: string | null;
  calendar_name: string | null;
  last_sync_at: string | null;
  needs_reconnect: boolean;
  last_error_code: string | null;
  last_error_message?: string | null;
};
