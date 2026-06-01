import { NextResponse } from "next/server";
import { roomBlockSchema } from "@/domain/bookings/schemas";
import { RoomBlockService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const service = new RoomBlockService(new SupabaseBookingRepository(supabase));
    const roomBlocks = await service.listRoomBlocks({ ownerId });

    return NextResponse.json({ roomBlocks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const input = roomBlockSchema.parse(await request.json());
    const service = new RoomBlockService(new SupabaseBookingRepository(supabase));
    const roomBlock = await service.createRoomBlock(input, { ownerId });

    return NextResponse.json({ roomBlock }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
