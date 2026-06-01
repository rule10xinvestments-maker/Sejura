import { NextResponse } from "next/server";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const service = new BookingService(new SupabaseBookingRepository(supabase));
    const booking = await service.getBooking(params.bookingId, { ownerId });
    const events = await service.getBookingEvents(params.bookingId, { ownerId });

    return NextResponse.json({ booking, events });
  } catch (error) {
    return jsonError(error);
  }
}
