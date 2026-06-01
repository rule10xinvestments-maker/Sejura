import { NextResponse } from "next/server";
import { bookingInputSchema } from "@/domain/bookings/schemas";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { NotificationService } from "@/domain/notifications/service";
import { jsonError } from "@/domain/bookings/http";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const input = bookingInputSchema.parse(await request.json());
    const service = new BookingService(
      new SupabaseBookingRepository(supabase),
      undefined,
      new NotificationService(supabase)
    );
    const booking = await service.createPendingBooking(input, { ownerId });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
