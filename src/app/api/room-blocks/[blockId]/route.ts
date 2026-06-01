import { NextResponse } from "next/server";
import { roomBlockSchema } from "@/domain/bookings/schemas";
import { RoomBlockService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: { blockId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const input = roomBlockSchema.parse(await request.json());
    const service = new RoomBlockService(new SupabaseBookingRepository(supabase));
    const roomBlock = await service.updateRoomBlock(
      { ...input, blockId: params.blockId },
      { ownerId }
    );

    return NextResponse.json({ roomBlock });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { blockId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const service = new RoomBlockService(new SupabaseBookingRepository(supabase));
    const roomBlock = await service.deleteRoomBlock(params.blockId, { ownerId });

    return NextResponse.json({ roomBlock });
  } catch (error) {
    return jsonError(error);
  }
}
