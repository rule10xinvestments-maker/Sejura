import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PublicPageRow = Database["public"]["Tables"]["property_public_pages"]["Row"];
type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];

export type PublicPropertyListing = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  publicDescription: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  activeRoomCount: number;
  fromPrice: number | null;
};

export function buildPublicPropertyListings(input: {
  publicPages: PublicPageRow[];
  properties: PropertyRow[];
  rooms: RoomRow[];
}): PublicPropertyListing[] {
  const publicPropertyIds = new Set(
    input.publicPages.filter((page) => page.is_public).map((page) => page.property_id)
  );

  return input.properties
    .filter(
      (property) =>
        publicPropertyIds.has(property.id) && property.status !== "disabled"
    )
    .map((property) => {
      const activeRooms = input.rooms.filter(
        (room) => room.property_id === property.id && room.status === "active"
      );
      const prices = activeRooms
        .map((room) => room.base_price_per_night)
        .filter((price) => Number.isFinite(price));

      return {
        id: property.id,
        name: property.name,
        slug: property.slug,
        city: property.city,
        publicDescription: property.public_description,
        checkInTime: property.check_in_time,
        checkOutTime: property.check_out_time,
        activeRoomCount: activeRooms.length,
        fromPrice: prices.length > 0 ? Math.min(...prices) : null
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "ro"));
}

export async function getPublicPropertyListings(
  supabase: AppSupabaseClient
): Promise<PublicPropertyListing[]> {
  const { data: publicPages, error: publicPagesError } = await supabase
    .from("property_public_pages")
    .select("*")
    .eq("is_public", true);

  if (publicPagesError) {
    throw publicPagesError;
  }

  const propertyIds = (publicPages ?? []).map((page) => page.property_id);

  if (propertyIds.length === 0) {
    return [];
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("*")
    .in("id", propertyIds)
    .neq("status", "disabled");

  if (propertiesError) {
    throw propertiesError;
  }

  const visiblePropertyIds = (properties ?? []).map((property) => property.id);

  if (visiblePropertyIds.length === 0) {
    return [];
  }

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .in("property_id", visiblePropertyIds)
    .eq("status", "active");

  if (roomsError) {
    throw roomsError;
  }

  return buildPublicPropertyListings({
    publicPages: publicPages ?? [],
    properties: properties ?? [],
    rooms: rooms ?? []
  });
}
