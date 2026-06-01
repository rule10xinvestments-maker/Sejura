import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";
import type { PropertySettings } from "@/domain/settings/types";

export type ActivationStatus = {
  ready: boolean;
  missingRequirements: string[];
};

export function getActivationStatus({
  property,
  settings,
  rooms
}: {
  property: Property | null;
  settings: PropertySettings | null;
  rooms: Room[];
}): ActivationStatus {
  const missingRequirements: string[] = [];

  if (!property) {
    missingRequirements.push("Adauga detaliile proprietatii.");
  } else {
    if (!property.contact_email || !property.contact_phone) {
      missingRequirements.push("Completeaza datele de contact.");
    }

    if (!property.check_in_time || !property.check_out_time) {
      missingRequirements.push("Completeaza orele de check-in si check-out.");
    }

    if (!property.rules) {
      missingRequirements.push("Adauga regulile casei.");
    }
  }

  if (!rooms.some((room) => room.status === "active")) {
    missingRequirements.push("Adauga cel putin o camera fizica activa.");
  }

  if (!settings) {
    missingRequirements.push("Setarile sigure ale proprietatii lipsesc.");
  } else {
    if (settings.ai_enabled) {
      missingRequirements.push("AI trebuie sa ramana dezactivat in Sprint 1.");
    }

    if (settings.public_booking_enabled) {
      missingRequirements.push(
        "Rezervarile publice nu pot fi activate cat timp AI este dezactivat."
      );
    }

    if (settings.allow_auto_confirmation) {
      missingRequirements.push("Confirmarea automata trebuie sa ramana dezactivata.");
    }
  }

  return {
    ready: missingRequirements.length === 0,
    missingRequirements
  };
}
