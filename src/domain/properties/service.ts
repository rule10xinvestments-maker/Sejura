import type { PropertyInput } from "@/domain/properties/types";
import { generatePropertySlug } from "@/domain/properties/slug";
import type { AppSupabaseClient } from "@/lib/supabase/types";

export const OWNER_PROPERTY_LIMIT = 3;

export class PropertyLimitError extends Error {
  constructor() {
    super("Ai atins limita de proprietăți pentru planul actual.");
    this.name = "PropertyLimitError";
  }
}

export async function listOwnerProperties(
  supabase: AppSupabaseClient,
  ownerId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPrimaryProperty(
  supabase: AppSupabaseClient,
  ownerId: string
) {
  const properties = await listOwnerProperties(supabase, ownerId);
  return properties[0] ?? null;
}

export async function getOwnerProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", propertyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSelectedProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId?: string | null
) {
  if (propertyId) {
    return getOwnerProperty(supabase, ownerId, propertyId);
  }

  return getPrimaryProperty(supabase, ownerId);
}

async function ensurePropertyLimit(
  supabase: AppSupabaseClient,
  ownerId: string
) {
  const { count, error: countError } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) >= OWNER_PROPERTY_LIMIT) {
    throw new PropertyLimitError();
  }
}

export async function createProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  input: PropertyInput
) {
  await ensurePropertyLimit(supabase, ownerId);
  const slug = await generateUniquePropertySlug(
    supabase,
    input.name,
    null
  );

  const payload = {
    ...input,
    slug,
    owner_id: ownerId,
    status: "draft" as const
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await ensurePropertyFoundation(supabase, ownerId, data.id);
  return data;
}

export async function updateProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  input: PropertyInput
) {
  const existing = await getOwnerProperty(supabase, ownerId, propertyId);

  if (!existing) {
    throw new Error("Proprietatea nu aparține acestui proprietar.");
  }

  const slug = await generateUniquePropertySlug(supabase, input.name, propertyId);
  const payload = {
    ...input,
    slug,
    owner_id: ownerId,
    status: existing.status
  };

  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await ensurePropertyFoundation(supabase, ownerId, data.id);
  return data;
}

export async function upsertProperty(
  supabase: AppSupabaseClient,
  ownerId: string,
  input: PropertyInput
) {
  const existing = await getPrimaryProperty(supabase, ownerId);

  if (existing) {
    return updateProperty(supabase, ownerId, existing.id, input);
  }

  return createProperty(supabase, ownerId, input);
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
      allow_auto_confirmation: false,
      calendar_required_for_confirmation: false
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
