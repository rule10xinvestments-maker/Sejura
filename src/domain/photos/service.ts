import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { PropertyPhoto, RoomPhoto } from "@/domain/photos/types";

export const PHOTO_BUCKET = "sejura-photos";
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_PHOTO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

type PhotoFile = File & { size: number; type: string; name: string };

function assertSupportedPhoto(file: PhotoFile) {
  if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Fisierul trebuie sa fie jpg, jpeg, png sau webp.");
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Poza trebuie sa fie mai mica de 10 MB.");
  }
}

function photoExtension(file: PhotoFile) {
  return ACCEPTED_PHOTO_TYPES.get(file.type) ?? "jpg";
}

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function isMissingPhotoSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string };
  return (
    record.code === "42P01" ||
    record.message?.includes("property_photos") ||
    record.message?.includes("room_photos")
  );
}

function photoPath(parts: {
  ownerId: string;
  propertyId: string;
  roomId?: string;
  file: PhotoFile;
}) {
  const name = safeName(parts.file.name.replace(/\.[^.]+$/, "")) || "poza";
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  const prefix = parts.roomId
    ? `${parts.ownerId}/${parts.propertyId}/rooms/${parts.roomId}`
    : `${parts.ownerId}/${parts.propertyId}/property`;

  return `${prefix}/${unique}-${name}.${photoExtension(parts.file)}`;
}

async function signedUrl(supabase: AppSupabaseClient, path: string) {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
}

async function signPropertyPhotos(
  supabase: AppSupabaseClient,
  photos: PropertyPhoto[]
) {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      public_url: await signedUrl(supabase, photo.storage_path)
    }))
  );
}

async function signRoomPhotos(supabase: AppSupabaseClient, photos: RoomPhoto[]) {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      public_url: await signedUrl(supabase, photo.storage_path)
    }))
  );
}

export async function listPropertyPhotos(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("property_photos")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingPhotoSchemaError(error)) return [];
    throw error;
  }
  return signPropertyPhotos(supabase, data ?? []);
}

export async function listRoomPhotos(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("room_photos")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingPhotoSchemaError(error)) return [];
    throw error;
  }
  return signRoomPhotos(supabase, data ?? []);
}

export async function listPublicPropertyPhotos(
  supabase: AppSupabaseClient,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("property_photos")
    .select("*")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingPhotoSchemaError(error)) return [];
    throw error;
  }
  return signPropertyPhotos(supabase, data ?? []);
}

export async function listPublicRoomPhotos(
  supabase: AppSupabaseClient,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("room_photos")
    .select("*")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return signRoomPhotos(supabase, data ?? []);
}

async function assertPropertyOwned(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) {
    throw new Error("Proprietatea nu apartine acestui proprietar.");
  }
}

async function assertRoomOwned(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string
) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, property_id")
    .eq("id", roomId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .single();

  if (error || !data) {
    throw new Error("Camera nu apartine acestei proprietati.");
  }
}

async function nextPropertySortOrder(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const photos = await listPropertyPhotos(supabase, ownerId, propertyId);
  return photos.length;
}

async function nextRoomSortOrder(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string
) {
  const { data, error } = await supabase
    .from("room_photos")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId);

  if (error) throw error;
  return data?.length ?? 0;
}

