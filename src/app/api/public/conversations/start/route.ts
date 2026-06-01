import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publicChatJsonError } from "@/app/api/public/conversations/errors";
import { PublicChatError } from "@/domain/public-chat/errors";
import { checkPublicRateLimit } from "@/domain/public-chat/rate-limit";
import { PublicConversationService } from "@/domain/public-chat/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const schema = z.object({
  property_slug: z.string().min(1).max(120)
});

function cookieName(slug: string) {
  return `sejura_public_${slug.replace(/[^a-z0-9-]/gi, "")}`;
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const ip = headers().get("x-forwarded-for") ?? "local";
    if (!checkPublicRateLimit(`start:${ip}:${body.property_slug}`, 20, 60 * 60 * 1000)) {
      throw new PublicChatError("RATE_LIMITED", "Prea multe incercari.");
    }

    const supabase = createSupabaseServiceRoleClient();
    const service = new PublicConversationService(supabase);
    const sessionCookie = cookies().get(cookieName(body.property_slug))?.value;
    const { conversation, context, initialMessage, sessionId } =
      await service.startConversation(body.property_slug, sessionCookie);

    const response = NextResponse.json({
      ok: true,
      data: {
        conversation_id: conversation.id,
        property: {
          name: context.property.name,
          city: context.property.city,
          check_in_time: context.property.check_in_time,
          check_out_time: context.property.check_out_time
        },
        initial_message: initialMessage
      }
    });

    response.cookies.set(cookieName(body.property_slug), sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    return publicChatJsonError(error);
  }
}
