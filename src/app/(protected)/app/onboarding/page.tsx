import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getActivationStatus } from "@/domain/activation/service";
import { getPrimaryProperty } from "@/domain/properties/service";
import { listRooms } from "@/domain/rooms/service";
import { getPropertySettings } from "@/domain/settings/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const rooms = property ? await listRooms(supabase, ownerId, property.id) : [];
  const settings = property
    ? await getPropertySettings(supabase, ownerId, property.id)
    : null;

  return (
    <OnboardingFlow
      activation={getActivationStatus({ property, settings, rooms })}
      hasProperty={Boolean(property)}
      hasRoom={rooms.some((room) => room.status === "active")}
    />
  );
}
