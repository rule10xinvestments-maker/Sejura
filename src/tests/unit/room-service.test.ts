import { describe, expect, it } from "vitest";
import { roomFormSchema } from "@/domain/rooms/schemas";

describe("room schema", () => {
  it("coerces room form values", () => {
    const parsed = roomFormSchema.parse({
      name: "Camera Verde",
      max_guests: "3",
      base_price_per_night: "320",
      status: "active"
    });

    expect(parsed).toEqual({
      name: "Camera Verde",
      max_guests: 3,
      base_price_per_night: 320,
      status: "active"
    });
  });

  it("rejects aggregated or invalid capacity values", () => {
    expect(() =>
      roomFormSchema.parse({
        name: "Camere duble",
        max_guests: "0",
        base_price_per_night: "200",
        status: "active"
      })
    ).toThrow();
  });

  it("returns friendly validation errors for invalid room names", () => {
    const parsed = roomFormSchema.safeParse({
      name: "",
      max_guests: "2",
      base_price_per_night: "200",
      status: "active"
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.name?.[0]).toBe(
        "Adauga un nume de cel putin 2 caractere."
      );
    }
  });
});
