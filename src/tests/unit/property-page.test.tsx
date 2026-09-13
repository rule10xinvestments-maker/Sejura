import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PropertyPage from "@/app/(protected)/app/property/page";

const propertyMocks = vi.hoisted(() => ({
  getCurrentOwnerId: vi.fn(),
  getSelectedProperty: vi.fn(),
  listOwnerProperties: vi.fn(),
  listPropertyPhotos: vi.fn()
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

vi.mock("@/domain/photos/service", () => ({
  listPropertyPhotos: propertyMocks.listPropertyPhotos
}));

vi.mock("@/components/property/property-photos", () => ({
  PropertyPhotos: ({ loadError }: { loadError?: boolean }) => (
    <section aria-label="Poze pensiune">
      <h2>Poze pensiune</h2>
      <button type="button">Adaugă poză</button>
      <p>Pozele sunt opționale. Poza principală apare prima pe pagina publică.</p>
      <p>Pozele sunt opționale.</p>
      <p>Nu ai adăugat poze încă.</p>
      {loadError ? <p>Pozele nu au putut fi încărcate momentan.</p> : null}
    </section>
  )
}));

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
    propertyMocks.listPropertyPhotos.mockResolvedValue([]);
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
    expect(
      screen.getByRole("heading", { name: "Primul pas: configurează proprietatea" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Adaugă detaliile pensiunii, apoi configurează camerele și pagina publică."
      )
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: "Completează detaliile" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurează camerele" })).toHaveAttribute(
      "href",
      "/app/rooms?propertyId=property-1"
    );
    expect(screen.getByRole("link", { name: "Vezi pagina publică" })).toHaveAttribute(
      "href",
      "/p/pensiunea-a"
    );
    expect(screen.getByText("Pensiunea A")).toBeVisible();
    expect(screen.getByText("Cabana B")).toBeVisible();
    expect(screen.getByText("Proprietate activă")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Administrează" })[1]).toHaveAttribute(
      "href",
      "/app/property?propertyId=property-2"
    );
    expect(screen.queryByRole("link", { name: "Panou" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Camere" })).toHaveAttribute(
      "href",
      "/app/rooms?propertyId=property-1"
    );
    expect(screen.getByRole("link", { name: "Rezervări" })).toHaveAttribute(
      "href",
      "/app/bookings?propertyId=property-1"
    );
    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/app/calendar?propertyId=property-1"
    );
    expect(screen.getByRole("link", { name: "Setări" })).toHaveAttribute(
      "href",
      "/app/settings?propertyId=property-1"
    );
    expect(screen.getByRole("heading", { name: "Poze pensiune" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Adaugă poză" })).toBeVisible();
    expect(screen.queryByText("Fă poză")).not.toBeInTheDocument();
    expect(screen.getByText("Nu ai adăugat poze încă.")).toBeVisible();
  });

  it("updates active property and form details when propertyId changes", async () => {
    propertyMocks.getSelectedProperty.mockResolvedValue(
      property({
        id: "property-2",
        name: "Cabana B",
        slug: "cabana-b",
        city: "Sinaia"
      })
    );

    render(await PropertyPage({ searchParams: { propertyId: "property-2" } }));

    expect(propertyMocks.getSelectedProperty).toHaveBeenCalledWith(
      {},
      "owner-1",
      "property-2"
    );
    expect(screen.getByTestId("property-form")).toHaveTextContent("Editare Cabana B");
    expect(screen.getByRole("link", { name: "Camere" })).toHaveAttribute(
      "href",
      "/app/rooms?propertyId=property-2"
    );
  });

  it("keeps property page visible when photo loading fails", async () => {
    propertyMocks.listPropertyPhotos.mockRejectedValueOnce(new Error("storage failed"));

    render(await PropertyPage({ searchParams: { propertyId: "property-1" } }));

    expect(screen.getByText("Pensiunea A")).toBeVisible();
    expect(screen.getByText("Pozele nu au putut fi încărcate momentan.")).toBeVisible();
  });
});


