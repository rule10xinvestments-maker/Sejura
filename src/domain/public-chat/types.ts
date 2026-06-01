import type { Database } from "@/lib/supabase/database.types";

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationMessage =
  Database["public"]["Tables"]["conversation_messages"]["Row"];
export type AiToolCall = Database["public"]["Tables"]["ai_tool_calls"]["Row"];

export type PublicPropertyContext = {
  property: Database["public"]["Tables"]["properties"]["Row"];
  publicPage: Database["public"]["Tables"]["property_public_pages"]["Row"] | null;
  settings: Database["public"]["Tables"]["property_settings"]["Row"] | null;
};

export type SessionContext = {
  publicSessionId: string;
  propertySlug?: string;
};
