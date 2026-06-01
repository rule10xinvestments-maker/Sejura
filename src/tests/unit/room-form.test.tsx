import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomForm } from "@/components/rooms/room-form";
import type { RoomFormState } from "@/domain/rooms/form-state";
import type { Room } from "@/domain/rooms/types";

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks
}));

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

describe("RoomForm", () => {
  it("shows a friendly validation message for an invalid room name", async () => {
    async function action(): Promise<RoomFormState> {
      return {
        errors: {
          name: "Adauga un nume de cel putin 2 caractere.",
          form: "Verifica datele camerei si incearca din nou."
        }
      };
    }

    render(<RoomForm action={action} propertyId="property-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Salveaz\u0103 camera" }));

    await waitFor(() => {
      expect(
        screen.getByText("Adauga un nume de cel putin 2 caractere.")
      ).toBeVisible();
    });
  });

  it("uses clear save labels for new and edit room forms", () => {
    const action = vi.fn(async () => ({}));

    const { rerender } = render(
      <RoomForm action={action} propertyId="property-1" />
    );

    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 camera" })
    ).toBeVisible();
    expect(screen.getByLabelText("Nume camer\u0103/unitate")).toBeVisible();
    expect(screen.getByLabelText("Oaspe\u021bi maximi")).toBeVisible();
    expect(screen.getByLabelText("Pre\u021b/noapte (RON)")).toBeVisible();

    rerender(<RoomForm action={action} propertyId="property-1" room={room} />);

    expect(
      screen.getByRole("button", { name: "Salveaz\u0103 modific\u0103rile" })
    ).toBeVisible();
  });

  it("shows a success message after saving a room", async () => {
    async function action(): Promise<RoomFormState> {
      return { message: "Camera a fost salvat\u0103." };
    }

    render(<RoomForm action={action} propertyId="property-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Salveaz\u0103 camera" }));

    await waitFor(() => {
      expect(screen.getByText("Camera a fost salvat\u0103.")).toBeVisible();
    });
    expect(routerMocks.refresh).toHaveBeenCalled();
  });
});
