import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuestPage from "@/app/guest/page";
import { getPublicPropertyListings } from "@/domain/public-properties/service";

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: vi.fn(() => ({}))
}));

vi.mock("@/domain/public-properties/service", () => ({
  getPublicPropertyListings: vi.fn()
}));

const mockedGetPublicPropertyListings = vi.mocked(getPublicPropertyListings);

describe("guest discovery page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public accommodation cards with detail links", async () => {
    mockedGetPublicPropertyListings.mockResolvedValue([
      {
        id: "property-1",
        name: "Peștera Pusnicului",
        slug: "pestera-pusnicului",
        city: "Brașov",
        publicDescription: "Cabană liniștită aproape de trasee.",
        checkInTime: "15:00",
        checkOutTime: "11:00",
        activeRoomCount: 2,
        fromPrice: 240
      },
      {
        id: "property-2",
        name: "Peștera Ursului",
        slug: "pestera-ursului",
        city: "Bihor",
        publicDescription: null,
        checkInTime: null,
        checkOutTime: null,
        activeRoomCount: 1,
        fromPrice: null
      }
    ]);

    render(await GuestPage());

    expect(screen.getByRole("heading", { name: "Cazări locale" })).toBeVisible();
    expect(screen.getByText("Peștera Pusnicului")).toBeVisible();
    expect(screen.getByText("Peștera Ursului")).toBeVisible();
    expect(screen.getByText("2 camere active")).toBeVisible();
    expect(screen.getByText("240 RON/noapte")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Vezi detalii" })[0]).toHaveAttribute(
      "href",
      "/p/pestera-pusnicului"
    );
  });

  it("renders the empty state when no public accommodations exist", async () => {
    mockedGetPublicPropertyListings.mockResolvedValue([]);

    render(await GuestPage());

    expect(screen.getByText("Încă nu există cazări publice disponibile.")).toBeVisible();
    expect(
      screen.getByText("Revino în curând sau accesează linkul primit de la pensiune.")
    ).toBeVisible();
  });
});
