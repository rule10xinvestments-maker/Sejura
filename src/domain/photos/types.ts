import type { Database } from "@/lib/supabase/database.types";

export type PropertyPhoto = Database["public"]["Tables"]["property_photos"]["Row"];
export type RoomPhoto = Database["public"]["Tables"]["room_photos"]["Row"];
