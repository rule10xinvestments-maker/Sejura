import type { PropertyInput } from "@/domain/properties/types";
import { generatePropertySlug } from "@/domain/properties/slug";
import type { AppSupabaseClient } from "@/lib/supabase/types";

export async function getPrimaryProperty(
  supabase: AppSupabaseClient,
  ownerId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  input: PropertyInput
) {
  const existing = await getPrimaryProperty(supabase, ownerId);
  const slug = await generateUniquePropertySlug(
    supabase,
    input.name,
    existing?.id ?? null
  );

  if (!existing) {
    const { count, error: countError } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= 3) {
      throw new Error("Un proprietar poate gestiona maximum 3 proprietati.");
    }
  }

  const payload = {
    ...input,
    slug,
    owner_id: ownerId,
    status: "draft" as const
  };

  const { data, error } = existing
    ? await supabase
        .from("properties")
        .update(payload)
        .eq("id", existing.id)
        .eq("owner_id", ownerId)
        .select("*")
        .single()
    : await supabase.from("properties").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  await ensurePropertyFoundation(supabase, ownerId, data.id);
  return data;
}

async function generateUniquePropertySlug(
  supabase: AppSupabaseClient,
  name: string,
  existingPropertyId: string | null
) {
  const baseSlug = generatePropertySlug(name);
  let query = supabase
    .from("properties")
    .select("id, slug")
    .like("slug", `${baseSlug}%`);

  if (existingPropertyId) {
    query = query.neq("id", existingPropertyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const usedSlugs = new Set((data ?? []).map((property) => property.slug));

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;

  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export async function ensurePropertyFoundation(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const settings = await supabase.from("property_settings").upsert(
    {
      owner_id: ownerId,
      property_id: propertyId,
      ai_enabled: false,
      public_booking_enabled: false,
      allow_auto_confirmation: false
    },
    { onConflict: "property_id" }
  );

  if (settings.error) {
    throw settings.error;
  }

  const publicPage = await supabase.from("property_public_pages").upsert(
    {
      owner_id: ownerId,
      property_id: propertyId,
      is_public: false,
      chat_enabled: false
    },
    { onConflict: "property_id" }
  );

  if (publicPage.error) {
    throw publicPage.error;
  }
}
