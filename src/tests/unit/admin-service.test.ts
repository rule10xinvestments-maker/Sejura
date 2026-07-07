import { describe, expect, it } from "vitest";
import { AdminActionError, AdminAuthorizationError } from "@/domain/admin/errors";
import { PlatformAdminService } from "@/domain/admin/service";

type Row = Record<string, unknown>;

function createAdminSupabase(options?: { admin?: boolean; demo?: boolean }) {
  const rows: Record<string, Row[]> = {
    platform_admins: options?.admin
      ? [{ user_id: "admin-1", active: true, created_at: "2026-01-01" }]
      : [],
    platform_admin_audit_logs: [],
    owners: [
      {
        id: "owner-1",
        email: options?.demo ? "demo-owner@example.com" : "real@example.com",
        account_status: "active",
        is_demo: Boolean(options?.demo),
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      }
    ],
    properties: [
      {
        id: "property-1",
        owner_id: "owner-1",
        name: options?.demo ? "Demo Pensiune" : "Pensiune Reală",
        slug: options?.demo ? "demo-pensiune" : "pensiune-reala",
        status: "ready_pending_mode",
        contact_phone: "0700000000",
        contact_email: "owner@example.com",
        check_in_time: "15:00",
        check_out_time: "11:00",
        rules: "Fara fumat.",
        city: "Brasov",
        public_description: null,
        public_contact_phone: null,
        public_contact_email: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      }
    ],
    property_public_pages: [
      {
        id: "page-1",
        owner_id: "owner-1",
        property_id: "property-1",
        is_public: true,
        chat_enabled: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      }
    ],
    rooms: [{ id: "room-1", owner_id: "owner-1", property_id: "property-1" }],
    bookings: [
      {
        id: "booking-1",
        owner_id: "owner-1",
        property_id: "property-1",
        status: "confirmed",
        deleted_at: null
      }
    ],
    conversations: [
      {
        id: "conversation-1",
        owner_id: "owner-1",
        property_id: "property-1",
        status: "open",
        deleted_at: null
      }
    ],
    owner_notifications: [
      {
        id: "notification-1",
        owner_id: "owner-1",
        property_id: "property-1",
        title: "Test",
        status: "queued",
        created_at: "2026-01-01T00:00:00.000Z"
      }
    ]
  };
  const operations: string[] = [];

  function applyFilters(table: string, filters: Array<(row: Row) => boolean>) {
    return (rows[table] ?? []).filter((row) =>
      filters.every((filter) => filter(row))
    );
  }

  function createSelectApi(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    const api = {
      select: () => api,
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return api;
      },
      order: () => api,
      maybeSingle: async () => ({
        data: applyFilters(table, filters)[0] ?? null,
        error: null
      }),
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data: applyFilters(table, filters), error: null }).then(
          resolve
        )
    };
    return api;
  }

  function createUpdateApi(table: string, patch: Row) {
    const filters: Array<(row: Row) => boolean> = [];
    const api = {
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return api;
      },
      then: (resolve: (value: unknown) => void) => {
        applyFilters(table, filters).forEach((row) => Object.assign(row, patch));
        operations.push(`update:${table}`);
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
    };
    return api;
  }

  const client = {
    from: (table: string) => ({
      ...createSelectApi(table),
      update: (patch: Row) => createUpdateApi(table, patch),
      insert: (payload: Row) => {
        rows[table].push({
          id: `${table}-${rows[table].length + 1}`,
          created_at: "2026-01-01T00:00:00.000Z",
          ...payload
        });
        operations.push(`insert:${table}`);
        return Promise.resolve({ data: null, error: null });
      },
      delete: () => {
        operations.push(`delete:${table}`);
        return Promise.resolve({ data: null, error: null });
      }
    })
  } as never;

  return { client, rows, operations };
}

describe("PlatformAdminService", () => {
  it("rejects non-admin access and allows platform admin access", async () => {
    await expect(
      new PlatformAdminService(createAdminSupabase({ admin: false }).client)
        .requirePlatformAdmin("owner-1")
    ).rejects.toBeInstanceOf(AdminAuthorizationError);

    await expect(
      new PlatformAdminService(createAdminSupabase({ admin: true }).client)
        .requirePlatformAdmin("admin-1")
    ).resolves.toBe("admin-1");
  });

  it("lets an admin suspend and reactivate an owner with audit logs", async () => {
    const fake = createAdminSupabase({ admin: true });
    const service = new PlatformAdminService(fake.client);

    await service.setOwnerStatus({
      actorAdminId: "admin-1",
      targetOwnerId: "owner-1",
      status: "suspended",
      reason: "pilot control"
    });
    expect(fake.rows.owners[0].account_status).toBe("suspended");

    await service.setOwnerStatus({
      actorAdminId: "admin-1",
      targetOwnerId: "owner-1",
      status: "active",
      reason: "ok"
    });
    expect(fake.rows.owners[0].account_status).toBe("active");
    expect(fake.rows.platform_admin_audit_logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "owner_suspended" }),
        expect.objectContaining({ action: "owner_active" })
      ])
    );
  });

  it("blocks normal owners from admin mutations", async () => {
    const fake = createAdminSupabase({ admin: false });

    await expect(
      new PlatformAdminService(fake.client).setOwnerStatus({
        actorAdminId: "owner-1",
        targetOwnerId: "owner-1",
        status: "suspended",
        reason: "no"
      })
    ).rejects.toBeInstanceOf(AdminAuthorizationError);
    expect(fake.rows.owners[0].account_status).toBe("active");
  });

  it("disables public page and property without deleting data", async () => {
    const fake = createAdminSupabase({ admin: true });

    await new PlatformAdminService(fake.client).disableProperty({
      actorAdminId: "admin-1",
      propertyId: "property-1",
      reason: "pilot pause"
    });

    expect(fake.rows.properties[0].status).toBe("disabled");
    expect(fake.rows.property_public_pages[0]).toMatchObject({
      is_public: false,
      chat_enabled: false
    });
    expect(fake.operations).not.toContain("delete:properties");
  });

  it("resets demo data only for demo/test targets and audits the action", async () => {
    const real = createAdminSupabase({ admin: true, demo: false });
    await expect(
      new PlatformAdminService(real.client).resetDemoData({
        actorAdminId: "admin-1",
        ownerId: "owner-1",
        propertyId: "property-1",
        confirmation: "RESET",
        reason: "cleanup"
      })
    ).rejects.toBeInstanceOf(AdminActionError);

    const demo = createAdminSupabase({ admin: true, demo: true });
    await new PlatformAdminService(demo.client).resetDemoData({
      actorAdminId: "admin-1",
      ownerId: "owner-1",
      propertyId: "property-1",
      confirmation: "RESET",
      reason: "cleanup"
    });

    expect(demo.rows.bookings[0]).toMatchObject({
      status: "cancelled",
      deleted_at: expect.any(String)
    });
    expect(demo.rows.conversations[0]).toMatchObject({
      status: "closed",
      deleted_at: expect.any(String)
    });
    expect(demo.rows.owner_notifications[0]).toMatchObject({
      status: "read",
      resolved_at: expect.any(String)
    });
    expect(demo.rows.platform_admin_audit_logs).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "demo_data_reset" })])
    );
    expect(demo.operations.some((operation) => operation.startsWith("delete:"))).toBe(false);
  });
});
