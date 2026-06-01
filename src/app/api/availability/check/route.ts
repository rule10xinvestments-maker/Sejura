import { NextResponse } from "next/server";
import { AvailabilityService } from "@/domain/bookings/service";
import { availabilityCheckSchema } from "@/domain/bookings/schemas";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const input = availabilityCheckSchema.parse(await request.json());
    const service = new AvailabilityService(new SupabaseBookingRepository(supabase));
    const availability = await service.checkAvailability(input, { ownerId });

    return NextResponse.json(availability);
  } catch (error) {
    return jsonError(error);
  }
}
