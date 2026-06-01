import Link from "next/link";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  open: "Deschisa",
  waiting_for_guest: "In asteptare client",
  waiting_for_owner: "In asteptare proprietar",
  booking_created: "Cerere creata",
  closed: "Inchis",
  escalated: "Escaladat"
};

export default async function ConversationsPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-clay">Jonny</p>
        <h1 className="text-2xl font-bold">Conversatii</h1>
      </div>

      {conversations?.length ? (
        <section className="grid gap-3">
          {conversations.map((conversation) => (
            <Link
              className="panel block"
              href={`/app/conversations/${conversation.id}`}
              key={conversation.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {conversation.guest_name ?? "Client"}
                  </p>
                  <p className="text-sm text-ink/65">
                    Ultimul mesaj: {conversation.last_message_at ?? "Nesetat"}
                  </p>
                </div>
                <span className="w-fit rounded-md border border-line px-2 py-1 text-xs font-semibold">
                  {statusLabels[conversation.status] ?? conversation.status}
                </span>
              </div>
              {conversation.status === "escalated" ? (
                <p className="mt-2 w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                  Necesita atentie
                </p>
              ) : null}
              {conversation.related_booking_id ? (
                <p className="mt-2 text-sm text-ink/65">Cerere creata</p>
              ) : null}
            </Link>
          ))}
        </section>
      ) : (
        <section className="panel">
          <p className="text-sm text-ink/70">Nu exista conversatii inca.</p>
        </section>
      )}
    </div>
  );
}
