import { JonnyChat } from "@/components/public/jonny-chat";
import { jonnyIntro, PublicConversationService } from "@/domain/public-chat/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export default async function PublicPropertyPage({
  params
}: {
  params: { propertySlug: string };
}) {
  const supabase = createSupabaseServiceRoleClient();
  const service = new PublicConversationService(supabase);
  const context = await service.getPublicPropertyBySlug(params.propertySlug);

  if (!context || !context.publicPage?.is_public || !context.publicPage.chat_enabled) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="panel">
          <p>Aceasta pagina de rezervari nu este disponibila momentan.</p>
        </section>
      </main>
    );
  }

  if (
    !service.isSetupReady(context) ||
    !context.settings?.ai_enabled ||
    !context.settings.public_booking_enabled
  ) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="panel">
          <p>Rezervarile online nu sunt disponibile momentan pentru aceasta pensiune.</p>
        </section>
      </main>
    );
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("name, max_guests, base_price_per_night")
    .eq("property_id", context.property.id)
    .eq("owner_id", context.property.owner_id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!rooms || rooms.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="panel">
          <p>Rezervarile online nu sunt disponibile momentan pentru aceasta pensiune.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mist">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section className="space-y-3">
          <p className="text-sm font-semibold text-clay">
            Asistent de rezervari pentru pensiuni locale
          </p>
          <h1 className="text-3xl font-bold">{context.property.name}</h1>
          {context.property.city ? (
            <p className="text-ink/70">{context.property.city}</p>
          ) : null}
          {context.property.public_description ? (
            <p className="text-ink/75">{context.property.public_description}</p>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="panel">
            <p className="text-sm text-ink/60">Check-in</p>
            <p className="font-semibold">{context.property.check_in_time}</p>
          </div>
          <div className="panel">
            <p className="text-sm text-ink/60">Check-out</p>
            <p className="font-semibold">{context.property.check_out_time}</p>
          </div>
        </section>

        {rooms && rooms.length > 0 ? (
          <section className="panel">
            <h2 className="text-lg font-semibold">Camere</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {rooms.map((room) => (
                <li className="rounded-md border border-line p-3" key={room.name}>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-ink/65">
                    Pana la {room.max_guests} oaspeti · de la{" "}
                    {room.base_price_per_night} RON/noapte
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <JonnyChat propertySlug={params.propertySlug} initialMessage={jonnyIntro} />
      </div>
    </main>
  );
}
