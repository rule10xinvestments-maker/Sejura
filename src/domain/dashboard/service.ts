import { getActivationStatus } from "@/domain/activation/service";
import { BookingService, RoomBlockService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { getPrimaryProperty } from "@/domain/properties/service";
import { listRooms } from "@/domain/rooms/service";
import { getPropertySettings } from "@/domain/settings/service";
import type { AppSupabaseClient } from "@/lib/supabase/types";

type SafeLogger = (message: string, error: unknown) => void;

export type DashboardNotificationSummary = {
  unreadCount: number;
  actionItems: Array<{
    id: string;
    title: string;
    href?: string | null;
  }>;
};

export type DashboardData = Awaited<ReturnType<typeof loadDashboardData>>;

const emptyNotifications: DashboardNotificationSummary = {
  unreadCount: 0,
  actionItems: []
};

function serverLog(message: string, error: unknown) {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.warn(`[dashboard] ${message}: ${detail}`);
}

async function safeLoad<T>(
  fallback: T,
  label: string,
  loader: () => Promise<T>,
  logger: SafeLogger
) {
  try {
    return await loader();
  } catch (error) {
    logger(label, error);
    return fallback;
  }
}

type UntypedQueryResult = Promise<{
  data: Array<{ id?: string; title?: string; href?: string | null }> | null;
  error: unknown;
}>;

type UntypedNotificationQuery = {
  eq: (column: string, value: string | boolean) => UntypedNotificationQuery;
  neq: (column: string, value: string) => UntypedNotificationQuery;
  order: (
    column: string,
    options: { ascending: boolean }
  ) => {
    limit: (count: number) => UntypedQueryResult;
  };
};

type UntypedNotificationClient = {
  from: (table: string) => {
    select: (columns: string) => UntypedNotificationQuery;
  };
};

export async function getOwnerNotificationSummary(
  supabase: AppSupabaseClient,
  ownerId: string,
  logger: SafeLogger = serverLog
): Promise<DashboardNotificationSummary> {
  return safeLoad(
    emptyNotifications,
    "owner notification summary failed",
    async () => {
      const client = supabase as unknown as UntypedNotificationClient;
      const { data, error } = await client
        .from("owner_notifications")
        .select("id,title,action_url")
        .eq("owner_id", ownerId)
        .neq("status", "read")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return {
        unreadCount: data?.length ?? 0,
        actionItems: (data ?? []).map(
          (
            item: { id?: string; title?: string; action_url?: string | null },
            index: number
          ) => ({
          id: item.id ?? `notification-${index}`,
          title: item.title ?? "Actiune noua",
          href: item.action_url ?? null
          })
        )
      };
    },
    logger
  );
}

export async function loadDashboardData(
  supabase: AppSupabaseClient,
  ownerId: string,
  logger: SafeLogger = serverLog
) {
  const property = await safeLoad(
    null,
    "primary property failed",
    () => getPrimaryProperty(supabase, ownerId),
    logger
  );

  const rooms = property
    ? await safeLoad(
        [],
        "rooms failed",
        () => listRooms(supabase, ownerId, property.id),
        logger
      )
    : [];

  const settings = property
    ? await safeLoad(
        null,
        "property settings failed",
        () => getPropertySettings(supabase, ownerId, property.id),
        logger
      )
    : null;

  const bookings = await safeLoad(
    [],
    "booking summary failed",
    () =>
      new BookingService(new SupabaseBookingRepository(supabase)).listBookings({
        ownerId
      }),
    logger
  );

  const roomBlocks = property
    ? await safeLoad(
        [],
        "room blocks failed",
        () =>
          new RoomBlockService(new SupabaseBookingRepository(supabase)).listRoomBlocks({
            ownerId
          }),
        logger
      )
    : [];

  const googleConnection = property
    ? await safeLoad(
        null,
        "Google Calendar connection summary failed",
        () => new GoogleCalendarService(supabase).getSafeConnection(ownerId, property.id),
        logger
      )
    : null;

  const notifications = await getOwnerNotificationSummary(supabase, ownerId, logger);
  const activation = getActivationStatus({ property, settings, rooms });

  return {
    property,
    rooms,
    settings,
    bookings,
    roomBlocks,
    googleConnection,
    notifications,
    activation
  };
}
