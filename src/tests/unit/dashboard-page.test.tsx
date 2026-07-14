import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/(protected)/app/page";

const dashboardMocks = vi.hoisted(() => ({
  getCurrentOwnerId: vi.fn(),
  loadDashboardData: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({}))
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentOwnerId: dashboardMocks.getCurrentOwnerId
}));

vi.mock("@/domain/dashboard/service", () => ({
  loadDashboardData: dashboardMocks.loadDashboardData
}));

vi.mock("@/components/dashboard/room-overview", () => ({
  RoomOverview: () => <section data-testid="room-overview" />
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    dashboardMocks.getCurrentOwnerId.mockResolvedValue("owner-1");
    dashboardMocks.loadDashboardData.mockResolvedValue({
      property: {
        id: "property-1",
        slug: "pensiunea-test",
        check_in_time: "15:00",
        check_out_time: "11:00"
      },
      rooms: [],
      bookings: [],
      roomBlocks: [],
      googleConnection: null,
      notifications: { unreadCount: 0, actionItems: [] },
      activation: { ready: true, missingRequirements: [] }
    });
  });

  it("shows a dashboard shortcut to the internal calendar", async () => {
    render(await DashboardPage({ searchParams: {} }));

    expect(
      screen.getByRole("link", { name: "Vezi calendarul intern" })
    ).toHaveAttribute("href", "/app/calendar?propertyId=property-1");
  });

  it("keeps dashboard shortcuts scoped to the selected property", async () => {
    render(await DashboardPage({ searchParams: { propertyId: "property-1" } }));

    expect(dashboardMocks.loadDashboardData).toHaveBeenCalledWith(
      {},
      "owner-1",
      "property-1"
    );
    expect(screen.getByRole("link", { name: "Camere" })).toHaveAttribute(
      "href",
      "/app/rooms?propertyId=property-1"
    );
    expect(
      screen.getByRole("link", { name: "Vezi calendarul intern" })
    ).toHaveAttribute("href", "/app/calendar?propertyId=property-1");
    expect(screen.getByRole("link", { name: "Rezervari" })).toHaveAttribute(
      "href",
      "/app/bookings?propertyId=property-1"
    );
  });
});
