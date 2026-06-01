import { describe, expect, it } from "vitest";
import { getActivationStatus } from "@/domain/activation/service";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";
import type { PropertySettings } from "@/domain/settings/types";

const property = {
  id: "property-1",
  owner_id: "owner-1",
  name: "Cabana Brad",
  slug: "cabana-brad",
  status: "draft",
  contact_phone: "0712345678",
  contact_email: "gazda@example.com",
  check_in_time: "15:00",
  check_out_time: "11:00",
  rules: "Fara fumat in interior.",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Property;

const settings = {
  id: "settings-1",
  owner_id: "owner-1",
  property_id: "property-1",
  ai_enabled: false,
  public_booking_enabled: false,
  allow_auto_confirmation: false,
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as PropertySettings;

const room = {
  id: "room-1",
  owner_id: "owner-1",
  property_id: "property-1",
  name: "Camera 1",
  max_guests: 2,
  base_price_per_night: 240,
  status: "active",
  created_at: "2026-01-01",
  updated_at: "2026-01-01"
} as Room;

describe("getActivationStatus", () => {
  it("reports missing property, settings, and active room", () => {
    const status = getActivationStatus({
      property: null,
      settings: null,
      rooms: []
    });

    expect(status.ready).toBe(false);
    expect(status.missingRequirements).toContain("Adauga detaliile proprietatii.");
    expect(status.missingRequirements).toContain(
      "Adauga cel putin o camera fizica activa."
    );
  });

  it("recognizes complete basic setup", () => {
    const status = getActivationStatus({
      property,
      settings,
      rooms: [room]
    });

    expect(status.ready).toBe(true);
    expect(status.missingRequirements).toEqual([]);
  });

  it("blocks unsafe Sprint 1 settings", () => {
    const status = getActivationStatus({
      property,
      settings: { ...settings, ai_enabled: true },
      rooms: [room]
    });

    expect(status.ready).toBe(false);
    expect(status.missingRequirements).toContain(
      "AI trebuie sa ramana dezactivat in Sprint 1."
    );
  });
});
