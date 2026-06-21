import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildRoomOccupancyCalendar } from "@/domain/bookings/occupancy-calendar";
import { roomBlockSchema } from "@/domain/bookings/schemas";
import { BookingService, RoomBlockService } from "@/domain/bookings/service";
import { bookingStatusLabels } from "@/domain/bookings/status-labels";
import type { OccupancyCell } from "@/domain/bookings/occupancy-calendar";
import { SupabaseBookingRepository } from "@/domain/bookings/supabase-repository";
import { getPrimaryProperty } from "@/domain/properties/service";
import { listRooms } from "@/domain/rooms/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  error?: string;
  message?: string;
  start?: string;
};

function pageMessage(key?: string) {
  if (key === "blocked") return "Intervalul a fost blocat.";
  if (key === "removed") return "Blocarea a fost stearsa.";
  return null;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function safeStartDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dateOnly(new Date());
}

function cellClass(cell: OccupancyCell) {
  if (cell.status === "occupied") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (cell.status === "pending") return "border-amber-200 bg-amber-50 text-amber-900";
  if (cell.status === "blocked") return "border-stone-300 bg-stone-100 text-stone-800";
  return "border-line bg-white text-ink/60";
}

export default async function CalendarPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const rooms = property ? await listRooms(supabase, ownerId, property.id) : [];
  const repository = new SupabaseBookingRepository(supabase);
  const bookingService = new BookingService(repository);
  const blockService = new RoomBlockService(repository);
  const bookings = await bookingService.listBookings({ ownerId });
  const roomBlocks = await blockService.listRoomBlocks({ ownerId });
  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));
  const startDate = safeStartDate(searchParams?.start);
  const daysCount = 30;
  const occupancy = buildRoomOccupancyCalendar({
    rooms,
    bookings,
    roomBlocks,
    startDate,
    daysCount
  });
  const previousStart = addDays(startDate, -daysCount);
  const nextStart = addDays(startDate, daysCount);

  async function createBlock(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const parsed = roomBlockSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      redirect("/app/calendar?error=invalid");
    }

    const service = new RoomBlockService(
      new SupabaseBookingRepository(serverSupabase)
    );
    await service.createRoomBlock(parsed.data, { ownerId: serverOwnerId });
    revalidatePath("/app/calendar");
    redirect("/app/calendar?message=blocked");
  }

  async function deleteBlock(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const service = new RoomBlockService(
      new SupabaseBookingRepository(serverSupabase)
    );
    await service.deleteRoomBlock(String(formData.get("blockId")), {
      ownerId: serverOwnerId
    });
    revalidatePath("/app/calendar");
    redirect("/app/calendar?message=removed");
  }

  if (!property) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Calendar intern</h1>
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
        <p className="text-sm font-semibold text-clay">Disponibilitate</p>
        <h1 className="text-2xl font-bold">Calendar intern</h1>
      </div>

      {pageMessage(searchParams?.message) ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {pageMessage(searchParams?.message)}
        </p>
      ) : null}
      {searchParams?.error === "invalid" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Verifica intervalul si incearca din nou.
        </p>
      ) : null}

      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ocupare camere</h2>
            <p className="text-sm text-ink/65">
              {startDate} - {addDays(startDate, daysCount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="button-secondary" href={`/app/calendar?start=${previousStart}`}>
              Perioada anterioara
            </Link>
            <Link className="button-secondary" href="/app/calendar">
              Azi
            </Link>
            <Link className="button-secondary" href={`/app/calendar?start=${nextStart}`}>
              Perioada urmatoare
            </Link>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-ink/70">
            Adauga o camera ca sa vezi calendarul de ocupare.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-40 border-b border-line bg-white p-2 text-sm font-semibold">
                    Camera
                  </th>
                  {occupancy.dates.map((date) => (
                    <th
                      className="min-w-28 border-b border-line p-2 font-semibold text-ink/70"
                      key={date}
                    >
                      {date.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {occupancy.rows.map((row) => (
                  <tr key={row.room.id}>
                    <th className="sticky left-0 z-10 border-b border-line bg-white p-2 text-sm font-semibold">
                      {row.room.name}
                    </th>
                    {row.cells.map((cell) => {
                      const content = (
                        <div
                          className={`min-h-20 rounded-md border p-2 ${cellClass(cell)}`}
                        >
                          <p className="font-semibold">{cell.label}</p>
                          {cell.booking ? (
                            <>
                              <p className="mt-1 truncate">{cell.booking.guest_name}</p>
                              <p className="truncate">
                                {bookingStatusLabels[cell.booking.status]}
                              </p>
                              <p className="truncate">
                                {cell.booking.guests_count} oaspeti
                              </p>
                            </>
                          ) : null}
                          {cell.block?.reason ? (
                            <p className="mt-1 truncate">{cell.block.reason}</p>
                          ) : null}
                        </div>
                      );

                      return (
                        <td className="border-b border-line p-1 align-top" key={cell.date}>
                          {cell.booking ? (
                            <Link href={`/app/bookings/${cell.booking.id}`}>
                              {content}
                            </Link>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="text-lg font-semibold">Blocheaza o camera</h2>
        {rooms.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">
            Adauga o camera inainte sa blochezi intervale.
          </p>
        ) : (
          <form action={createBlock} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="propertyId" type="hidden" value={property.id} />
            <label className="grid gap-1 text-sm font-medium">
              Camera/unitate
              <select className="input" name="roomId">
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Motiv
              <input className="input" name="reason" placeholder="Ex. renovare" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              De la
              <input className="input" name="startDate" required type="date" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Pana la
              <input className="input" name="endDate" required type="date" />
            </label>
            <button className="button-primary sm:col-span-2" type="submit">
              Salveaza blocarea
            </button>
          </form>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Rezervari confirmate</h2>
        {bookings.filter((booking) => booking.status === "confirmed").length === 0 ? (
          <p className="panel text-sm text-ink/70">Nu exista rezervari confirmate.</p>
        ) : (
          bookings
            .filter((booking) => booking.status === "confirmed")
            .map((booking) => (
              <Link
                className="panel block"
                href={`/app/bookings/${booking.id}`}
                key={booking.id}
              >
                <p className="font-semibold">{booking.guest_name}</p>
                <p className="text-sm text-ink/65">
                  {roomNames.get(booking.room_id) ?? "Camera"} ·{" "}
                  {booking.start_date} - {booking.end_date}
                </p>
              </Link>
            ))
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Intervale blocate</h2>
        {roomBlocks.length === 0 ? (
          <p className="panel text-sm text-ink/70">Nu exista blocari salvate.</p>
        ) : (
          roomBlocks.map((block) => (
            <div className="panel" key={block.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {roomNames.get(block.room_id) ?? "Camera"}
                  </p>
                  <p className="text-sm text-ink/65">
                    {block.start_date} - {block.end_date}
                  </p>
                  {block.reason ? (
                    <p className="text-sm text-ink/65">{block.reason}</p>
                  ) : null}
                </div>
                <form action={deleteBlock}>
                  <input name="blockId" type="hidden" value={block.id} />
                  <button className="button-secondary" type="submit">
                    Sterge blocarea
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
