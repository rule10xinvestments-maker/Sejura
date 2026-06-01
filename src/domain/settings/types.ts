import type { Database } from "@/lib/supabase/database.types";

export type PropertySettings =
  Database["public"]["Tables"]["property_settings"]["Row"];
