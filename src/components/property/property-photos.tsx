import React from "react";
import { PhotoUploadForm } from "@/components/photos/photo-upload-form";
import type { PropertyPhoto } from "@/domain/photos/types";
import type { Property } from "@/domain/properties/types";

type PropertyPhotosProps = {
  property: Property;
  photos: PropertyPhoto[];
  loadError?: boolean;
  uploadAction: (formData: FormData) => void | Promise<void>;
  coverAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
};

export function PropertyPhotos({
  property,
  photos,
  loadError = false,
  uploadAction,
  coverAction,
  removeAction
}: PropertyPhotosProps) {
  return (
    <section className="panel space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Poze pensiune</h2>
          <p className="mt-1 text-sm text-ink/65">
            Pozele sunt opționale. Poza principală apare prima pe pagina publică.
          </p>
        </div>
        <PhotoUploadForm action={uploadAction} previewAlt={`Preview ${property.name}`}>
          <input name="property_id" type="hidden" value={property.id} />
        </PhotoUploadForm>
      </div>

      {loadError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Pozele nu au putut fi încărcate momentan.
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <article className="rounded-md border border-line bg-mist/40 p-2" key={photo.id}>
              <div className="h-24 overflow-hidden rounded-md bg-white sm:h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={photo.alt_text ?? property.name}
                  className="h-full w-full object-cover"
                  src={photo.public_url}
                />
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {photo.is_cover ? (
                  <span className="rounded-md bg-moss px-2 py-1 text-center text-xs font-semibold text-white">
                    Poză principală
                  </span>
                ) : null}
                <details className="rounded-md border border-line bg-white p-2 text-sm">
                  <summary className="cursor-pointer font-semibold text-moss">
                    Gestionează poza
                  </summary>
                  <div className="mt-2 grid gap-2">
                    {!photo.is_cover ? (
                      <form action={coverAction}>
                        <input name="property_id" type="hidden" value={property.id} />
                        <input name="photo_id" type="hidden" value={photo.id} />
                        <button
                          className="button-secondary min-h-9 w-full px-2 py-1 text-sm"
                          type="submit"
                        >
                          Alege ca principală
                        </button>
                      </form>
                    ) : null}
                    <details className="rounded-md border border-red-200 bg-red-50 p-2 text-red-950">
                      <summary className="cursor-pointer font-semibold">
                        Elimină poza
                      </summary>
                      <form action={removeAction} className="mt-2">
                        <input name="property_id" type="hidden" value={property.id} />
                        <input name="photo_id" type="hidden" value={photo.id} />
                        <button
                          className="min-h-9 w-full rounded-md border border-red-300 bg-white px-2 py-1 font-semibold text-red-800"
                          type="submit"
                        >
                          Confirmă eliminarea
                        </button>
                      </form>
                    </details>
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-line bg-mist px-3 py-3 text-sm text-ink/70">
          Nu ai adăugat poze încă.
        </p>
      )}
    </section>
  );
}
