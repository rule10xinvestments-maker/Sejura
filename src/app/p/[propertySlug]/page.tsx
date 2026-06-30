import Link from "next/link";
import { SejuraLogo } from "@/components/brand/sejura-logo";
import { JonnyChat } from "@/components/public/jonny-chat";
import { jonnyIntro, PublicConversationService } from "@/domain/public-chat/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

export default async function PublicPropertyPage({
  params
}: {
  params: { propertySlug: string };
}) {
  const supabase = createSupabaseServiceRoleClient();
  const service = new PublicConversationService(supabase);
  const readiness = await service.getPublicPageReadiness(params.propertySlug);
  const context = readiness.context;
  const ownerClient = createSupabaseServerClient();
  const {
    data: { user }
  } = await ownerClient.auth.getUser();
  const isOwnerViewingOwnPublicPage = Boolean(
    user && context?.property.owner_id === user.id
  );

  if (
    !context ||
    readiness.reason === "PROPERTY_NOT_FOUND" ||
    readiness.reason === "PROPERTY_DISABLED" ||
    readiness.reason === "PUBLIC_DISABLED"
  ) {
    return (
      <main className="min-h-[100svh] bg-mist px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <SejuraLogo size="sm" />
          <section className="panel">
            <p>Aceasta pagina de rezervari nu este disponibila momentan.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!readiness.ok) {
    return (
      <main className="min-h-[100svh] bg-mist px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <SejuraLogo size="sm" />
          <section className="panel">
            <p>Rezervarile online nu sunt disponibile momentan pentru aceasta pensiune.</p>
          </section>
        </div>
      </main>
    );
  }

  const rooms = readiness.rooms;

  return (
    <main className="min-h-[100svh] bg-mist">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <SejuraLogo size="sm" />
          <div className="flex flex-wrap justify-end gap-2">
            {isOwnerViewingOwnPublicPage ? (
              <Link className="button-primary min-h-10 px-3 py-2 text-sm" href="/app/rooms">
                Administreaza pensiunea
              </Link>
            ) : null}
            <span className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-moss shadow-soft">
              Pagina pentru oaspeti
            </span>
          </div>
        </header>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-clay">
            Cerere de rezervare prin Sejura
          </p>
          <h1 className="mt-2 text-3xl font-bold">{context.property.name}</h1>
          {context.property.city ? (
            <p className="mt-1 text-ink/70">{context.property.city}</p>
          ) : null}
          {context.property.public_description ? (
            <p className="mt-3 text-ink/75">{context.property.public_description}</p>
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
            <h2 className="text-lg font-semibold">Camere disponibile</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {rooms.map((room) => (
                <li className="rounded-md border border-line p-3" key={room.name}>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-ink/65">
                    Pana la {room.max_guests} oaspeti - de la{" "}
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
