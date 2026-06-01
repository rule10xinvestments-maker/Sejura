import { NextResponse } from "next/server";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { NotificationService } from "@/domain/notifications/service";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const service = new BookingService(
      new SupabaseBookingRepository(supabase),
      new GoogleCalendarService(supabase),
      new NotificationService(supabase)
    );
    const booking = await service.cancelBooking(params.bookingId, { ownerId });

    return NextResponse.json({ booking });
  } catch (error) {
    return jsonError(error);
  }
}
