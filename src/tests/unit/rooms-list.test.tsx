import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomsList } from "@/components/rooms/rooms-list";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

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

const room = {
  id: "room-1",
  owner_id: "owner-1",
  property_id: "property-1",
  name: "Camera Verde",
  max_guests: 2,
  base_price_per_night: 220,
  status: "active",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Room;

describe("RoomsList", () => {
  it("shows a friendly property setup message when property is missing", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={null}
        rooms={[]}
        saveAction={vi.fn()}
      />
    );

    expect(
      screen.getByText("Adaug\u0103 mai \u00eent\u00e2i detaliile propriet\u0103\u021bii.")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Configureaza proprietatea" })
    ).toHaveAttribute("href", "/app/property");
  });

  it("renders an empty room form safely when no rooms exist", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={property}
        rooms={[]}
        saveAction={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Camera noua" })).toBeVisible();
    expect(screen.getByLabelText("Nume camer\u0103/unitate")).toBeVisible();
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 camera" })
    ).toBeVisible();
  });

  it("renders edit save copy and page-level success feedback", () => {
    render(
      <RoomsList
        deactivateAction={vi.fn()}
        property={property}
        rooms={[room]}
        saveAction={vi.fn()}
        successMessage={"Camera a fost dezactivat\u0103."}
      />
    );

    expect(screen.getByText("Camera a fost dezactivat\u0103.")).toBeVisible();
    fireEvent.click(screen.getByText("Editeaza"));
    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 modific\u0103rile" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Dezactiveaza" })).toHaveAttribute(
      "type",
      "submit"
    );
  });
});
