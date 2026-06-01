import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { encryptGoogleToken, decryptGoogleToken } from "@/domain/google-calendar/crypto";
import {
  GoogleCalendarError,
  ownerSafeGoogleCalendarMessage,
  type GoogleCalendarErrorCode
} from "@/domain/google-calendar/errors";
import type {
  GoogleCalendarConnection,
  SafeGoogleCalendarConnection
} from "@/domain/google-calendar/types";
import type { BookingRecord } from "@/domain/bookings/types";
import { NotificationService } from "@/domain/notifications/service";
import type { AppSupabaseClient } from "@/lib/supabase/types";

type GoogleFetch = typeof fetch;

type OAuthState = {
  ownerId: string;
  propertyId: string;
  nonce: string;
  issuedAt: number;
  redirectTarget: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
};

type GoogleEventResponse = {
  id?: string;
  error?: { code?: number; message?: string; status?: string };
};

const oauthStateMaxAgeMs = 10 * 60 * 1000;
const calendarScope = "https://www.googleapis.com/auth/calendar.events";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured.`);
  }
  return value;
}

function signStatePayload(payload: string) {
  return createHmac("sha256", requireEnv("GOOGLE_TOKEN_ENCRYPTION_KEY"))
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function encodeState(state: OAuthState) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${signStatePayload(payload)}`;
}

function decodeState(state: string): OAuthState {
  const [payload, signature] = state.split(".");
  if (!payload || !signature || !safeEqual(signature, signStatePayload(payload))) {
    throw new GoogleCalendarError(
      "GOOGLE_OAUTH_STATE_INVALID",
      "Starea OAuth Google este invalida."
    );
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
  if (Date.now() - parsed.issuedAt > oauthStateMaxAgeMs) {
    throw new GoogleCalendarError(
      "GOOGLE_OAUTH_STATE_INVALID",
      "Starea OAuth Google a expirat."
    );
  }
  return parsed;
}

function safeRedirectTarget(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app/settings/google-calendar";
  }
  return value;
}

function toSafeConnection(
  connection: GoogleCalendarConnection | null
): SafeGoogleCalendarConnection {
  return {
    status: connection?.status ?? "disconnected",
    google_account_email: connection?.google_account_email ?? null,
    calendar_id: connection?.calendar_id ?? "primary",
    calendar_name: connection?.calendar_name ?? "Calendar principal",
    last_sync_at: connection?.last_sync_at ?? null,
    needs_reconnect: connection?.status === "needs_reconnect",
    last_error_code: connection?.last_error_code ?? null,
    last_error_message: connection?.last_error_message
      ? ownerSafeGoogleCalendarMessage(connection.last_error_code)
      : null
  };
}

export class GoogleCalendarService {
  constructor(
    private supabase: AppSupabaseClient,
    private googleFetch: GoogleFetch = fetch
  ) {}

