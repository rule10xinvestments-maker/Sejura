import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
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
      undefined,
      new NotificationService(supabase)
    );
    const booking = await service.rejectBooking(params.bookingId, { ownerId });

    revalidatePath("/app");
    revalidatePath("/app/bookings");
    revalidatePath(`/app/bookings/${params.bookingId}`);
    revalidatePath("/app/calendar");

    return NextResponse.json({ booking });
  } catch (error) {
    return jsonError(error);
  }
}
