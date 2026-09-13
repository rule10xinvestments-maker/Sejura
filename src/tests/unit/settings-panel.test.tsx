import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "@/components/settings/settings-panel";
import type { PropertySettings } from "@/domain/settings/types";

const settings = {
  id: "settings-1",
  owner_id: "owner-1",
  property_id: "property-1",
  ai_enabled: false,
  public_booking_enabled: false,
  allow_auto_confirmation: false,
  calendar_required_for_confirmation: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
} as PropertySettings;

function renderPanel(overrides: Partial<PropertySettings> = {}) {
  render(
    <SettingsPanel
      autoConfirmationAction={vi.fn()}
      propertyId="property-1"
      publicBookingsAction={vi.fn()}
      settings={{ ...settings, ...overrides }}
      toggleAiAction={vi.fn()}
      toggleCalendarRequiredAction={vi.fn()}
    />
  );
}

describe("SettingsPanel", () => {
  it("renders AI and public booking controls as real buttons", () => {
    renderPanel();

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toContain("Dezactivat");
    expect(screen.getByText("AI")).toBeVisible();
    expect(screen.getByText("Rezervări publice")).toBeVisible();
  });

  it("shows enabled state through pressed buttons", () => {
    renderPanel({ ai_enabled: true, public_booking_enabled: true });

    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Activat" })).toHaveLength(2);
  });

  it("keeps auto-confirmation guarded for pilot", () => {
    renderPanel({ allow_auto_confirmation: true });

    expect(
      screen.getByRole("button", { name: "Dezactivată pentru pilot" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Pentru pilot, Jonny și cererile publice se folosesc doar în modul în așteptare. Confirmarea automată rămâne dezactivată."
      )
    ).toBeVisible();
  });

  it("shows Google Calendar as optional by default for pilot confirmation", () => {
    renderPanel();

    expect(screen.getByText("Google Calendar obligatoriu")).toBeVisible();
    expect(screen.getByRole("button", { name: "Opțional" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(
      screen.getByText(
        "Când este dezactivat, confirmarea merge în Sejura chiar dacă sincronizarea calendarului eșuează."
      )
    ).toBeVisible();
  });

  it("shows when Google Calendar is required for confirmation", () => {
    renderPanel({ calendar_required_for_confirmation: true });

    expect(screen.getByRole("button", { name: "Obligatoriu" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
