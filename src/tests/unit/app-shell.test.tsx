import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/app-shell";

const appShellMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useSearchParams: appShellMocks.useSearchParams
}));

vi.mock("@/lib/auth/actions", () => ({
  signOut: vi.fn()
}));

describe("AppShell", () => {
  it("renders the simplified owner navigation without Panou or Start", () => {
    appShellMocks.useSearchParams.mockReturnValue(new URLSearchParams());

    render(
      <AppShell>
        <p>Owner content</p>
      </AppShell>
    );

    const nav = screen.getByRole("navigation", { name: "Navigare proprietar" });

    expect(within(nav).queryByRole("link", { name: "Panou" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Start" })).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Proprietate" })).toHaveAttribute(
      "href",
      "/app/property"
    );
    expect(within(nav).getByRole("link", { name: "Camere" })).toHaveAttribute(
      "href",
      "/app/rooms"
    );
    expect(within(nav).getByRole("link", { name: "Rezervări" })).toHaveAttribute(
      "href",
      "/app/bookings"
    );
    expect(within(nav).getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/app/calendar"
    );
    expect(within(nav).getByRole("link", { name: "Setări" })).toHaveAttribute(
      "href",
      "/app/settings"
    );
  });

  it("preserves selected propertyId in owner nav links", () => {
    appShellMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("propertyId=property-1")
    );

    render(
      <AppShell>
        <p>Owner content</p>
      </AppShell>
    );

    const nav = screen.getByRole("navigation", { name: "Navigare proprietar" });

    expect(within(nav).getByRole("link", { name: "Proprietate" })).toHaveAttribute(
      "href",
      "/app/property?propertyId=property-1"
    );
    expect(within(nav).getByRole("link", { name: "Camere" })).toHaveAttribute(
      "href",
      "/app/rooms?propertyId=property-1"
    );
    expect(within(nav).getByRole("link", { name: "Rezervări" })).toHaveAttribute(
      "href",
      "/app/bookings?propertyId=property-1"
    );
    expect(within(nav).getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/app/calendar?propertyId=property-1"
    );
    expect(within(nav).getByRole("link", { name: "Setări" })).toHaveAttribute(
      "href",
      "/app/settings?propertyId=property-1"
    );
  });
});
