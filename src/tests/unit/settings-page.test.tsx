import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/(protected)/app/settings/page";

const settingsPageMocks = vi.hoisted(() => ({
  getCurrentOwnerId: vi.fn(),
  getSelectedProperty: vi.fn(),
  getPropertySettings: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({}))
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentOwnerId: settingsPageMocks.getCurrentOwnerId
}));

vi.mock("@/domain/properties/service", async () => {
  const actual = await vi.importActual<typeof import("@/domain/properties/service")>(
    "@/domain/properties/service"
  );

  return {
    ...actual,
    getSelectedProperty: settingsPageMocks.getSelectedProperty
  };
});

vi.mock("@/domain/settings/service", async () => {
  const actual = await vi.importActual<typeof import("@/domain/settings/service")>(
    "@/domain/settings/service"
  );

  return {
    ...actual,
    getPropertySettings: settingsPageMocks.getPropertySettings
  };
});

vi.mock("@/components/settings/settings-panel", () => ({
  SettingsPanel: ({ settings }: { settings: unknown }) => (
    <section>{settings ? "Settings loaded" : "Settings missing"}</section>
  )
}));

const property = {
  id: "property-1",
  owner_id: "owner-1",
  name: "Pensiunea A",
  slug: "pensiunea-a",
  status: "draft",
  contact_phone: "0711111111",
  contact_email: "a@example.com",
  check_in_time: "15:00",
  check_out_time: "11:00",
  rules: "Reguli",
  city: "Brașov",
  public_description: null,
  public_contact_phone: null,
  public_contact_email: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

describe("SettingsPage", () => {
  beforeEach(() => {
    settingsPageMocks.getCurrentOwnerId.mockResolvedValue("owner-1");
    settingsPageMocks.getSelectedProperty.mockResolvedValue(property);
    settingsPageMocks.getPropertySettings.mockResolvedValue({
      id: "settings-1",
      owner_id: "owner-1",
      property_id: "property-1",
      ai_enabled: false,
      public_booking_enabled: false,
      allow_auto_confirmation: false,
      calendar_required_for_confirmation: false,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    });
  });

  it("renders settings when property settings exist", async () => {
    render(await SettingsPage({ searchParams: { propertyId: "property-1" } }));

    expect(screen.getByText("Setări")).toBeVisible();
    expect(screen.getByText("Settings loaded")).toBeVisible();
  });

  it("does not crash when selected property settings fail to load", async () => {
    settingsPageMocks.getPropertySettings.mockRejectedValueOnce(
      new Error("settings table unavailable")
    );

    render(await SettingsPage({ searchParams: { propertyId: "property-1" } }));

    expect(
      screen.getByText("Setările nu au putut fi încărcate momentan.")
    ).toBeVisible();
    expect(screen.getByText("Settings missing")).toBeVisible();
  });
});
