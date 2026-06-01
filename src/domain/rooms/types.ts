import type { Database } from "@/lib/supabase/database.types";

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomInput = {
  name: string;
  max_guests: number;
  base_price_per_night: number;
  status: "active" | "inactive";
};
