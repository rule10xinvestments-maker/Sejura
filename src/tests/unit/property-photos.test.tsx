import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertyPhotos } from "@/components/property/property-photos";
import type { PropertyPhoto } from "@/domain/photos/types";
import type { Property } from "@/domain/properties/types";

const property = {
  id: "property-1",
  owner_id: "owner-1",
  name: "Pensiunea Brad",
  slug: "pensiunea-brad",
  status: "draft",
  contact_phone: "0712345678",
  contact_email: "gazda@example.com",
  check_in_time: "15:00",
  check_out_time: "11:00",
  rules: "Fara fumat.",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Property;

function propertyPhoto(patch: Partial<PropertyPhoto> = {}): PropertyPhoto {
  return {
    id: "photo-1",
    owner_id: "owner-1",
    property_id: "property-1",
    storage_path: "owner-1/property-1/property/photo.jpg",
    public_url: "https://signed.example/property.jpg",
    alt_text: null,
    sort_order: 0,
    is_cover: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...patch
  };
}

describe("PropertyPhotos", () => {
  it("hides upload controls by default and expands only this property menu", () => {
    render(
      <PropertyPhotos
        coverAction={vi.fn()}
        photos={[]}
        property={property}
        removeAction={vi.fn()}
        uploadAction={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Poze pensiune" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Adaugă poză" })).toBeVisible();
    expect(screen.queryByLabelText("Alege din galerie")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Fă poză")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));

    expect(screen.getByLabelText("Alege din galerie")).not.toHaveAttribute("capture");
    expect(screen.getByLabelText("Fă poză")).toHaveAttribute("capture", "environment");
    expect(screen.getByRole("button", { name: "Încarcă poza" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Renunță" })).toBeVisible();
    expect(
      screen
        .getByRole("button", { name: "Încarcă poza" })
        .closest("form")
        ?.querySelector('input[name="property_id"]')
    ).toHaveAttribute("value", "property-1");
  });

  it("keeps existing property photos visible as compact thumbnails", () => {
    render(
      <PropertyPhotos
        coverAction={vi.fn()}
        photos={[
          propertyPhoto({ id: "cover", is_cover: true }),
          propertyPhoto({
            id: "secondary",
            public_url: "https://signed.example/secondary.jpg"
          })
        ]}
        property={property}
        removeAction={vi.fn()}
        uploadAction={vi.fn()}
      />
    );

    const thumbnails = screen.getAllByRole("img", { name: "Pensiunea Brad" });
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toBeVisible();
    expect(screen.getByText("Poză principală")).toBeVisible();
    expect(screen.getAllByText("Gestionează poza")).toHaveLength(2);
    screen
      .queryAllByText("Confirmă eliminarea")
      .forEach((item) => expect(item).not.toBeVisible());

    const secondaryCard = thumbnails[1].closest("article");
    expect(secondaryCard?.querySelector('input[name="property_id"]')).toHaveAttribute(
      "value",
      "property-1"
    );
  });
});
