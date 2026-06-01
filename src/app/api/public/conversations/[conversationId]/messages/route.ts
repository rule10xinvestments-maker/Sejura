import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { publicChatJsonError } from "@/app/api/public/conversations/errors";
import { PublicChatError } from "@/domain/public-chat/errors";
import { PublicConversationService } from "@/domain/public-chat/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

function cookieName(slug: string) {
  return `sejura_public_${slug.replace(/[^a-z0-9-]/gi, "")}`;
}

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const slug = new URL(request.url).searchParams.get("property_slug");
    if (!slug) {
      throw new PublicChatError("VALIDATION_ERROR", "Lipseste proprietatea.");
    }
    const publicSessionId = cookies().get(cookieName(slug))?.value;
    if (!publicSessionId) {
      throw new PublicChatError("CONVERSATION_ACCESS_DENIED", "Sesiune invalida.");
    }

    const service = new PublicConversationService(createSupabaseServiceRoleClient());
    const conversation = await service.validateConversation(params.conversationId, {
      publicSessionId,
      propertySlug: slug
    });
    const messages = await service.listMessages(conversation);
    return NextResponse.json({
      ok: true,
      data: {
        messages: messages.map((message) => ({
          id: message.id,
          sender_type: message.sender_type,
          content: message.content,
          created_at: message.created_at
        }))
      }
    });
  } catch (error) {
    return publicChatJsonError(error);
  }
}
