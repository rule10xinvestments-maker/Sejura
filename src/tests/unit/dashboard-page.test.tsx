import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/(protected)/app/page";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";

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

function property(patch: Partial<Property> = {}): Property {
  return {
    id: "property-1",
    owner_id: "owner-1",
    name: "Pensiunea Test",
    slug: "pensiunea-test",
    status: "ready_pending_mode",
    contact_phone: "0700000000",
    contact_email: "test@sejura.ro",
    check_in_time: "15:00",
    check_out_time: "11:00",
    rules: "",
    city: "Brașov",
    public_description: null,
    public_contact_phone: null,
    public_contact_email: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

function room(patch: Partial<Room> = {}): Room {
  return {
    id: "room-1",
    owner_id: "owner-1",
    property_id: "property-1",
    name: "Camera Verde",
    max_guests: 2,
    base_price_per_night: 220,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

function booking(patch: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "booking-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    guest_name: "Ana Pop",
    guest_phone: "0700000000",
    guest_email: null,
    guest_notes: null,
    start_date: "2026-09-14",
    end_date: "2026-09-17",
    guests_count: 2,
    price_per_night: 220,
    nights_count: 2,
    total_estimated_price: 440,
    currency: "RON",
    status: "confirmed",
    source: "manual_owner",
    conversation_id: null,
    calendar_sync_status: "not_required",
    google_calendar_event_id: null,
    calendar_sync_error_code: null,
    calendar_sync_error_message: null,
    calendar_synced_at: null,
    confirmed_at: "2026-09-10T00:00:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-09-10T00:00:00.000Z",
    updated_at: "2026-09-10T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function block(patch: Partial<RoomBlockRecord> = {}): RoomBlockRecord {
  return {
    id: "block-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-blocked",
    start_date: "2026-09-14",
    end_date: "2026-09-17",
    reason: "Renovare",
    created_by_owner_id: "owner-1",
    created_at: "2026-09-10T00:00:00.000Z",
    updated_at: "2026-09-10T00:00:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function panelById(id: string) {
  const panel = document.getElementById(id);
  if (!panel) {
    throw new Error(`Missing panel ${id}`);
  }

  return panel;
}

describe("DashboardPage", () => {
  beforeEach(() => {
    dashboardMocks.getCurrentOwnerId.mockResolvedValue("owner-1");
    dashboardMocks.loadDashboardData.mockResolvedValue({
      property: property(),
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
    expect(screen.getByRole("link", { name: "Continua configurarea" })).toHaveAttribute(
      "href",
      "/app/property?propertyId=property-1"
    );
  });

  it("turns dashboard cards into tappable panels with selected property details", async () => {
    render(await DashboardPage({ searchParams: { propertyId: "property-1" } }));

    expect(screen.queryByRole("heading", { name: "Detalii proprietate" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Proprietate/ }));

    expect(screen.getByRole("heading", { name: "Detalii proprietate" })).toBeVisible();
    expect(screen.getByText("Pensiunea Test")).toBeVisible();
    expect(screen.getByText("Brașov")).toBeVisible();
    expect(screen.getByText("Personal: nesetat")).toBeVisible();
    expect(screen.getByRole("link", { name: "Pagina publică" })).toHaveAttribute(
      "href",
      "/p/pensiunea-test"
    );

    fireEvent.click(screen.getByRole("button", { name: /Camere active/ }));

    expect(screen.queryByRole("heading", { name: "Detalii proprietate" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Camere active" })).toBeVisible();
  });

  it("shows Sejura availability details from confirmed bookings and room blocks", async () => {
    dashboardMocks.loadDashboardData.mockResolvedValue({
      property: property(),
      rooms: [
        room({ id: "room-occupied", name: "Camera Ocupată" }),
        room({ id: "room-future", name: "Camera Viitoare" }),
        room({ id: "room-pending", name: "Camera Cerere" }),
        room({ id: "room-blocked", name: "Camera Blocată" }),
        room({
          id: "room-other-property",
          property_id: "property-2",
          name: "Camera Altă Proprietate"
        })
      ],
      bookings: [
        booking({
          id: "booking-current",
          room_id: "room-occupied",
          guest_name: "Ana Pop"
        }),
        booking({
          id: "booking-future",
          room_id: "room-future",
          guest_name: "Mihai Ionescu",
          start_date: "2026-09-20",
          end_date: "2026-09-22"
        }),
        booking({
          id: "booking-pending",
          room_id: "room-pending",
          guest_name: "Ioana Marin",
          status: "pending",
          confirmed_at: null
        }),
        booking({
          id: "booking-cancelled",
          room_id: "room-pending",
          guest_name: "Anulat",
          status: "cancelled",
          cancelled_at: "2026-09-11T00:00:00.000Z"
        }),
        booking({
          id: "booking-rejected",
          room_id: "room-pending",
          guest_name: "Respins",
          status: "rejected",
          rejected_at: "2026-09-11T00:00:00.000Z"
        }),
        booking({
          id: "booking-other-property",
          property_id: "property-2",
          room_id: "room-other-property",
          guest_name: "Altă Proprietate"
        })
      ],
      roomBlocks: [block()],
      googleConnection: {
        status: "disconnected",
        google_account_email: null,
        calendar_id: null,
        calendar_name: null,
        last_sync_at: null,
        needs_reconnect: false,
        last_error_code: null,
        last_error_message: null
      },
      notifications: { unreadCount: 0, actionItems: [] },
      activation: { ready: true, missingRequirements: [] }
    });

    render(await DashboardPage({ searchParams: { propertyId: "property-1" } }));
    fireEvent.click(screen.getByRole("button", { name: /Camere active/ }));

    const roomsPanel = panelById("rooms-panel");
    expect(within(roomsPanel).getByText("Camera Ocupată")).toBeVisible();
    expect(within(roomsPanel).getByText("Ocupată acum")).toBeVisible();
    expect(within(roomsPanel).getByText("Camera Viitoare")).toBeVisible();
    expect(within(roomsPanel).getByText("Rezervată viitor")).toBeVisible();
    expect(within(roomsPanel).getByText("Camera Cerere")).toBeVisible();
    expect(within(roomsPanel).getByText("Liberă acum")).toBeVisible();
    expect(within(roomsPanel).getByText("Camera Blocată")).toBeVisible();
    expect(within(roomsPanel).getByText("Indisponibilă")).toBeVisible();
    expect(screen.queryByText("Camera Altă Proprietate")).not.toBeInTheDocument();
    expect(screen.queryByText("Altă Proprietate")).not.toBeInTheDocument();
    expect(screen.queryByText("Anulat")).not.toBeInTheDocument();
    expect(screen.queryByText("Respins")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Proprietate/ }));

    const propertyPanel = panelById("property-panel");
    expect(within(propertyPanel).getByText("Libere acum").nextElementSibling).toHaveTextContent("2");
    expect(within(propertyPanel).getByText("Ocupate acum").nextElementSibling).toHaveTextContent("1");
    expect(within(propertyPanel).getByText("Rezervate viitor").nextElementSibling).toHaveTextContent("1");
    expect(within(propertyPanel).getByText("Cereri în așteptare").nextElementSibling).toHaveTextContent("1");
    expect(within(propertyPanel).getByText("Google Calendar neconectat")).toBeVisible();
  });

  it("expands booking and action cards with scoped links", async () => {
    dashboardMocks.loadDashboardData.mockResolvedValue({
      property: property(),
      rooms: [room({ id: "room-1", name: "Camera Verde" })],
      bookings: [
        booking({ id: "booking-current", guest_name: "Ana Pop" }),
        booking({
          id: "booking-pending",
          guest_name: "Ioana Marin",
          status: "pending",
          confirmed_at: null
        })
      ],
      roomBlocks: [],
      googleConnection: null,
      notifications: {
        unreadCount: 1,
        actionItems: [{ id: "notification-1", title: "Răspunde oaspetelui", href: "/app/notifications" }]
      },
      activation: { ready: false, missingRequirements: ["Configurează camerele"] }
    });

    render(await DashboardPage({ searchParams: { propertyId: "property-1" } }));

    fireEvent.click(screen.getByRole("button", { name: /Rezervări active/ }));
    expect(screen.getByRole("heading", { name: "Rezervări active" })).toBeVisible();
    expect(screen.getByText("Ana Pop")).toBeVisible();
    expect(screen.getByRole("link", { name: "Vezi rezervarea" })).toHaveAttribute(
      "href",
      "/app/bookings/booking-current?propertyId=property-1"
    );

    fireEvent.click(screen.getByRole("button", { name: /Rezervări în așteptare/ }));
    expect(screen.getByRole("heading", { name: "Rezervări în așteptare" })).toBeVisible();
    expect(screen.getByText("Ioana Marin")).toBeVisible();
    expect(screen.getByText("Nu blochează camera până la confirmare.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Verifică cererea" })).toHaveAttribute(
      "href",
      "/app/bookings/booking-pending?propertyId=property-1"
    );

    fireEvent.click(screen.getByRole("button", { name: /Acțiuni noi/ }));
    const actionsPanel = panelById("actions-panel");
    expect(actionsPanel).toBeVisible();
    expect(within(actionsPanel).getByText("Răspunde oaspetelui")).toBeVisible();
    expect(within(actionsPanel).getByRole("link", { name: "Configurează camerele" })).toHaveAttribute(
      "href",
      "/app/property?propertyId=property-1"
    );
    expect(within(actionsPanel).getByRole("link", { name: "Vezi calendarul" })).toHaveAttribute(
      "href",
      "/app/calendar?propertyId=property-1"
    );
  });
});
