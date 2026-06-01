import type { Json, Database } from "@/lib/supabase/database.types";

export type OwnerNotification =
  Database["public"]["Tables"]["owner_notifications"]["Row"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type NotificationStatus = Database["public"]["Enums"]["notification_status"];
export type NotificationPriority = "critical" | "important" | "info";
export type NotificationChannel = "dashboard" | "email" | "dashboard_email";

export type CreateOwnerNotificationInput = {
  ownerId: string;
  propertyId: string;
  bookingId?: string | null;
  conversationId?: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  channel?: NotificationChannel;
  actionUrl?: string | null;
  actionLabel?: string | null;
  dedupeKey?: string | null;
  metadata?: Json;
};

export type NotificationFilters = {
  status?: NotificationStatus;
  priority?: NotificationPriority;
  type?: NotificationType;
  propertyId?: string;
  unreadOnly?: boolean;
};
