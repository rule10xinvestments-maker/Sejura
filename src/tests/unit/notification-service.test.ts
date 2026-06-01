import { describe, expect, it } from "vitest";
import { NotificationService } from "@/domain/notifications/service";
import type { EmailProvider } from "@/domain/notifications/email-provider";

type Row = Record<string, unknown>;

function createFakeSupabase(seed?: Partial<Record<string, Row[]>>) {
  const tables: Record<string, Row[]> = {
    owner_notifications: [],
    bookings: [],
    conversations: [],
    properties: [],
    audit_logs: [],
    ...seed
  };

  function builder(table: string) {
    let filters: Array<(row: Row) => boolean> = [];
    let patch: Row | null = null;

    const api = {
      select: () => api,
      insert: (payload: Row) => {
        const row = {
          id: payload.id ?? `${table}-${tables[table].length + 1}`,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          resolved_at: null,
          read_at: null,
          sent_at: null,
          ...payload
        };
        tables[table].push(row);
        return {
          select: () => ({
            single: async () => ({ data: row, error: null })
          })
        };
      },
      update: (payload: Row) => {
        patch = payload;
        return api;
      },
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return api;
      },
      neq: (column: string, value: unknown) => {
        filters.push((row) => row[column] !== value);
        return api;
      },
      is: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return api;
      },
      in: (column: string, values: unknown[]) => {
        filters.push((row) => values.includes(row[column]));
        return api;
      },
      order: () => api,
      maybeSingle: async () => ({
        data: tables[table].find((row) => filters.every((filter) => filter(row))) ?? null,
        error: null
      }),
      single: async () => {
        const row = tables[table].find((item) =>
          filters.every((filter) => filter(item))
        );
        if (row && patch) Object.assign(row, patch);
        return { data: row ?? null, error: row ? null : new Error("not found") };
      },
      then: undefined,
      execute: async () => {
        const rows = tables[table].filter((row) =>
          filters.every((filter) => filter(row))
        );
        if (patch) rows.forEach((row) => Object.assign(row, patch));
        return { data: rows, error: null };
      }
    };

    Object.defineProperty(api, "then", {
      value: (resolve: (value: unknown) => void) => api.execute().then(resolve),
      configurable: true
    });

    return api;
  }

  return {
    tables,
    client: {
      from: (table: string) => builder(table)
    } as never
  };
}

const booking = {
  id: "booking-1",
  owner_id: "owner-1",
  property_id: "property-1",
  room_id: "room-1",
  guest_name: "Ana",
  start_date: "2026-07-01",
  end_date: "2026-07-03",
  nights_count: 2,
  guests_count: 2,
  total_estimated_price: 500,
  currency: "RON",
  source: "ai_chat",
  calendar_sync_status: "not_required",
  calendar_sync_error_code: null
};

const conversation = {
  id: "conversation-1",
  owner_id: "owner-1",
  property_id: "property-1"
};

describe("NotificationService", () => {
  it("creates and deduplicates owner notifications", async () => {
    const { client, tables } = createFakeSupabase({
      bookings: [booking]
    });
    const service = new NotificationService(client);

    await service.notifyBookingPending("booking-1");
    await service.notifyBookingPending("booking-1");

    expect(tables.owner_notifications).toHaveLength(1);
    expect(tables.owner_notifications[0].type).toBe("booking_pending_created");
    expect(tables.owner_notifications[0].body).toContain("Status: In asteptare");
  });

  it("email failure leaves dashboard notification saved", async () => {
    const provider: EmailProvider = {
      sendOwnerEmail: async () => ({
        ok: false,
        skipped: true,
        errorCode: "EMAIL_PROVIDER_NOT_CONFIGURED"
      })
    };
    const { client, tables } = createFakeSupabase({
      bookings: [booking]
    });

    await new NotificationService(client, provider).notifyBookingPending("booking-1");

    expect(tables.owner_notifications).toHaveLength(1);
    expect(tables.owner_notifications[0].status).toBe("failed");
    expect(JSON.stringify(tables.owner_notifications[0])).toContain(
      "EMAIL_PROVIDER_NOT_CONFIGURED"
    );
  });

  it("marks only owner notification as read and returns counts", async () => {
    const { client } = createFakeSupabase({
      owner_notifications: [
        {
          id: "n1",
          owner_id: "owner-1",
          property_id: "property-1",
          priority: "critical",
          status: "queued",
          resolved_at: null
        },
        {
          id: "n2",
          owner_id: "owner-2",
          property_id: "property-2",
          priority: "critical",
          status: "queued",
          resolved_at: null
        }
      ]
    });
    const service = new NotificationService(client);

    await service.markAsRead("owner-1", "n1");
    const counts = await service.getNotificationCounts("owner-1");

    expect(counts.unread).toBe(0);
    await expect(service.markAsRead("owner-1", "n2")).rejects.toThrow();
  });

  it("links AI escalation notification to the conversation owner", async () => {
    const { client, tables } = createFakeSupabase({
      conversations: [conversation]
    });

    await new NotificationService(client).notifyAiEscalation(
      "conversation-1",
      "Clientul cere o exceptie."
    );

    expect(tables.owner_notifications[0].owner_id).toBe("owner-1");
    expect(tables.owner_notifications[0].conversation_id).toBe("conversation-1");
    expect(tables.owner_notifications[0].type).toBe("ai_escalation_required");
  });
});
