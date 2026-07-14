"use client";

import React from "react";
import { useState, useTransition } from "react";
import {
  PROPERTY_FORM_INITIAL_STATE,
  type PropertyFormState
} from "@/domain/properties/form-state";
import { generatePropertySlug } from "@/domain/properties/slug";
import { normalizePropertyTime } from "@/domain/properties/time";
import type { Property } from "@/domain/properties/types";

type PropertyFormProps = {
  property: Property | null;
  action: (
    state: PropertyFormState,
    formData: FormData
  ) => Promise<PropertyFormState | undefined>;
};

function getTimeValue(value: string | null | undefined, fallback: string) {
  const normalized = normalizePropertyTime(value ?? fallback);
  return typeof normalized === "string" ? normalized : fallback;
}

export function PropertyForm({ property, action }: PropertyFormProps) {
  const [state, setState] = useState<PropertyFormState | undefined>(
    PROPERTY_FORM_INITIAL_STATE
  );
  const [isPending, startTransition] = useTransition();
  const [propertyName, setPropertyName] = useState(property?.name ?? "");
  const currentState = state ?? PROPERTY_FORM_INITIAL_STATE;
  const hasPublicLinkSource = Boolean(propertyName.trim() || property?.slug);
  const generatedSlug = propertyName.trim()
    ? generatePropertySlug(propertyName)
    : property?.slug;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = await action(currentState, formData);
      setState(nextState ?? PROPERTY_FORM_INITIAL_STATE);
    });
  }

  return (
    <form className="panel space-y-4" onSubmit={onSubmit}>
      <input name="property_id" type="hidden" value={property?.id ?? ""} />
      <label className="block space-y-1">
        <span className="label">Nume proprietate</span>
        <input
          aria-describedby={
            currentState.errors.name?.length ? "property-name-error" : undefined
          }
          aria-invalid={Boolean(currentState.errors.name?.length)}
          className="field"
          defaultValue={currentState.values.name ?? property?.name ?? ""}
          name="name"
          onChange={(event) => setPropertyName(event.currentTarget.value)}
        />
        {currentState.errors.name?.[0] ? (
          <span className="text-sm text-red-700" id="property-name-error">
            {currentState.errors.name[0]}
          </span>
        ) : null}
      </label>

      <div className="block space-y-1">
        <label className="label block" htmlFor="property-city">
          Oras / localitate
        </label>
        <input
          aria-describedby={
            currentState.errors.city?.length ? "property-city-error" : undefined
          }
          aria-invalid={Boolean(currentState.errors.city?.length)}
          className="field"
          defaultValue={currentState.values.city ?? property?.city ?? ""}
          id="property-city"
          name="city"
        />
        <span className="block text-sm text-ink/65">
          Apare pe pagina publica si il ajuta pe oaspete sa recunoasca proprietatea.
        </span>
        {currentState.errors.city?.[0] ? (
          <span className="text-sm text-red-700" id="property-city-error">
            {currentState.errors.city[0]}
          </span>
        ) : null}
      </div>

      <div className="rounded-md border border-line bg-mist p-3">
        <p className="label">Link public rezervat</p>
        <p className="mt-1 text-sm text-ink/65">
          {"\u00cel vom folosi mai t\u00e2rziu pentru pagina public\u0103 a pensiunii."}
        </p>
        {hasPublicLinkSource && generatedSlug ? (
          <p className="mt-3 rounded-md bg-white px-3 py-2 font-mono text-sm text-ink">
            Link public rezervat: /p/{generatedSlug}
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-ink">
            {"\u00cel vom genera automat din numele propriet\u0103\u021bii."}
          </p>
        )}
      </div>

      <label className="block space-y-1">
        <span className="label">Telefon contact</span>
        <input
          aria-describedby={
            currentState.errors.contact_phone?.length
              ? "property-phone-error"
              : undefined
          }
          aria-invalid={Boolean(currentState.errors.contact_phone?.length)}
          className="field"
          defaultValue={
            currentState.values.contact_phone ?? property?.contact_phone ?? ""
          }
          name="contact_phone"
        />
        {currentState.errors.contact_phone?.[0] ? (
          <span className="text-sm text-red-700" id="property-phone-error">
            {currentState.errors.contact_phone[0]}
          </span>
        ) : null}
      </label>

      <label className="block space-y-1">
        <span className="label">Email contact</span>
        <input
          aria-describedby={
            currentState.errors.contact_email?.length
              ? "property-email-error"
              : undefined
          }
          aria-invalid={Boolean(currentState.errors.contact_email?.length)}
          className="field"
          defaultValue={
            currentState.values.contact_email ?? property?.contact_email ?? ""
          }
          name="contact_email"
          type="email"
        />
        {currentState.errors.contact_email?.[0] ? (
          <span className="text-sm text-red-700" id="property-email-error">
            {currentState.errors.contact_email[0]}
          </span>
        ) : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="label">Check-in</span>
          <input
            aria-describedby={
              currentState.errors.check_in_time?.length
                ? "property-check-in-error property-time-helper"
                : "property-time-helper"
            }
            aria-invalid={Boolean(currentState.errors.check_in_time?.length)}
            className="field"
            defaultValue={getTimeValue(
              currentState.values.check_in_time ?? property?.check_in_time,
              "15:00"
            )}
            name="check_in_time"
            type="time"
          />
          {currentState.errors.check_in_time?.[0] ? (
            <span className="text-sm text-red-700" id="property-check-in-error">
              {currentState.errors.check_in_time[0]}
            </span>
          ) : null}
        </label>
        <label className="block space-y-1">
          <span className="label">Check-out</span>
          <input
            aria-describedby={
              currentState.errors.check_out_time?.length
                ? "property-check-out-error property-time-helper"
                : "property-time-helper"
            }
            aria-invalid={Boolean(currentState.errors.check_out_time?.length)}
            className="field"
            defaultValue={getTimeValue(
              currentState.values.check_out_time ?? property?.check_out_time,
              "11:00"
            )}
            name="check_out_time"
            type="time"
          />
          {currentState.errors.check_out_time?.[0] ? (
            <span className="text-sm text-red-700" id="property-check-out-error">
              {currentState.errors.check_out_time[0]}
            </span>
          ) : null}
        </label>
      </div>
      <p className="text-sm text-ink/65" id="property-time-helper">
        {"Folose\u0219te ora local\u0103 a propriet\u0103\u021bii."}
      </p>

      <label className="block space-y-1">
        <span className="label">Reguli casa</span>
        <textarea
          aria-describedby={
            currentState.errors.rules?.length ? "property-rules-error" : undefined
          }
          aria-invalid={Boolean(currentState.errors.rules?.length)}
          className="field min-h-28"
          defaultValue={currentState.values.rules ?? property?.rules ?? ""}
          name="rules"
        />
        {currentState.errors.rules?.[0] ? (
          <span className="text-sm text-red-700" id="property-rules-error">
            {currentState.errors.rules[0]}
          </span>
        ) : null}
      </label>

      {currentState.message ? (
        <p aria-live="polite" className="text-sm text-red-700">
          {currentState.message}
        </p>
      ) : null}

      <button className="button-primary w-full sm:w-auto" disabled={isPending} type="submit">
        {isPending ? "Se salveaza..." : "Salvează proprietatea"}
      </button>
    </form>
  );
}
