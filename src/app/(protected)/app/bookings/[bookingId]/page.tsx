import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BookingActionButtons } from "@/components/bookings/booking-action-buttons";
import {
  bookingEventStatusLabels,
  bookingHistoryDetails,
  calendarStatusCopy,
  shouldShowCalendarWarning
} from "@/domain/bookings/detail-copy";
import { BookingDomainError } from "@/domain/bookings/errors";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import type { BookingRecord } from "@/domain/bookings/types";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { ownerSafeGoogleCalendarMessage } from "@/domain/google-calendar/errors";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  error?: string;
  message?: string;
};

function pageMessage(key?: string) {
  if (key === "confirmed") return "Rezervarea a fost confirmata.";
  if (key === "rejected") return "Rezervarea a fost respinsa.";
  if (key === "cancelled") return "Rezervarea a fost anulata.";
  return null;
}

function pageError(key?: string) {
  if (key === "confirmation-conflict") {
    return "Nu se poate confirma rezervarea. Camera este deja ocupata in acest interval.";
  }
  if (key === "confirmation-validation") {
    return "Verifica datele rezervarii inainte de confirmare.";
  }
  if (key === "calendar-required") {
    return "Rezervarea nu poate fi confirmata deoarece Google Calendar este obligatoriu pentru aceasta pensiune. Conecteaza calendarul sau dezactiveaza cerinta din setari.";
  }
  if (key === "calendar-sync") {
    return "Sincronizarea Google Calendar nu a reusit. Daca Google Calendar nu este obligatoriu, rezervarea ramane confirmata in Sejura.";
  }
  return null;
}

export default async function BookingDetailPage({
  params,
  searchParams
}: {
  params: { bookingId: string };
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const repository = new SupabaseBookingRepository(supabase);
  const service = new BookingService(
    repository,
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
  const settings = await repository.getPropertySettings(ownerId, booking.property_id);
  const property = await repository.getProperty(ownerId, booking.property_id);

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

  const calendarCopy = calendarStatusCopy(booking, {
    calendarRequiredForConfirmation:
      settings?.calendar_required_for_confirmation ?? false
  });
  const successMessage = pageMessage(searchParams?.message);
  const errorMessage = pageError(searchParams?.error);

  return (
    <div className="space-y-5">
      <Link className="text-sm font-semibold text-clay" href="/app/bookings">
        Inapoi la rezervari
      </Link>
      <section className="panel">
        {successMessage ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}
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
            {bookingEventStatusLabels[booking.status]}
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
              {calendarCopy.label}
              {calendarCopy.message ? (
                <p className="mt-1 text-xs font-normal text-ink/60">
                  {calendarCopy.message}
                </p>
              ) : null}
            </dd>
          </div>
        </dl>

        {shouldShowCalendarWarning(booking, {
          calendarRequiredForConfirmation:
            settings?.calendar_required_for_confirmation ?? false
        }) ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              {ownerSafeGoogleCalendarMessage(booking.calendar_sync_error_code)}
            </p>
            {booking.status === "confirmed" ? (
              <p className="mt-1">
                Rezervarea este confirmata in Sejura, dar calendarul nu a fost
                sincronizat.
              </p>
            ) : null}
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

        <BookingActionButtons
          bookingId={booking.id}
          checkOutTime={property?.check_out_time}
          status={booking.status}
        />
      </section>

      <section className="panel">
        <h2 className="text-lg font-semibold">Istoric</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {events.map((event) => {
            const details = bookingHistoryDetails(booking, event);

            return (
              <li
                className="rounded-md border border-line p-3"
                id={`event-${event.id}`}
                key={event.id}
              >
                <a className="block" href={`#event-${event.id}`}>
                  <p className="font-semibold">{details.actionLabel}</p>
                  <p className="mt-1 text-ink/60">{details.occurredAt}</p>
                  <dl className="mt-3 grid gap-2">
                    <div>
                      <dt className="text-ink/60">Client</dt>
                      <dd className="font-medium">{details.guestName}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/60">Perioadă</dt>
                      <dd className="font-medium">{details.stayPeriod}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/60">Oaspeți</dt>
                      <dd className="font-medium">{details.guestsCount}</dd>
                    </div>
                    {details.phone ? (
                      <div>
                        <dt className="text-ink/60">Telefon</dt>
                        <dd className="font-medium">{details.phone}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-ink/60">Email</dt>
                      <dd className="font-medium">{details.email}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/60">Status rezultat</dt>
                      <dd className="font-medium">{details.statusLabel}</dd>
                    </div>
                  </dl>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
