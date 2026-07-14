import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getActivationStatus } from "@/domain/activation/service";
import { getSelectedProperty } from "@/domain/properties/service";
import { listRooms } from "@/domain/rooms/service";
import { getPropertySettings } from "@/domain/settings/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: { propertyId?: string };
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getSelectedProperty(supabase, ownerId, searchParams?.propertyId);
  const rooms = property ? await listRooms(supabase, ownerId, property.id) : [];
  const settings = property
    ? await getPropertySettings(supabase, ownerId, property.id)
    : null;
  const hasPropertyDetails = Boolean(
    property?.name &&
      property.city &&
      property.contact_phone &&
      property.contact_email &&
      property.check_in_time &&
      property.check_out_time &&
      property.rules
  );

  return (
    <OnboardingFlow
      activation={getActivationStatus({ property, settings, rooms })}
      hasPropertyDetails={hasPropertyDetails}
      hasRoom={rooms.some((room) => room.status === "active")}
    />
  );
}
