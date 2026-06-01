import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BookingDomainError } from "@/domain/bookings/errors";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import type { BookingRecord } from "@/domain/bookings/types";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { ownerSafeGoogleCalendarMessage } from "@/domain/google-calendar/errors";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<BookingRecord["status"], string> = {
  pending: "In asteptare",
  confirmed: "Confirmata",
  cancelled: "Anulata",
  rejected: "Respinsa"
};

const eventLabels: Record<string, string> = {
  booking_created: "Rezervare creata",
  booking_confirmed: "Rezervare confirmata",
  booking_rejected: "Rezervare respinsa",
  booking_cancelled: "Rezervare anulata"
};

export default async function BookingDetailPage({
  params
}: {
  params: { bookingId: string };
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const service = new BookingService(
    new SupabaseBookingRepository(supabase),
    new GoogleCalendarService(supabase),
    new NotificationService(supabase)
  );

  let booking: BookingRecord;
  try {
    booking = await service.getBooking(params.bookingId, { ownerId });
  } catch (error) {
    if (error instanceof BookingDomainError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const events = await service.getBookingEvents(params.bookingId, { ownerId });

  async function confirmBooking() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const serverService = new BookingService(
      new SupabaseBookingRepository(serverSupabase),
      new GoogleCalendarService(serverSupabase),
      new NotificationService(serverSupabase)
    );

    try {
      await serverService.confirmBooking(params.bookingId, { ownerId: serverOwnerId });
    } catch {
      redirect("/app/bookings?error=unavailable");
    }

    revalidatePath("/app/bookings");
    redirect("/app/bookings?message=confirmed");
  }

  async function rejectBooking() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const serverService = new BookingService(
      new SupabaseBookingRepository(serverSupabase),
      new GoogleCalendarService(serverSupabase),
      new NotificationService(serverSupabase)
    );
    await serverService.rejectBooking(params.bookingId, { ownerId: serverOwnerId });
    revalidatePath("/app/bookings");
    redirect("/app/bookings?message=rejected");
  }

  async function cancelBooking() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const serverService = new BookingService(
      new SupabaseBookingRepository(serverSupabase),
      new GoogleCalendarService(serverSupabase),
      new NotificationService(serverSupabase)
    );
    await serverService.cancelBooking(params.bookingId, { ownerId: serverOwnerId });
    revalidatePath("/app/bookings");
    redirect("/app/bookings?message=cancelled");
  }

  async function retryCalendarSync() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    await new GoogleCalendarService(serverSupabase).retryBookingSync(
      serverOwnerId,
      params.bookingId
    );
    revalidatePath(`/app/bookings/${params.bookingId}`);
    redirect(`/app/bookings/${params.bookingId}`);
  }

  const syncLabels: Record<BookingRecord["calendar_sync_status"], string> = {
    not_required: "Nu este necesar",
    pending: "In asteptare",
    synced: "Sincronizat",
    failed: "Sincronizare esuata",
    needs_reconnect: "Necesita reconectare"
  };

  return (
    <div className="space-y-5">
      <Link className="text-sm font-semibold text-clay" href="/app/bookings">
        Inapoi la rezervari
      </Link>
      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-clay">Detalii rezervare</p>
            <h1 className="text-2xl font-bold">{booking.guest_name}</h1>
            <p className="mt-2 text-sm text-ink/70">
              {booking.start_date} - {booking.end_date} · {booking.guests_count}{" "}
              oaspeti
            </p>
          </div>
          <span className="w-fit rounded-md border border-line px-2 py-1 text-xs font-semibold">
            {statusLabels[booking.status]}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/60">Telefon</dt>
            <dd className="font-medium">{booking.guest_phone ?? "Nesetat"}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Email</dt>
            <dd className="font-medium">{booking.guest_email ?? "Nesetat"}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Total estimat</dt>
            <dd className="font-medium">
              {booking.total_estimated_price
                ? `${booking.total_estimated_price} ${booking.currency}`
                : "Nesetat"}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Calendar</dt>
            <dd className="font-medium">
              {syncLabels[booking.calendar_sync_status]}
            </dd>
          </div>
        </dl>

        {booking.calendar_sync_status === "failed" ||
        booking.calendar_sync_status === "needs_reconnect" ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              {ownerSafeGoogleCalendarMessage(booking.calendar_sync_error_code)}
            </p>
            {booking.status === "confirmed" ? (
              <form action={retryCalendarSync} className="mt-3">
                <button className="button-secondary" type="submit">
                  Reincearca sincronizarea
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {booking.guest_notes ? (
          <p className="mt-4 rounded-md bg-mist p-3 text-sm text-ink/75">
            {booking.guest_notes}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {booking.status === "pending" ? (
            <>
              <form action={confirmBooking}>
                <p className="mb-2 text-xs text-ink/60">
                  Confirma doar dupa ce ai verificat cererea oaspetelui.
                </p>
                <button className="button-primary w-full" type="submit">
                  Confirma rezervarea
                </button>
              </form>
              <form action={rejectBooking}>
                <p className="mb-2 text-xs text-ink/60">
                  Respingerea pastreaza istoricul, dar nu blocheaza camera.
                </p>
                <button className="button-secondary w-full" type="submit">
                  Respinge rezervarea
                </button>
              </form>
            </>
          ) : null}
          {booking.status === "pending" || booking.status === "confirmed" ? (
            <form action={cancelBooking}>
              <p className="mb-2 text-xs text-ink/60">
                Anularea elibereaza intervalul pentru alte rezervari.
              </p>
              <button className="button-secondary w-full" type="submit">
                Anuleaza rezervarea
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-lg font-semibold">Istoric</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {events.map((event) => (
            <li className="rounded-md border border-line p-3" key={event.id}>
              <p className="font-medium">
                {eventLabels[event.event_type] ?? event.event_type}
              </p>
              <p className="text-ink/60">{event.created_at}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
