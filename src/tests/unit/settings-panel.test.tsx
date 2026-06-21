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
    />
  );
}

describe("SettingsPanel", () => {
  it("renders AI and public booking controls as real buttons", () => {
    renderPanel();

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toContain("Dezactivat");
    expect(screen.getByText("AI")).toBeVisible();
    expect(screen.getByText("Rezervari publice")).toBeVisible();
  });

  it("shows enabled state through pressed buttons", () => {
    renderPanel({ ai_enabled: true, public_booking_enabled: true });

    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Activat" })).toHaveLength(2);
  });

  it("keeps auto-confirmation guarded for pilot", () => {
    renderPanel({ allow_auto_confirmation: true });

    expect(
      screen.getByRole("button", { name: "Dezactivata pentru pilot" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Pentru pilot, Jonny si cererile publice se folosesc doar in modul in asteptare. Confirmarea automata ramane dezactivata."
      )
    ).toBeVisible();
  });
});
