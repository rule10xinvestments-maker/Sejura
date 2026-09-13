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
    <section className="panel space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Poze pensiune</h2>
        <p className="mt-1 text-sm text-ink/65">
          Pozele sunt opționale. Poza principală apare prima pe pagina publică.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Pozele nu au putut fi încărcate momentan.
        </p>
      ) : null}

      <PhotoUploadForm action={uploadAction} previewAlt={`Preview ${property.name}`}>
        <input name="property_id" type="hidden" value={property.id} />
      </PhotoUploadForm>

      {photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <article className="rounded-lg border border-line bg-mist/40 p-3" key={photo.id}>
              <div className="h-40 overflow-hidden rounded-md bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={photo.alt_text ?? property.name}
                  className="h-full w-full object-cover"
                  src={photo.public_url}
                />
              </div>
              <div className="mt-3 grid gap-2">
                <form action={coverAction}>
                  <input name="property_id" type="hidden" value={property.id} />
                  <input name="photo_id" type="hidden" value={photo.id} />
                  <button className="button-secondary min-h-10 w-full px-3 py-2" type="submit">
                    {photo.is_cover ? "Poză principală" : "Alege poza principală"}
                  </button>
                </form>
                <details className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">
                  <summary className="cursor-pointer font-semibold">Elimină poza</summary>
                  <form action={removeAction} className="mt-3 grid gap-2">
                    <input name="property_id" type="hidden" value={property.id} />
                    <input name="photo_id" type="hidden" value={photo.id} />
                    <button
                      className="min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 font-semibold text-red-800"
                      type="submit"
                    >
                      Confirmă eliminarea
                    </button>
                  </form>
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
