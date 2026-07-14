import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/property/property-form";
import {
  getPropertyFormValues,
  type PropertyFormState
} from "@/domain/properties/form-state";
import { propertyScopedHref } from "@/domain/properties/navigation";
import { propertyFormSchema } from "@/domain/properties/schemas";
import {
  createProperty,
  listOwnerProperties,
  OWNER_PROPERTY_LIMIT,
  PropertyLimitError
} from "@/domain/properties/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewPropertyPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const properties = await listOwnerProperties(supabase, ownerId);
  const limitReached = properties.length >= OWNER_PROPERTY_LIMIT;

  async function createNewProperty(
    _state: PropertyFormState,
    formData: FormData
  ): Promise<PropertyFormState> {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const values = getPropertyFormValues(formData);
    const parsed = propertyFormSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      return {
        ok: false,
        errors: {
          name: fieldErrors.name ?? [],
          city: fieldErrors.city ?? [],
          contact_phone: fieldErrors.contact_phone ?? [],
          contact_email: fieldErrors.contact_email ?? [],
          check_in_time: fieldErrors.check_in_time ?? [],
          check_out_time: fieldErrors.check_out_time ?? [],
          rules: fieldErrors.rules ?? []
        },
        message: "Verifică detaliile proprietății și încearcă din nou.",
        values
      };
    }

    let propertyId: string;

    try {
      const property = await createProperty(serverSupabase, serverOwnerId, parsed.data);
      propertyId = property.id;
    } catch (error) {
      if (error instanceof PropertyLimitError) {
        return {
          ok: false,
          errors: {},
          message: "Ai atins limita de proprietăți pentru planul actual.",
          values
        };
      }

      return {
        ok: false,
        errors: {},
        message: "Nu am putut salva proprietatea. Încearcă din nou.",
        values
      };
    }

    revalidatePath("/app");
    revalidatePath("/app/property");
    redirect(propertyScopedHref("/app/rooms", propertyId));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Proprietăți</p>
          <h1 className="text-2xl font-bold">Adaugă proprietate</h1>
          <p className="mt-1 text-sm text-ink/65">
            Creează o proprietate separată, cu camere, rezervări și pagină publică
            proprii.
          </p>
        </div>
        <Link className="button-secondary min-h-11 justify-center" href="/app/property">
          Proprietățile mele
        </Link>
      </div>

      {limitReached ? (
        <section className="panel">
          <p className="font-semibold text-amber-900">
            Ai atins limita de proprietăți pentru planul actual.
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Pentru MVP poți administra până la {OWNER_PROPERTY_LIMIT} proprietăți.
          </p>
          <Link className="button-secondary mt-4 inline-flex" href="/app/property">
            Înapoi la proprietăți
          </Link>
        </section>
      ) : (
        <PropertyForm property={null} action={createNewProperty} />
      )}
    </div>
  );
}
