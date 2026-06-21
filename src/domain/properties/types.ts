import type { Database } from "@/lib/supabase/database.types";

export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInput = {
  name: string;
  city: string;
  contact_phone: string;
  contact_email: string;
  check_in_time: string;
  check_out_time: string;
  rules: string;
};
