import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InternalRoomCalendar } from "@/components/calendar/internal-room-calendar";
import { roomBlockSchema } from "@/domain/bookings/schemas";
import { BookingService, RoomBlockService } from "@/domain/bookings/service";
import { roomBlockCopy } from "@/domain/bookings/room-occupancy-summary";
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
  if (key === "removed") return "Blocarea a fost ștearsă.";
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
            Adaugă mai întâi detaliile proprietății.
          </p>
          <Link className="button-primary mt-4 inline-flex" href="/app/property">
            Configurează proprietatea
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
        <p className="mt-1 text-sm text-ink/65">
          Ocupare pe camere în calendarul intern Sejura.
        </p>
      </div>

      {pageMessage(searchParams?.message) ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {pageMessage(searchParams?.message)}
        </p>
      ) : null}
      {searchParams?.error === "invalid" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Verifică intervalul și încearcă din nou.
        </p>
      ) : null}

      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Astăzi</h2>
            <p className="text-sm text-ink/65">
              Alege rapid perioada pentru calendarul intern.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="button-secondary" href={`/app/calendar?start=${previousStart}`}>
              Perioada anterioară
            </Link>
            <Link className="button-secondary" href="/app/calendar">
              Astăzi
            </Link>
            <Link className="button-secondary" href={`/app/calendar?start=${nextStart}`}>
              Perioada următoare
            </Link>
          </div>
        </div>
      </section>

      <InternalRoomCalendar
        rooms={rooms}
        bookings={bookings}
        roomBlocks={roomBlocks}
        startDate={startDate}
        daysCount={daysCount}
        checkInTime={property.check_in_time}
        checkOutTime={property.check_out_time}
      />

      <section className="panel">
        <h2 className="text-lg font-semibold">Blochează o cameră</h2>
        {rooms.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">
            Adaugă o cameră înainte să blochezi intervale.
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
              Până la
              <input className="input" name="endDate" required type="date" />
            </label>
            <button className="button-primary sm:col-span-2" type="submit">
              Salvează blocarea
            </button>
          </form>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Intervale blocate</h2>
        {roomBlocks.length === 0 ? (
          <p className="panel text-sm text-ink/70">Nu există blocări salvate.</p>
        ) : (
          roomBlocks.map((block) => {
            const copy = roomBlockCopy(block);

            return (
              <div className="panel" key={block.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {roomNames.get(block.room_id) ?? "Camera"}
                    </p>
                    <p className="text-sm text-ink/65">{copy.period}</p>
                    <p className="text-sm text-ink/65">{copy.reason}</p>
                  </div>
                  <form action={deleteBlock}>
                    <input name="blockId" type="hidden" value={block.id} />
                    <button className="button-secondary" type="submit">
                      Șterge blocarea
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
