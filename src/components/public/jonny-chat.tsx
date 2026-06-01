"use client";

import React, { useState, useTransition } from "react";

type Message = {
  id: string;
  sender: "guest" | "ai";
  content: string;
};

export function JonnyChat({
  propertySlug,
  initialMessage
}: {
  propertySlug: string;
  initialMessage: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "initial", sender: "ai", content: initialMessage }
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const response = await fetch("/api/public/conversations/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ property_slug: propertySlug })
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error);
    setConversationId(payload.data.conversation_id);
    return payload.data.conversation_id as string;
  }

  function sendMessage(formData: FormData) {
    const text = String(formData.get("message") ?? "").trim();
    if (!text) return;

    setInput("");
    setError(null);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), sender: "guest", content: text }
    ]);

    startTransition(async () => {
      try {
        const id = await ensureConversation();
        const response = await fetch("/api/public/conversations/message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            property_slug: propertySlug,
            conversation_id: id,
            message: text
          })
        });
        const payload = await response.json();
        if (!payload.ok) throw new Error(payload.error);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            sender: "ai",
            content: payload.data.message
          }
        ]);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Nu am putut trimite mesajul. Te rugam sa incerci din nou."
        );
      }
    });
  }

  return (
    <section className="panel">
      <h2 className="text-lg font-semibold">Jonny</h2>
      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <div
            className={
              message.sender === "guest"
                ? "ml-auto max-w-[85%] rounded-md bg-clay px-3 py-2 text-sm text-white"
                : "max-w-[85%] rounded-md bg-mist px-3 py-2 text-sm text-ink"
            }
            key={message.id}
          >
            {message.content}
          </div>
        ))}
        {isPending ? (
          <p className="text-sm text-ink/60">Jonny raspunde...</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
      <form action={sendMessage} className="mt-4 flex gap-2">
        <input
          className="input"
          maxLength={1200}
          name="message"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Scrie mesajul tau..."
          value={input}
        />
        <button className="button-primary" disabled={isPending} type="submit">
          Trimite
        </button>
      </form>
    </section>
  );
}
