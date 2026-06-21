import { describe, expect, it } from "vitest";
import {
  keepAutoConfirmationDisabled,
  updatePilotSetting
} from "@/domain/settings/service";

type Row = Record<string, unknown>;

function settingsSupabase() {
  const tables: Record<string, Row[]> = {
    properties: [
      { id: "property-1", owner_id: "owner-1" },
      { id: "property-2", owner_id: "owner-2" }
    ],
    property_settings: [
      {
        id: "settings-1",
        owner_id: "owner-1",
        property_id: "property-1",
        ai_enabled: false,
        public_booking_enabled: false,
        allow_auto_confirmation: true
      },
      {
        id: "settings-2",
        owner_id: "owner-2",
        property_id: "property-2",
        ai_enabled: false,
        public_booking_enabled: false,
        allow_auto_confirmation: false
      }
    ],
    property_public_pages: [
      {
        id: "page-1",
        owner_id: "owner-1",
        property_id: "property-1",
        is_public: false,
        chat_enabled: false
      },
      {
        id: "page-2",
        owner_id: "owner-2",
        property_id: "property-2",
        is_public: false,
        chat_enabled: false
      }
    ]
  };

  function applyFilters(table: string, filters: Array<(row: Row) => boolean>) {
    return tables[table].filter((row) => filters.every((filter) => filter(row)));
  }

  return {
    tables,
    client: {
      from: (table: string) => {
        const filters: Array<(row: Row) => boolean> = [];
        const api = {
          select: () => api,
          eq: (column: string, value: unknown) => {
            filters.push((row) => row[column] === value);
            return api;
          },
          maybeSingle: async () => ({
            data: applyFilters(table, filters)[0] ?? null,
            error: null
          }),
          single: async () => ({
            data: applyFilters(table, filters)[0] ?? null,
            error: applyFilters(table, filters)[0] ? null : new Error("missing row")
          }),
          update: (patch: Row) => {
            const updateApi = {
              eq: (column: string, value: unknown) => {
                filters.push((row) => row[column] === value);
                return updateApi;
              },
              select: () => updateApi,
              single: async () => {
                const row = applyFilters(table, filters)[0] ?? null;
                if (row) Object.assign(row, patch);
                return {
                  data: row,
                  error: row ? null : new Error("missing row")
                };
              },
              then: (resolve: (value: unknown) => void) => {
                applyFilters(table, filters).forEach((row) => Object.assign(row, patch));
                return Promise.resolve({ data: null, error: null }).then(resolve);
              }
            };
            return updateApi;
          }
        };
        return api;
      }
    } as never
  };
}

describe("settings service", () => {
  it("enables and disables AI for the authenticated owner property", async () => {
    const fake = settingsSupabase();

    await updatePilotSetting(
      fake.client,
      "owner-1",
      "property-1",
      "ai_enabled",
      true
    );
    expect(fake.tables.property_settings[0].ai_enabled).toBe(true);

    await updatePilotSetting(
      fake.client,
      "owner-1",
      "property-1",
      "ai_enabled",
      false
    );
    expect(fake.tables.property_settings[0].ai_enabled).toBe(false);
  });

  it("enables and disables public bookings and public page flags", async () => {
    const fake = settingsSupabase();

    await updatePilotSetting(
      fake.client,
      "owner-1",
      "property-1",
      "public_booking_enabled",
      true
    );
    expect(fake.tables.property_settings[0].public_booking_enabled).toBe(true);
    expect(fake.tables.property_public_pages[0]).toMatchObject({
      is_public: true,
      chat_enabled: true
    });

    await updatePilotSetting(
      fake.client,
      "owner-1",
      "property-1",
      "public_booking_enabled",
      false
    );
    expect(fake.tables.property_settings[0].public_booking_enabled).toBe(false);
    expect(fake.tables.property_public_pages[0]).toMatchObject({
      is_public: false,
      chat_enabled: false
    });
  });

  it("blocks cross-owner settings updates", async () => {
    const fake = settingsSupabase();

    await expect(
      updatePilotSetting(
        fake.client,
        "owner-1",
        "property-2",
        "ai_enabled",
        true
      )
    ).rejects.toThrow("Proprietatea nu a fost gasita.");

    expect(fake.tables.property_settings[1].ai_enabled).toBe(false);
  });

  it("keeps auto-confirmation disabled for pilot", async () => {
    const fake = settingsSupabase();

    await keepAutoConfirmationDisabled(fake.client, "owner-1", "property-1");

    expect(fake.tables.property_settings[0].allow_auto_confirmation).toBe(false);
  });
});
