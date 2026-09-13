import { redirect } from "next/navigation";
import { propertyScopedHref } from "@/domain/properties/navigation";

export default function OnboardingPage({
  searchParams
}: {
  searchParams?: { propertyId?: string };
}) {
  redirect(propertyScopedHref("/app/property", searchParams?.propertyId));
}