  async buildOAuthUrl(ownerId: string, propertyId: string, redirectTarget?: string) {
    await this.assertPropertyOwned(ownerId, propertyId);
    const connection = await this.getConnection(ownerId, propertyId);
    const state = encodeState({
      ownerId,
      propertyId,
      nonce: randomBytes(16).toString("base64url"),
      issuedAt: Date.now(),
      redirectTarget: safeRedirectTarget(redirectTarget)
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", requireEnv("GOOGLE_CLIENT_ID"));
    url.searchParams.set("redirect_uri", requireEnv("GOOGLE_CALENDAR_REDIRECT_URI"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", calendarScope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("include_granted_scopes", "true");
    if (!connection?.refresh_token_encrypted) {
      url.searchParams.set("prompt", "consent");
    }
    url.searchParams.set("state", state);

    return url.toString();
  }

  async handleOAuthCallback(code: string, state: string) {
    const parsedState = decodeState(state);
    await this.assertPropertyOwned(parsedState.ownerId, parsedState.propertyId);
    const tokenResponse = await this.exchangeCodeForTokens(code);
    const scopes = tokenResponse.scope?.split(" ") ?? [calendarScope];

    if (!tokenResponse.access_token || !scopes.includes(calendarScope)) {
      throw new GoogleCalendarError(
        "GOOGLE_INSUFFICIENT_SCOPES",
        "Google Calendar nu a acordat permisiunile necesare."
      );
    }

    const existing = await this.getConnection(parsedState.ownerId, parsedState.propertyId);
    const refreshToken =
      tokenResponse.refresh_token ??
      (existing?.refresh_token_encrypted
        ? decryptGoogleToken(existing.refresh_token_encrypted)
        : null);

    if (!refreshToken) {
      throw new GoogleCalendarError(
        "GOOGLE_REFRESH_TOKEN_MISSING",
        "Google Calendar trebuie reconectat."
      );
    }

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null;

    const { error } = await this.supabase.from("google_calendar_connections").upsert(
      {
        owner_id: parsedState.ownerId,
        property_id: parsedState.propertyId,
        google_account_email: null,
        calendar_id: "primary",
        calendar_name: "Calendar principal",
        access_token_encrypted: encryptGoogleToken(tokenResponse.access_token),
        refresh_token_encrypted: encryptGoogleToken(refreshToken),
        token_expires_at: expiresAt,
        scopes,
        status: "connected",
        last_error_code: null,
        last_error_message: null,
        disconnected_at: null
      },
      { onConflict: "property_id" }
    );

    if (error) {
      throw error;
    }

    await this.writeAudit(parsedState.ownerId, parsedState.propertyId, "google_calendar_connected", "google_calendar_connection", null);
    return parsedState.redirectTarget;
  }

  async getConnection(ownerId: string, propertyId: string) {
    await this.assertPropertyOwned(ownerId, propertyId);
    const { data, error } = await this.supabase
      .from("google_calendar_connections")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getSafeConnection(ownerId: string, propertyId: string) {
    return toSafeConnection(await this.getConnection(ownerId, propertyId));
  }

  async refreshAccessToken(connectionId: string) {
    const connection = await this.getConnectionById(connectionId);
    if (!connection?.refresh_token_encrypted) {
      await this.markNeedsReconnect(connectionId, "GOOGLE_REFRESH_TOKEN_MISSING", "Google Calendar trebuie reconectat.");
      throw new GoogleCalendarError(
        "GOOGLE_REFRESH_TOKEN_MISSING",
        "Google Calendar trebuie reconectat."
      );
    }

    const response = await this.googleFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requireEnv("GOOGLE_CLIENT_ID"),
        client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: decryptGoogleToken(connection.refresh_token_encrypted)
      })
    });
    const tokenResponse = (await response.json()) as TokenResponse;

    if (!response.ok || !tokenResponse.access_token) {
      await this.markNeedsReconnect(connectionId, "GOOGLE_TOKEN_REFRESH_FAILED", "Google Calendar trebuie reconectat.");
      throw new GoogleCalendarError(
        "GOOGLE_TOKEN_REFRESH_FAILED",
        "Google Calendar trebuie reconectat."
      );
    }

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null;

    const { data, error } = await this.supabase
      .from("google_calendar_connections")
      .update({
        access_token_encrypted: encryptGoogleToken(tokenResponse.access_token),
        token_expires_at: expiresAt,
        status: "connected",
        last_error_code: null,
        last_error_message: null
      })
      .eq("id", connectionId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async listCalendars(ownerId: string, propertyId: string) {
    await this.requireConnectedConnection(ownerId, propertyId);
    return [{ id: "primary", summary: "Calendar principal" }];
  }

  async setSelectedCalendar(ownerId: string, propertyId: string, calendarId: string) {
    await this.assertPropertyOwned(ownerId, propertyId);
    const { data, error } = await this.supabase
      .from("google_calendar_connections")
      .update({
        calendar_id: calendarId || "primary",
        calendar_name: calendarId === "primary" ? "Calendar principal" : calendarId
      })
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId)
      .select("*")
      .single();

    if (error) throw error;
    return toSafeConnection(data);
  }

  async testConnection(ownerId: string, propertyId: string) {
    await this.requireConnectedConnection(ownerId, propertyId);
    return { ok: true };
  }

  async createBookingEvent(ownerId: string, bookingId: string) {
    const context = await this.getBookingContext(ownerId, bookingId);
    if (context.booking.google_calendar_event_id) {
      return this.updateBookingEvent(ownerId, bookingId);
    }

    const event = await this.sendGoogleEvent(
      context.connection,
      context.booking,
      context.property,
      context.room,
      false
    );

    if (!event.id) {
      throw new GoogleCalendarError(
        "GOOGLE_EVENT_CREATE_FAILED",
        "Google Calendar nu a putut crea evenimentul."
      );
    }

    await this.saveBookingSync(ownerId, bookingId, {
      google_calendar_event_id: event.id,
      calendar_sync_status: "synced",
      calendar_synced_at: new Date().toISOString(),
      calendar_sync_error_code: null,
      calendar_sync_error_message: null
    });
    await this.markConnectionSynced(context.connection.id);
    await this.writeAudit(ownerId, context.booking.property_id, "google_calendar_event_created", "booking", bookingId);
    return { eventId: event.id, status: "synced" as const, syncedAt: new Date().toISOString(), errorCode: null, errorMessage: null };
  }

  async updateBookingEvent(ownerId: string, bookingId: string) {
    const context = await this.getBookingContext(ownerId, bookingId);
    const event = await this.sendGoogleEvent(
      context.connection,
      context.booking,
      context.property,
      context.room,
      false
    );
    const eventId = context.booking.google_calendar_event_id ?? event.id ?? null;

    await this.saveBookingSync(ownerId, bookingId, {
      google_calendar_event_id: eventId,
      calendar_sync_status: "synced",
      calendar_synced_at: new Date().toISOString(),
      calendar_sync_error_code: null,
      calendar_sync_error_message: null
    });
    await this.markConnectionSynced(context.connection.id);
    await this.writeAudit(ownerId, context.booking.property_id, "google_calendar_event_updated", "booking", bookingId);
    return { eventId, status: "synced" as const, syncedAt: new Date().toISOString(), errorCode: null, errorMessage: null };
  }

  async markBookingEventCancelled(ownerId: string, bookingId: string) {
    const context = await this.getBookingContext(ownerId, bookingId);
    if (!context.booking.google_calendar_event_id) {
      return { eventId: null, status: "not_required" as const, syncedAt: null, errorCode: null, errorMessage: null };
    }

    await this.sendGoogleEvent(context.connection, context.booking, context.property, context.room, true);
    await this.saveBookingSync(ownerId, bookingId, {
      calendar_sync_status: "synced",
      calendar_synced_at: new Date().toISOString(),
      calendar_sync_error_code: null,
      calendar_sync_error_message: null
    });
    await this.markConnectionSynced(context.connection.id);
    await this.writeAudit(ownerId, context.booking.property_id, "google_calendar_event_cancelled", "booking", bookingId);
    return { eventId: context.booking.google_calendar_event_id, status: "synced" as const, syncedAt: new Date().toISOString(), errorCode: null, errorMessage: null };
  }

  async retryBookingSync(ownerId: string, bookingId: string) {
    const booking = await this.getOwnedBooking(ownerId, bookingId);
    if (booking.status !== "confirmed") {
      throw new GoogleCalendarError(
        "GOOGLE_EVENT_UPDATE_FAILED",
        "Doar rezervarile confirmate pot fi sincronizate."
      );
    }

    return booking.google_calendar_event_id
      ? this.updateBookingEvent(ownerId, bookingId)
      : this.createBookingEvent(ownerId, bookingId);
  }

  async disconnect(ownerId: string, propertyId: string) {
    await this.assertPropertyOwned(ownerId, propertyId);
    const { error } = await this.supabase
      .from("google_calendar_connections")
      .update({
        status: "disconnected",
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
        disconnected_at: new Date().toISOString()
      })
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId);

    if (error) throw error;
    await this.writeAudit(ownerId, propertyId, "google_calendar_disconnected", "google_calendar_connection", null);
  }

  async markNeedsReconnect(
    connectionId: string,
    code: GoogleCalendarErrorCode,
    message: string
  ) {
    const connection = await this.getConnectionById(connectionId);
    const { error } = await this.supabase
      .from("google_calendar_connections")
      .update({
        status: "needs_reconnect",
        last_error_code: code,
        last_error_message: ownerSafeGoogleCalendarMessage(code)
      })
      .eq("id", connectionId);

    if (error) throw error;
    if (connection) {
      try {
        await new NotificationService(this.supabase).notifyGoogleReconnectRequired(
          connection.property_id
        );
      } catch {
        // Notification failures must never break calendar error handling.
      }
    }
  }

  async syncConfirmedBooking(ownerId: string, bookingId: string) {
    return this.createBookingEvent(ownerId, bookingId);
  }

  async markCancelledBooking(ownerId: string, bookingId: string) {
    return this.markBookingEventCancelled(ownerId, bookingId);
  }

  private async exchangeCodeForTokens(code: string) {
    const response = await this.googleFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: requireEnv("GOOGLE_CLIENT_ID"),
        client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
        redirect_uri: requireEnv("GOOGLE_CALENDAR_REDIRECT_URI"),
        grant_type: "authorization_code"
      })
    });
    const tokenResponse = (await response.json()) as TokenResponse;

    if (!response.ok || tokenResponse.error) {
      throw new GoogleCalendarError(
        "GOOGLE_TOKEN_EXCHANGE_FAILED",
        "Google Calendar nu a putut fi conectat."
      );
    }
    return tokenResponse;
  }

  private async requireConnectedConnection(ownerId: string, propertyId: string) {
    const connection = await this.getConnection(ownerId, propertyId);
    if (!connection || connection.status === "disconnected") {
      throw new GoogleCalendarError(
        "GOOGLE_CALENDAR_DISCONNECTED",
        "Google Calendar este deconectat."
      );
    }
    if (connection.status === "needs_reconnect" || !connection.refresh_token_encrypted) {
      throw new GoogleCalendarError(
        "GOOGLE_RECONNECT_REQUIRED",
        "Google Calendar trebuie reconectat."
      );
    }
    return connection;
  }

  private async getConnectionById(connectionId: string) {
    const { data, error } = await this.supabase
      .from("google_calendar_connections")
      .select("*")
      .eq("id", connectionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  private async getBookingContext(ownerId: string, bookingId: string) {
    const booking = await this.getOwnedBooking(ownerId, bookingId);
    const { data: property, error: propertyError } = await this.supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("id", booking.property_id)
      .single();
    if (propertyError) throw propertyError;

    const { data: room, error: roomError } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("property_id", booking.property_id)
      .eq("id", booking.room_id)
      .single();
    if (roomError) throw roomError;

    const connection = await this.requireConnectedConnection(ownerId, booking.property_id);
    return { booking, property, room, connection };
  }

  private async getOwnedBooking(ownerId: string, bookingId: string) {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("id", bookingId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.deleted_at) {
      throw new GoogleCalendarError(
        "GOOGLE_EVENT_UPDATE_FAILED",
        "Rezervarea nu a fost gasita."
      );
    }
    return data;
  }

  private async assertPropertyOwned(ownerId: string, propertyId: string) {
    const { data, error } = await this.supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("id", propertyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new GoogleCalendarError(
        "GOOGLE_CALENDAR_NOT_FOUND",
        "Proprietatea nu a fost gasita."
      );
    }
  }

  private async sendGoogleEvent(
    connection: GoogleCalendarConnection,
    booking: BookingRecord,
    property: { name: string; check_in_time: string; check_out_time: string },
    room: { name: string },
    cancelled: boolean
  ) {
    const accessToken = await this.ensureAccessToken(connection);
    const eventId = booking.google_calendar_event_id;
    const calendarId = encodeURIComponent(connection.calendar_id ?? "primary");
    const endpoint = eventId
      ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`
      : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
    const response = await this.googleFetch(endpoint, {
      method: eventId ? "PATCH" : "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(this.buildEventPayload(booking, property, room, cancelled))
    });
    const googleEvent = (await response.json()) as GoogleEventResponse;

    if (!response.ok) {
      await this.handleGoogleEventError(connection.id, response.status);
    }

    return googleEvent;
  }

  private async ensureAccessToken(connection: GoogleCalendarConnection) {
    if (!connection.access_token_encrypted) {
      const refreshed = await this.refreshAccessToken(connection.id);
      return decryptGoogleToken(refreshed.access_token_encrypted ?? "");
    }

    const expiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at).getTime()
      : 0;
    if (expiresAt && expiresAt - Date.now() > 60_000) {
      return decryptGoogleToken(connection.access_token_encrypted);
    }

    const refreshed = await this.refreshAccessToken(connection.id);
    return decryptGoogleToken(refreshed.access_token_encrypted ?? "");
  }

  private buildEventPayload(
    booking: BookingRecord,
    property: { name: string; check_in_time: string; check_out_time: string },
    room: { name: string },
    cancelled: boolean
  ) {
    const titlePrefix = cancelled ? "ANULAT - Rezervare" : "Rezervare";
    const description = cancelled
      ? "Aceasta rezervare a fost anulata in Sejura."
      : [
          "Rezervare confirmata",
          "",
          `Pensiune: ${property.name}`,
          `Camera: ${room.name}`,
          `Client: ${booking.guest_name}`,
          `Telefon: ${booking.guest_phone ?? "-"}`,
          `Email: ${booking.guest_email ?? "-"}`,
          `Persoane: ${booking.guests_count}`,
          `Check-in: ${booking.start_date} ${property.check_in_time}`,
          `Check-out: ${booking.end_date} ${property.check_out_time}`,
          `Nopti: ${booking.nights_count}`,
          `Total estimat: ${booking.total_estimated_price ?? "-"} ${booking.currency}`,
          `Sursa: ${booking.source}`,
          `ID rezervare: ${booking.id}`,
          "",
          "Creat automat de Sejura."
        ].join("\n");

    return {
      summary: `${titlePrefix} - ${room.name} - ${booking.guest_name}`,
      description,
      start: { date: booking.start_date },
      end: { date: booking.end_date }
    };
  }

  private async handleGoogleEventError(connectionId: string, status: number): Promise<never> {
    if (status === 401 || status === 403) {
      await this.markNeedsReconnect(
        connectionId,
        "GOOGLE_RECONNECT_REQUIRED",
        "Google Calendar trebuie reconectat."
      );
      throw new GoogleCalendarError(
        "GOOGLE_RECONNECT_REQUIRED",
        "Google Calendar trebuie reconectat."
      );
    }
    if (status === 429) {
      throw new GoogleCalendarError(
        "GOOGLE_RATE_LIMITED",
        "Google Calendar este temporar indisponibil."
      );
    }
    throw new GoogleCalendarError(
      status >= 500 ? "GOOGLE_NETWORK_ERROR" : "GOOGLE_EVENT_CREATE_FAILED",
      "Google Calendar nu a putut fi sincronizat."
    );
  }

  private async saveBookingSync(
    ownerId: string,
    bookingId: string,
    patch: Partial<BookingRecord>
  ) {
    const { error } = await this.supabase
      .from("bookings")
      .update(patch)
      .eq("owner_id", ownerId)
      .eq("id", bookingId);

    if (error) throw error;
  }

  private async markConnectionSynced(connectionId: string) {
    const { error } = await this.supabase
      .from("google_calendar_connections")
      .update({
        status: "connected",
        last_sync_at: new Date().toISOString(),
        last_error_code: null,
        last_error_message: null
      })
      .eq("id", connectionId);

    if (error) throw error;
  }

  private async writeAudit(
    ownerId: string,
    propertyId: string,
    action: string,
    entityType: string,
    entityId: string | null
  ) {
    await this.supabase.from("audit_logs").insert({
      owner_id: ownerId,
      property_id: propertyId,
      actor_type: "owner",
      actor_owner_id: ownerId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: {}
    });
  }
}
