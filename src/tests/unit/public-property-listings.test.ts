import { describe, expect, it } from "vitest";
import { buildPublicPropertyListings } from "@/domain/public-properties/service";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PublicPage = Database["public"]["Tables"]["property_public_pages"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

function property(overrides: Partial<Property>): Property {
  return {
    id: "property-1",
    owner_id: "owner-1",
    name: "Peștera Pusnicului",
    slug: "pestera-pusnicului",
    status: "ready_pending_mode",
    contact_phone: "0700000000",
    contact_email: "owner@example.com",
    check_in_time: "15:00",
    check_out_time: "11:00",
    rules: "",
    city: "Brașov",
    public_description: "Cabană liniștită.",
    public_contact_phone: null,
    public_contact_email: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function publicPage(overrides: Partial<PublicPage>): PublicPage {
  return {
    id: "page-1",
    owner_id: "owner-1",
    property_id: "property-1",
    is_public: true,
    chat_enabled: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function room(overrides: Partial<Room>): Room {
  return {
    id: "room-1",
    owner_id: "owner-1",
    property_id: "property-1",
    name: "Camera Verde",
    max_guests: 2,
    base_price_per_night: 250,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("public property listings", () => {
  it("lists public enabled properties with active room count and from price", () => {
    const listings = buildPublicPropertyListings({
      publicPages: [publicPage({})],
      properties: [property({})],
      rooms: [
        room({ base_price_per_night: 300 }),
        room({ id: "room-2", base_price_per_night: 220 }),
        room({ id: "room-3", status: "inactive", base_price_per_night: 120 })
      ]
    });

    expect(listings).toEqual([
      expect.objectContaining({
        name: "Peștera Pusnicului",
        slug: "pestera-pusnicului",
        activeRoomCount: 2,
        fromPrice: 220
      })
    ]);
  });

  it("does not list disabled or non-public properties", () => {
    const listings = buildPublicPropertyListings({
      publicPages: [
        publicPage({ property_id: "public-disabled" }),
        publicPage({ id: "page-2", property_id: "private", is_public: false })
      ],
      properties: [
        property({ id: "public-disabled", status: "disabled" }),
        property({ id: "private", name: "Peștera Ursului", slug: "pestera-ursului" })
      ],
      rooms: [room({ property_id: "public-disabled" }), room({ property_id: "private" })]
    });

    expect(listings).toEqual([]);
  });
});
