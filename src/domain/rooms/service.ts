import type { RoomInput } from "@/domain/rooms/types";
import type { AppSupabaseClient } from "@/lib/supabase/types";

async function assertPropertyOwned(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) {
    throw new Error("Proprietatea nu apartine acestui proprietar.");
  }
}

export async function listRooms(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  await assertPropertyOwned(supabase, ownerId, propertyId);

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createRoom(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  input: RoomInput
) {
  await assertPropertyOwned(supabase, ownerId, propertyId);

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      ...input,
      owner_id: ownerId,
      property_id: propertyId
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateRoom(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string,
  input: RoomInput
) {
  await assertPropertyOwned(supabase, ownerId, propertyId);

  const { data, error } = await supabase
    .from("rooms")
    .update(input)
    .eq("id", roomId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deactivateRoom(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string
) {
  await assertPropertyOwned(supabase, ownerId, propertyId);

  const { error } = await supabase
    .from("rooms")
    .update({ status: "inactive" })
    .eq("id", roomId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId);

  if (error) {
    throw error;
  }
}
