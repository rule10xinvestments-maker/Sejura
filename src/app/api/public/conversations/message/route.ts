import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publicChatJsonError } from "@/app/api/public/conversations/errors";
import { PublicChatError } from "@/domain/public-chat/errors";
import { checkPublicRateLimit } from "@/domain/public-chat/rate-limit";
import { AiReceptionistService } from "@/domain/public-chat/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const schema = z.object({
  property_slug: z.string().min(1).max(120),
  conversation_id: z.string().uuid(),
  message: z.string().trim().min(1).max(1200)
});

function cookieName(slug: string) {
  return `sejura_public_${slug.replace(/[^a-z0-9-]/gi, "")}`;
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const publicSessionId = cookies().get(cookieName(body.property_slug))?.value;
    if (!publicSessionId) {
      throw new PublicChatError("CONVERSATION_ACCESS_DENIED", "Sesiune invalida.");
    }

    const ip = headers().get("x-forwarded-for") ?? "local";
    if (
      !checkPublicRateLimit(
        `message:${ip}:${body.property_slug}:${publicSessionId}`,
        20,
        60 * 1000
      )
    ) {
      throw new PublicChatError("RATE_LIMITED", "Prea multe mesaje.");
    }

    const result = await new AiReceptionistService(
      createSupabaseServiceRoleClient()
    ).handlePublicMessage(body.conversation_id, body.message, {
      publicSessionId,
      propertySlug: body.property_slug
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return publicChatJsonError(error);
  }
}