export async function uploadPropertyPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  file: PhotoFile
) {
  assertSupportedPhoto(file);
  await assertPropertyOwned(supabase, ownerId, propertyId);

  const existingPhotos = await listPropertyPhotos(supabase, ownerId, propertyId);
  const storagePath = photoPath({ ownerId, propertyId, file });
  const upload = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (upload.error) throw upload.error;

  const { data, error } = await supabase
    .from("property_photos")
    .insert({
      owner_id: ownerId,
      property_id: propertyId,
      storage_path: storagePath,
      public_url: storagePath,
      sort_order: await nextPropertySortOrder(supabase, ownerId, propertyId),
      is_cover: existingPhotos.length === 0
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadRoomPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string,
  file: PhotoFile
) {
  assertSupportedPhoto(file);
  await assertRoomOwned(supabase, ownerId, propertyId, roomId);

  const existingCount = await nextRoomSortOrder(supabase, ownerId, propertyId, roomId);
  const storagePath = photoPath({ ownerId, propertyId, roomId, file });
  const upload = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (upload.error) throw upload.error;

  const { data, error } = await supabase
    .from("room_photos")
    .insert({
      owner_id: ownerId,
      property_id: propertyId,
      room_id: roomId,
      storage_path: storagePath,
      public_url: storagePath,
      sort_order: existingCount,
      is_cover: existingCount === 0
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setPropertyCoverPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  photoId: string
) {
  await assertPropertyOwned(supabase, ownerId, propertyId);
  const { data: photo, error: photoError } = await supabase
    .from("property_photos")
    .select("id")
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .single();
  if (photoError || !photo) throw new Error("Poza nu apartine proprietatii.");

  await supabase
    .from("property_photos")
    .update({ is_cover: false })
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId);

  const { error } = await supabase
    .from("property_photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId);
  if (error) throw error;
}

export async function setRoomCoverPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string,
  photoId: string
) {
  await assertRoomOwned(supabase, ownerId, propertyId, roomId);
  const { data: photo, error: photoError } = await supabase
    .from("room_photos")
    .select("id")
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId)
    .single();
  if (photoError || !photo) throw new Error("Poza nu apartine camerei.");

  await supabase
    .from("room_photos")
    .update({ is_cover: false })
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId);

  const { error } = await supabase
    .from("room_photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId);
  if (error) throw error;
}

export async function removePropertyPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  photoId: string
) {
  const { data: photo, error: photoError } = await supabase
    .from("property_photos")
    .select("*")
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .single();
  if (photoError || !photo) throw new Error("Poza nu apartine proprietatii.");

  const { error: deleteError } = await supabase
    .from("property_photos")
    .delete()
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId);
  if (deleteError) throw deleteError;

  const storageDelete = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (storageDelete.error) throw storageDelete.error;

  await ensurePropertyCoverPhoto(supabase, ownerId, propertyId);
}

export async function removeRoomPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string,
  photoId: string
) {
  const { data: photo, error: photoError } = await supabase
    .from("room_photos")
    .select("*")
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId)
    .single();
  if (photoError || !photo) throw new Error("Poza nu apartine camerei.");

  const { error: deleteError } = await supabase
    .from("room_photos")
    .delete()
    .eq("id", photoId)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId);
  if (deleteError) throw deleteError;

  const storageDelete = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (storageDelete.error) throw storageDelete.error;

  await ensureRoomCoverPhoto(supabase, ownerId, propertyId, roomId);
}

async function ensurePropertyCoverPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const photos = await listPropertyPhotos(supabase, ownerId, propertyId);
  if (photos.length === 0 || photos.some((photo) => photo.is_cover)) return;
  await setPropertyCoverPhoto(supabase, ownerId, propertyId, photos[0].id);
}

async function ensureRoomCoverPhoto(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  roomId: string
) {
  const { data, error } = await supabase
    .from("room_photos")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .eq("room_id", roomId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  const photos = data ?? [];
  if (photos.length === 0 || photos.some((photo) => photo.is_cover)) return;
  await setRoomCoverPhoto(supabase, ownerId, propertyId, roomId, photos[0].id);
}

export function propertyCoverPhoto(photos: PropertyPhoto[]) {
  return photos.find((photo) => photo.is_cover) ?? photos[0] ?? null;
}

export function roomCoverPhoto(photos: RoomPhoto[], roomId: string) {
  const roomPhotos = photos.filter((photo) => photo.room_id === roomId);
  return roomPhotos.find((photo) => photo.is_cover) ?? roomPhotos[0] ?? null;
}
