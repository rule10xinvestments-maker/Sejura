import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RoomsList } from "@/components/rooms/rooms-list";
import { getPrimaryProperty } from "@/domain/properties/service";
import {
  createRoom,
  deactivateRoom,
  listRooms,
  updateRoom
} from "@/domain/rooms/service";
import type { RoomFormState } from "@/domain/rooms/form-state";
import { roomFormSchema } from "@/domain/rooms/schemas";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getRoomPageMessage(messageKey?: string) {
  if (messageKey === "room-deactivated") {
    return "Camera a fost dezactivat\u0103.";
  }

  return null;
}

export default async function RoomsPage({
  searchParams
}: {
  searchParams?: { message?: string };
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const rooms = property ? await listRooms(supabase, ownerId, property.id) : [];

  async function saveRoom(
    _state: RoomFormState,
    formData: FormData
  ): Promise<RoomFormState> {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const propertyId = String(formData.get("property_id") ?? "");
    const roomId = String(formData.get("room_id") ?? "");
    const parsed = roomFormSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      return {
        errors: {
          name: fieldErrors.name?.[0],
          max_guests: fieldErrors.max_guests?.[0],
          base_price_per_night: fieldErrors.base_price_per_night?.[0],
          status: fieldErrors.status?.[0],
          form: "Verifica datele camerei si incearca din nou."
        }
      };
    }

    try {
      if (roomId) {
        await updateRoom(
          serverSupabase,
          serverOwnerId,
          propertyId,
          roomId,
          parsed.data
        );
      } else {
        await createRoom(serverSupabase, serverOwnerId, propertyId, parsed.data);
      }
    } catch {
      return {
        errors: {
          form: "Nu am putut salva camera. Verifica proprietatea si incearca din nou."
        }
      };
    }

    revalidatePath("/app/rooms");
    return {
      message: roomId
        ? "Camera a fost actualizat\u0103."
        : "Camera a fost salvat\u0103."
    };
  }

  async function deactivate(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    await deactivateRoom(
      serverSupabase,
      serverOwnerId,
      String(formData.get("property_id")),
      String(formData.get("room_id"))
    );
    revalidatePath("/app/rooms");
    redirect("/app/rooms?message=room-deactivated");
  }

  return (
    <RoomsList
      property={property}
      rooms={rooms}
      successMessage={getRoomPageMessage(searchParams?.message)}
      saveAction={saveRoom}
      deactivateAction={deactivate}
    />
  );
}
