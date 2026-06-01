import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/property/property-form";
import {
  getPropertyFormValues,
  type PropertyFormState
} from "@/domain/properties/form-state";
import { getPrimaryProperty, upsertProperty } from "@/domain/properties/service";
import { propertyFormSchema } from "@/domain/properties/schemas";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PropertyPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);

  async function saveProperty(
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
          contact_phone: fieldErrors.contact_phone ?? [],
          contact_email: fieldErrors.contact_email ?? [],
          check_in_time: fieldErrors.check_in_time ?? [],
          check_out_time: fieldErrors.check_out_time ?? [],
          rules: fieldErrors.rules ?? []
        },
        message: "Verifica detaliile proprietatii si incearca din nou.",
        values
      };
    }

    try {
      await upsertProperty(serverSupabase, serverOwnerId, parsed.data);
    } catch {
      return {
        ok: false,
        errors: {},
        message: "Nu am putut salva proprietatea. Incearca din nou.",
        values
      };
    }

    revalidatePath("/app");
    redirect("/app/rooms");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Proprietate</p>
        <h1 className="text-2xl font-bold">Detalii unitate</h1>
      </div>
      <PropertyForm property={property} action={saveProperty} />
    </div>
  );
}
