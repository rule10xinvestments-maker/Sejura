import type { PropertyPhoto } from "@/domain/photos/types";
import type { Property } from "@/domain/properties/types";

type PropertyPhotosProps = {
  property: Property;
  photos: PropertyPhoto[];
  uploadAction: (formData: FormData) => void | Promise<void>;
  coverAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
};

export function PropertyPhotos({
  property,
  photos,
  uploadAction,
  coverAction,
  removeAction
}: PropertyPhotosProps) {
  return (
    <section className="panel space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Poze pensiune</h2>
        <p className="mt-1 text-sm text-ink/65">
          Poza principală apare prima pe pagina publică.
        </p>
        <p className="mt-1 text-sm text-ink/65">Pozele sunt opționale.</p>
      </div>

      <form action={uploadAction} className="grid gap-3">
        <input name="property_id" type="hidden" value={property.id} />
        <label className="block space-y-1">
          <span className="label">Adaugă poze</span>
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="field"
            multiple
            name="photos"
            type="file"
          />
        </label>
        <button className="button-primary w-full sm:w-fit" type="submit">
          Adaugă poze
        </button>
      </form>

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
      ) : null}
    </section>
  );
}
