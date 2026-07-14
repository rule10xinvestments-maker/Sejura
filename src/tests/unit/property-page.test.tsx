import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PropertyPage from "@/app/(protected)/app/property/page";

const propertyMocks = vi.hoisted(() => ({
  getCurrentOwnerId: vi.fn(),
  getSelectedProperty: vi.fn(),
  listOwnerProperties: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({}))
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentOwnerId: propertyMocks.getCurrentOwnerId
}));

vi.mock("@/domain/properties/service", async () => {
  const actual = await vi.importActual<typeof import("@/domain/properties/service")>(
    "@/domain/properties/service"
  );

  return {
    ...actual,
    getSelectedProperty: propertyMocks.getSelectedProperty,
    listOwnerProperties: propertyMocks.listOwnerProperties
  };
});

vi.mock("@/components/property/property-form", () => ({
  PropertyForm: ({ property }: { property: { name?: string } | null }) => (
    <form data-testid="property-form">
      {property ? `Editare ${property.name}` : "Proprietate nouă"}
    </form>
  )
}));

function property(patch: Record<string, unknown>) {
  return {
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
    updated_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

describe("PropertyPage", () => {
  beforeEach(() => {
    propertyMocks.getCurrentOwnerId.mockResolvedValue("owner-1");
    const active = property({});
    propertyMocks.getSelectedProperty.mockResolvedValue(active);
    propertyMocks.listOwnerProperties.mockResolvedValue([
      active,
      property({
        id: "property-2",
        name: "Cabana B",
        slug: "cabana-b",
        city: "Sinaia"
      })
    ]);
  });

  it("shows add property and owner property switcher", async () => {
    render(await PropertyPage({ searchParams: { propertyId: "property-1" } }));

    expect(screen.getByRole("link", { name: "Adaugă proprietate" })).toHaveAttribute(
      "href",
      "/app/properties/new"
    );
    expect(screen.getByRole("heading", { name: "Proprietățile mele" })).toBeVisible();
    expect(screen.getByText("Pensiunea A")).toBeVisible();
    expect(screen.getByText("Cabana B")).toBeVisible();
    expect(screen.getByText("Proprietate activă")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Administrează" })[1]).toHaveAttribute(
      "href",
      "/app/property?propertyId=property-2"
    );
  });
});

