import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PublicConversationService } from "@/domain/public-chat/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const senderLabels: Record<string, string> = {
  guest: "Client",
  ai: "Jonny",
  owner: "Proprietar",
  system: "Sistem",
  tool: "Instrument"
};

export default async function ConversationDetailPage({
  params
}: {
  params: { conversationId: string };
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", params.conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!conversation) notFound();

  const [{ data: messages }, { data: toolCalls }] = await Promise.all([
    supabase
      .from("conversation_messages")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ai_tool_calls")
      .select("id, tool_name, status, error_code, created_at")
      .eq("owner_id", ownerId)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
  ]);

  async function closeConversation() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    await new PublicConversationService(serverSupabase).closeConversation(
      serverOwnerId,
      params.conversationId
    );
    revalidatePath(`/app/conversations/${params.conversationId}`);
    redirect(`/app/conversations/${params.conversationId}`);
  }

  return (
    <div className="space-y-5">
      <Link className="text-sm font-semibold text-clay" href="/app/conversations">
        Inapoi la conversatii
      </Link>

      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-clay">Conversatie</p>
            <h1 className="text-2xl font-bold">
              {conversation.guest_name ?? "Client"}
            </h1>
            {conversation.related_booking_id ? (
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-clay"
                href={`/app/bookings/${conversation.related_booking_id}`}
              >
                Vezi cererea creata
              </Link>
            ) : null}
            {conversation.status === "escalated" ? (
              <p className="mt-3 w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                Necesita atentie
              </p>
            ) : null}
          </div>
          <form action={closeConversation}>
            <button className="button-secondary" type="submit">
              Marcheaza inchisa
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-lg font-semibold">Mesaje</h2>
        <div className="mt-3 space-y-3">
          {(messages ?? []).map((message) => (
            <article className="rounded-md border border-line p-3" key={message.id}>
              <p className="text-xs font-semibold text-clay">
                {senderLabels[message.sender_type] ?? message.sender_type}
              </p>
              <p className="mt-1 text-sm">{message.content}</p>
              <p className="mt-2 text-xs text-ink/50">{message.created_at}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-lg font-semibold">Actiuni Jonny</h2>
        {(toolCalls ?? []).length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {(toolCalls ?? []).map((call) => (
              <li className="rounded-md border border-line p-3" key={call.id}>
                <p className="font-medium">{call.tool_name}</p>
                <p className="text-ink/65">
                  {call.status}
                  {call.error_code ? ` · ${call.error_code}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/70">Nu exista actiuni salvate.</p>
        )}
      </section>
    </div>
  );
}
