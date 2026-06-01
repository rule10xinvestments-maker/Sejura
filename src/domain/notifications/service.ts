import type { BookingRecord } from "@/domain/bookings/types";
import { NoopEmailProvider, type EmailProvider } from "@/domain/notifications/email-provider";
import type {
  CreateOwnerNotificationInput,
  NotificationFilters,
  OwnerNotification
} from "@/domain/notifications/types";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/supabase/types";

type Logger = (message: string, error: unknown) => void;

function serverLog(message: string, error: unknown) {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.warn(`[notifications] ${message}: ${detail}`);
}

function appBaseUrl() {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

async function safeRun<T>(fallback: T, label: string, fn: () => Promise<T>, logger: Logger) {
  try {
    return await fn();
  } catch (error) {
    logger(label, error);
    return fallback;
  }
}

export class NotificationService {
  constructor(
    private supabase: AppSupabaseClient,
    private emailProvider: EmailProvider = new NoopEmailProvider(),
    private logger: Logger = serverLog
  ) {}

  async createOwnerNotification(input: CreateOwnerNotificationInput) {
    await this.assertRelatedOwnership(input);
    const payload = {
      owner_id: input.ownerId,
      property_id: input.propertyId,
      booking_id: input.bookingId ?? null,
      conversation_id: input.conversationId ?? null,
      type: input.type,
      priority: input.priority,
      status: "queued" as const,
      title: input.title,
      body: input.body,
      channel: input.channel ?? "dashboard",
      action_url: input.actionUrl ?? null,
      action_label: input.actionLabel ?? null,
      dedupe_key: input.dedupeKey ?? null,
      metadata: input.metadata ?? {}
    };

    const { data: existing } = input.dedupeKey
      ? await this.supabase
          .from("owner_notifications")
          .select("*")
          .eq("owner_id", input.ownerId)
          .eq("dedupe_key", input.dedupeKey)
          .is("resolved_at", null)
          .maybeSingle()
      : { data: null };

    let notification: OwnerNotification;
    if (existing) {
      const { data, error } = await this.supabase
        .from("owner_notifications")
        .update({
          title: payload.title,
          body: payload.body,
          metadata: payload.metadata,
          status: existing.status === "read" ? "read" : "queued"
        })
        .eq("id", existing.id)
        .eq("owner_id", input.ownerId)
        .select("*")
        .single();
      if (error) throw error;
      notification = data;
    } else {
      const { data, error } = await this.supabase
        .from("owner_notifications")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      notification = data;
    }

    if (notification.channel === "email" || notification.channel === "dashboard_email") {
      await this.sendOwnerEmail(notification.id);
    }

    await this.writeAudit(input.ownerId, input.propertyId, "notification_created", notification.id);
    return notification;
  }

  async markAsRead(ownerId: string, notificationId: string) {
    const { data, error } = await this.supabase
      .from("owner_notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .eq("id", notificationId)
      .select("*")
      .single();
    if (error) throw error;
    await this.writeAudit(ownerId, data.property_id, "notification_read", notificationId);
    return data;
  }

  async markManyAsRead(ownerId: string, notificationIds: string[]) {
    if (notificationIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("owner_notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .in("id", notificationIds)
      .select("*");
    if (error) throw error;
    return data ?? [];
  }

  async resolveNotification(ownerId: string, notificationId: string) {
    const { data, error } = await this.supabase
      .from("owner_notifications")
      .update({ resolved_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .eq("id", notificationId)
      .select("*")
      .single();
    if (error) throw error;
    await this.writeAudit(ownerId, data.property_id, "notification_resolved", notificationId);
    return data;
  }

  async getOwnerNotifications(ownerId: string, filters: NotificationFilters = {}) {
    let query = this.supabase
      .from("owner_notifications")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
    if (filters.unreadOnly) query = query.neq("status", "read");

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getNotificationCounts(ownerId: string) {
    return safeRun(
      { unread: 0, critical: 0, important: 0 },
      "notification counts failed",
      async () => {
        const notifications = await this.getOwnerNotifications(ownerId, {
          unreadOnly: true
        });
        return {
          unread: notifications.length,
          critical: notifications.filter((item) => item.priority === "critical" && !item.resolved_at).length,
          important: notifications.filter((item) => item.priority === "important").length
        };
      },
      this.logger
    );
  }

  async notifyBookingPending(bookingId: string) {
    const booking = await this.getBooking(bookingId);
    return this.createOwnerNotification({
      ownerId: booking.owner_id,
      propertyId: booking.property_id,
      bookingId: booking.id,
      type: "booking_pending_created",
      priority: "important",
      title: "Cerere noua de rezervare in asteptare",
      body: this.bookingBody(booking, "In asteptare"),
      channel: "dashboard_email",
      actionUrl: `/app/bookings/${booking.id}`,
      actionLabel: "Deschide rezervarea",
      dedupeKey: `booking_pending_created:${booking.id}`,
      metadata: { status: "pending" }
    });
  }

  async notifyBookingConfirmed(bookingId: string) {
    const booking = await this.getBooking(bookingId);
    const body =
      booking.calendar_sync_status === "synced"
        ? `${this.bookingBody(booking, "Confirmata")}\nRezervarea a fost adaugata in Google Calendar.`
        : this.bookingBody(booking, "Confirmata");
    const notification = await this.createOwnerNotification({
      ownerId: booking.owner_id,
      propertyId: booking.property_id,
      bookingId: booking.id,
      type: "booking_confirmed",
      priority: "important",
      title: "Rezervare confirmata",
      body,
      channel: "dashboard",
      actionUrl: `/app/bookings/${booking.id}`,
      actionLabel: "Deschide rezervarea",
      dedupeKey: `booking_confirmed:${booking.id}`
    });
    if (booking.calendar_sync_status === "failed" || booking.calendar_sync_status === "needs_reconnect") {
      await this.notifyCalendarSyncFailed(booking.id);
    }
    return notification;
  }

  async notifyBookingRejected(bookingId: string) {
    const booking = await this.getBooking(bookingId);
    return this.createOwnerNotification({
      ownerId: booking.owner_id,
      propertyId: booking.property_id,
      bookingId: booking.id,
      type: "booking_rejected",
      priority: "info",
      title: "Rezervare respinsa",
      body: this.bookingBody(booking, "Respinsa"),
      channel: "dashboard",
      actionUrl: `/app/bookings/${booking.id}`,
      actionLabel: "Deschide rezervarea",
      dedupeKey: `booking_rejected:${booking.id}`
    });
  }

  async notifyBookingCancelled(bookingId: string) {
    const booking = await this.getBooking(bookingId);
    return this.createOwnerNotification({
      ownerId: booking.owner_id,
      propertyId: booking.property_id,
      bookingId: booking.id,
      type: "booking_cancelled",
      priority: "important",
      title: "Rezervare anulata",
      body: this.bookingBody(booking, "Anulata"),
      channel: "dashboard",
      actionUrl: `/app/bookings/${booking.id}`,
      actionLabel: "Deschide rezervarea",
      dedupeKey: `booking_cancelled:${booking.id}`
    });
  }

  async notifyCalendarSyncFailed(bookingId: string) {
    const booking = await this.getBooking(bookingId);
    return this.createOwnerNotification({
      ownerId: booking.owner_id,
      propertyId: booking.property_id,
      bookingId: booking.id,
      type: "calendar_sync_failed",
      priority: "critical",
      title: "Sincronizarea Google Calendar a esuat",
      body: "Rezervarea este salvata in Sejura, dar sincronizarea cu Google Calendar trebuie verificata.",
      channel: "dashboard_email",
      actionUrl: `/app/bookings/${booking.id}`,
      actionLabel: "Reincearca sincronizarea",
      dedupeKey: `calendar_sync_failed:${booking.id}:${booking.calendar_sync_error_code ?? booking.calendar_sync_status}`,
      metadata: {
        calendar_sync_status: booking.calendar_sync_status,
        calendar_sync_error_code: booking.calendar_sync_error_code
      }
    });
  }

  async notifyGoogleReconnectRequired(propertyId: string) {
    const property = await this.getProperty(propertyId);
    return this.createOwnerNotification({
      ownerId: property.owner_id,
      propertyId: property.id,
      type: "google_reconnect_required",
      priority: "critical",
      title: "Google Calendar trebuie reconectat",
      body: "Rezervarile confirmate nu pot fi sincronizate pana cand Google Calendar este reconectat.",
      channel: "dashboard_email",
      actionUrl: "/app/settings/google-calendar",
      actionLabel: "Reconecteaza Google Calendar",
      dedupeKey: `google_reconnect_required:${property.id}`
    });
  }

  async notifyAiEscalation(conversationId: string, summary: string) {
    const conversation = await this.getConversation(conversationId);
    return this.createOwnerNotification({
      ownerId: conversation.owner_id,
      propertyId: conversation.property_id,
      conversationId: conversation.id,
      type: "ai_escalation_required",
      priority: "important",
      title: "Conversatie Jonny necesita atentie",
      body: summary.slice(0, 500),
      channel: "dashboard_email",
      actionUrl: `/app/conversations/${conversation.id}`,
      actionLabel: "Deschide conversatia",
      dedupeKey: `ai_escalation_required:${conversation.id}`
    });
  }

  async sendOwnerEmail(notificationId: string) {
    const { data: notification, error } = await this.supabase
      .from("owner_notifications")
      .select("*")
      .eq("id", notificationId)
      .maybeSingle();
    if (error || !notification) {
      if (error) this.logger("email notification lookup failed", error);
      return { ok: false, errorCode: "NOTIFICATION_NOT_FOUND" };
    }

    await this.writeAudit(notification.owner_id, notification.property_id, "email_send_attempted", notification.id);
    const result = await this.emailProvider.sendOwnerEmail({
      to: null,
      subject: notification.title,
      body: `${notification.body}\n\n${notification.action_url ? `${appBaseUrl()}${notification.action_url}` : ""}`
    });

    if (result.ok) {
      await this.supabase
        .from("owner_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", notification.id)
        .eq("owner_id", notification.owner_id);
      await this.writeAudit(notification.owner_id, notification.property_id, "email_sent", notification.id);
    } else {
      await this.supabase
        .from("owner_notifications")
        .update({
          status: "failed",
          metadata: {
            ...(notification.metadata as Record<string, Json>),
            email_error_code: result.errorCode ?? "EMAIL_FAILED"
          }
        })
        .eq("id", notification.id)
        .eq("owner_id", notification.owner_id);
      await this.writeAudit(notification.owner_id, notification.property_id, "email_failed", notification.id);
    }

    return result;
  }

  private async assertRelatedOwnership(input: CreateOwnerNotificationInput) {
    if (input.bookingId) {
      const booking = await this.getBooking(input.bookingId);
      if (booking.owner_id !== input.ownerId || booking.property_id !== input.propertyId) {
        throw new Error("Booking notification ownership mismatch.");
      }
    }
    if (input.conversationId) {
      const conversation = await this.getConversation(input.conversationId);
      if (conversation.owner_id !== input.ownerId || conversation.property_id !== input.propertyId) {
        throw new Error("Conversation notification ownership mismatch.");
      }
    }
  }

  private async getBooking(bookingId: string): Promise<BookingRecord> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Booking not found.");
    return data;
  }

  private async getConversation(conversationId: string) {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Conversation not found.");
    return data;
  }

  private async getProperty(propertyId: string) {
    const { data, error } = await this.supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Property not found.");
    return data;
  }

  private bookingBody(booking: BookingRecord, statusLabel: string) {
    return [
      `Client: ${booking.guest_name}`,
      `Check-in: ${booking.start_date}`,
      `Check-out: ${booking.end_date}`,
      `Nopti: ${booking.nights_count}`,
      `Oaspeti: ${booking.guests_count}`,
      `Total estimat: ${booking.total_estimated_price ?? "-"} ${booking.currency}`,
      `Sursa: ${booking.source}`,
      `Status: ${statusLabel}`
    ].join("\n");
  }

  private async writeAudit(ownerId: string, propertyId: string, action: string, entityId: string | null) {
    await this.supabase.from("audit_logs").insert({
      owner_id: ownerId,
      property_id: propertyId,
      actor_type: "system",
      actor_owner_id: null,
      action,
      entity_type: "owner_notification",
      entity_id: entityId,
      metadata: {}
    });
  }
}
