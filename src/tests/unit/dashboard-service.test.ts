import { describe, expect, it, vi } from "vitest";
import {
  getOwnerNotificationSummary,
  loadDashboardData
} from "@/domain/dashboard/service";

function failingNotificationSupabase() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          neq: () => ({
            order: () => ({
              limit: async () => ({
                data: null,
                error: new Error("owner_notifications missing")
              })
            })
          })
        })
      })
    })
  } as never;
}

function emptyDashboardSupabase() {
  const emptySingleBuilder = {
    eq: () => emptySingleBuilder,
    order: () => emptySingleBuilder,
    limit: () => emptySingleBuilder,
    maybeSingle: async () => ({ data: null, error: null })
  };
  const emptyListBuilder = {
    eq: () => emptyListBuilder,
    neq: () => emptyListBuilder,
    is: () => emptyListBuilder,
    order: () => emptyListBuilder,
    limit: async () => ({ data: [], error: null })
  };

  return {
    from: (table: string) => ({
      select: () =>
        table === "owner_notifications" || table === "bookings"
          ? emptyListBuilder
          : emptySingleBuilder
    })
  } as never;
}

describe("dashboard service", () => {
  it("returns empty notification summary when owner_notifications query fails", async () => {
    const logger = vi.fn();
    const summary = await getOwnerNotificationSummary(
      failingNotificationSupabase(),
      "owner-1",
      logger
    );

    expect(summary).toEqual({ unreadCount: 0, actionItems: [] });
    expect(logger).toHaveBeenCalledOnce();
  });

  it("renders dashboard data shape with missing property and empty notifications", async () => {
    const data = await loadDashboardData(
      emptyDashboardSupabase(),
      "owner-1",
      null,
      vi.fn()
    );

    expect(data.property).toBeNull();
    expect(data.rooms).toEqual([]);
    expect(data.bookings).toEqual([]);
    expect(data.notifications).toEqual({ unreadCount: 0, actionItems: [] });
    expect(data.activation.ready).toBe(false);
  });
});
