import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewPropertyPage from "@/app/(protected)/app/properties/new/page";

const newPropertyMocks = vi.hoisted(() => ({
  getCurrentOwnerId: vi.fn(),
  listOwnerProperties: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({}))
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentOwnerId: newPropertyMocks.getCurrentOwnerId
}));

vi.mock("@/domain/properties/service", async () => {
  const actual = await vi.importActual<typeof import("@/domain/properties/service")>(
    "@/domain/properties/service"
  );

  return {
    ...actual,
    listOwnerProperties: newPropertyMocks.listOwnerProperties
  };
});

vi.mock("@/components/property/property-form", () => ({
  PropertyForm: () => <form data-testid="property-form" />
}));

function property(id: string) {
  return { id, name: id };
}

describe("NewPropertyPage", () => {
  beforeEach(() => {
    newPropertyMocks.getCurrentOwnerId.mockResolvedValue("owner-1");
  });

  it("shows the new property form below the property limit", async () => {
    newPropertyMocks.listOwnerProperties.mockResolvedValue([property("property-1")]);

    render(await NewPropertyPage());

    expect(screen.getByRole("heading", { name: "Adaugă proprietate" })).toBeVisible();
    expect(screen.getByTestId("property-form")).toBeVisible();
  });

  it("enforces the MVP property limit with Romanian copy", async () => {
    newPropertyMocks.listOwnerProperties.mockResolvedValue([
      property("property-1"),
      property("property-2"),
      property("property-3")
    ]);

    render(await NewPropertyPage());

    expect(
      screen.getByText("Ai atins limita de proprietăți pentru planul actual.")
    ).toBeVisible();
    expect(screen.queryByTestId("property-form")).not.toBeInTheDocument();
  });
});

