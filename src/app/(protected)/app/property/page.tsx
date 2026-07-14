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
  getSelectedProperty,
  listOwnerProperties,
  PropertyLimitError,
  updateProperty
} from "@/domain/properties/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  propertyId?: string;
};

function statusCopy(status: string) {
  if (status === "disabled") return "Dezactivată";
  if (status === "ready_pending_mode") return "Pregătită";
  if (status === "ready_auto_confirm_mode") return "Pregătită";
  if (status === "setup_incomplete") return "În configurare";
  return "Draft";
}

export default async function PropertyPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const properties = await listOwnerProperties(supabase, ownerId);
  const property = await getSelectedProperty(
    supabase,
    ownerId,
    searchParams?.propertyId
  );

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
          city: fieldErrors.city ?? [],
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

    let savedPropertyId: string;

    try {
      const propertyId = String(formData.get("property_id") ?? "");
      const savedProperty = propertyId
        ? await updateProperty(
            serverSupabase,
            serverOwnerId,
            propertyId,
            parsed.data
          )
        : await createProperty(serverSupabase, serverOwnerId, parsed.data);
      savedPropertyId = savedProperty.id;
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
        message: "Nu am putut salva proprietatea. Incearca din nou.",
        values
      };
    }

    revalidatePath("/app");
    revalidatePath("/app/property");
    redirect(propertyScopedHref("/app/rooms", savedPropertyId));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Proprietate</p>
          <h1 className="text-2xl font-bold">Detalii unitate</h1>
        </div>
        <Link className="button-primary min-h-11 justify-center" href="/app/properties/new">
          Adaugă proprietate
        </Link>
      </div>

      <section className="panel">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Proprietățile mele</h2>
            <p className="text-sm text-ink/65">
              Alege ce proprietate administrezi în camere, rezervări și calendar.
            </p>
          </div>
          {properties.length >= 3 ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Ai atins limita de proprietăți pentru planul actual.
            </span>
          ) : null}
        </div>

        {properties.length === 0 ? (
          <p className="mt-4 text-sm text-ink/70">
            Nu ai încă o proprietate. Adaugă prima proprietate pentru pilot.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {properties.map((item) => {
              const isActive = property?.id === item.id;

              return (
                <article
                  className={
                    isActive
                      ? "rounded-lg border border-moss bg-mist p-4"
                      : "rounded-lg border border-line bg-white p-4"
                  }
                  key={item.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {isActive ? (
                          <span className="rounded-full bg-moss px-2 py-1 text-xs font-semibold text-white">
                            Proprietate activă
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-ink/65">
                        {item.city ?? "Localitate nesetată"} · {statusCopy(item.status)}
                      </p>
                      <Link
                        className="mt-1 inline-flex text-sm font-semibold text-clay"
                        href={`/p/${item.slug}`}
                      >
                        Pagina publică: /p/{item.slug}
                      </Link>
                    </div>
                    <Link
                      className="button-secondary min-h-11 justify-center"
                      href={propertyScopedHref("/app/property", item.id)}
                    >
                      Administrează
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {property ? (
        <PropertyForm property={property} action={saveProperty} />
      ) : (
        <section className="panel">
          <p className="text-sm text-ink/70">
            Adaugă o proprietate ca să configurezi camerele și pagina publică.
          </p>
          <Link className="button-primary mt-4 inline-flex" href="/app/properties/new">
            Adaugă proprietate
          </Link>
        </section>
      )}
    </div>
  );
}
