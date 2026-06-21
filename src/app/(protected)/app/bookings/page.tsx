import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ManualBookingForm } from "@/components/bookings/manual-booking-form";
import { BookingDomainError } from "@/domain/bookings/errors";
import { bookingFormSchema } from "@/domain/bookings/schemas";
import { BookingService } from "@/domain/bookings/service";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import type { BookingRecord } from "@/domain/bookings/types";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { NotificationService } from "@/domain/notifications/service";
import { getPrimaryProperty } from "@/domain/properties/service";
import { listRooms } from "@/domain/rooms/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  error?: string;
  message?: string;
};

const statusLabels: Record<BookingRecord["status"], string> = {
  pending: "In asteptare",
  confirmed: "Confirmata",
  cancelled: "Anulata",
  rejected: "Respinsa"
};

function pageMessage(key?: string) {
  if (key === "saved") return "Rezervarea a fost salvata.";
  if (key === "confirmed") return "Rezervarea a fost confirmata.";
  if (key === "rejected") return "Rezervarea a fost respinsa.";
  if (key === "cancelled") return "Rezervarea a fost anulata.";
  return null;
}

function pageError(key?: string) {
  if (key === "invalid") return "Verifică datele rezervării și încearcă din nou.";
  if (key === "unavailable") return "Camera nu este disponibilă în intervalul ales.";
  if (key === "conflict") return "Există deja o rezervare suprapusă pentru această cameră.";
  if (key === "missing-property") return "Adauga mai intai detaliile proprietatii.";
  return null;
}

export default async function BookingsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const rooms = property ? await listRooms(supabase, ownerId, property.id) : [];
  const repository = new SupabaseBookingRepository(supabase);
  const bookingService = new BookingService(
    repository,
    new GoogleCalendarService(supabase),
    new NotificationService(supabase)
  );
  const bookings = await bookingService.listBookings({ ownerId });
  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return a.start_date.localeCompare(b.start_date);
  });
  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

  async function saveBooking(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const parsed = bookingFormSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      redirect("/app/bookings?error=invalid");
    }

    const service = new BookingService(
      new SupabaseBookingRepository(serverSupabase),
      new GoogleCalendarService(serverSupabase),
      new NotificationService(serverSupabase)
    );

    try {
      if (parsed.data.mode === "confirmed") {
        await service.createManualBooking(parsed.data, { ownerId: serverOwnerId });
      } else {
        await service.createPendingBooking(parsed.data, { ownerId: serverOwnerId });
      }
    } catch (error) {
      if (error instanceof BookingDomainError && error.code === "NOT_AVAILABLE") {
        if (error.message.toLowerCase().includes("rezervare confirmata")) {
          redirect("/app/bookings?error=conflict");
        }
        redirect("/app/bookings?error=unavailable");
      }
      redirect("/app/bookings?error=invalid");
    }

    revalidatePath("/app/bookings");
    redirect("/app/bookings?message=saved");
  }

  const successMessage = pageMessage(searchParams?.message);
  const errorMessage = pageError(searchParams?.error);

  if (!property) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Rezervari</h1>
        <section className="panel">
          <p className="text-sm text-ink/70">
            Adauga mai intai detaliile proprietatii.
          </p>
          <Link className="button-primary mt-4 inline-flex" href="/app/property">
            Configureaza proprietatea
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-clay">Rezervari interne</p>
        <h1 className="text-2xl font-bold">Rezervari</h1>
      </div>

      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <section className="panel">
        <h2 className="text-lg font-semibold">Adauga rezervare</h2>
        {rooms.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-ink/70">
              Adauga o camera inainte sa salvezi rezervari.
            </p>
            <Link className="button-secondary mt-3 inline-flex" href="/app/rooms">
              Adauga camera
            </Link>
          </div>
        ) : (
          <ManualBookingForm
            action={saveBooking}
            bookings={bookings}
            propertyId={property.id}
            rooms={rooms}
          />
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Lista rezervari</h2>
        {bookings.length === 0 ? (
          <p className="panel text-sm text-ink/70">
          Nu ai rezervari salvate inca.
          </p>
        ) : (
          sortedBookings.map((booking) => (
            <Link
              className="panel block"
              href={`/app/bookings/${booking.id}`}
              key={booking.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{booking.guest_name}</p>
                  <p className="text-sm text-ink/65">
                    {roomNames.get(booking.room_id) ?? "Camera"} ·{" "}
                    {booking.start_date} - {booking.end_date}
                  </p>
                  <p className="text-sm text-ink/65">
                    {booking.nights_count} nopti · {booking.guests_count} oaspeti ·{" "}
                    {booking.total_estimated_price
                      ? `${booking.total_estimated_price} ${booking.currency}`
                      : "total nesetat"}
                  </p>
                </div>
                <span className="w-fit rounded-md border border-line px-2 py-1 text-xs font-semibold">
                  {statusLabels[booking.status]}
                </span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
