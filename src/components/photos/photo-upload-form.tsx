"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

type PhotoUploadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  previewAlt: string;
};

export function PhotoUploadForm({
  action,
  children,
  previewAlt
}: PhotoUploadFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    source: "camera" | "gallery"
  ) {
    const file = event.currentTarget.files?.[0] ?? null;
    const otherInput =
      source === "gallery" ? cameraInputRef.current : galleryInputRef.current;

    if (otherInput) otherInput.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!file) {
      setPreviewUrl(null);
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function resetSelection() {
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
  }

  function cancelUpload() {
    resetSelection();
    setIsExpanded(false);
  }

  if (!isExpanded) {
    return (
      <button
        className="button-secondary min-h-10 w-fit px-3 py-2 text-sm"
        onClick={() => setIsExpanded(true)}
        type="button"
      >
        Adaugă poză
      </button>
    );
  }

  return (
    <form action={action} className="grid gap-3" onSubmit={() => setIsExpanded(false)}>
      {children}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="label">Alege din galerie</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="field min-h-11 file:mr-3 file:rounded-md file:border-0 file:bg-moss file:px-3 file:py-2 file:font-semibold file:text-white"
            name="photos"
            onChange={(event) => handleFileChange(event, "gallery")}
            ref={galleryInputRef}
            type="file"
          />
        </label>
        <label className="block space-y-1">
          <span className="label">Fă poză</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="field min-h-11 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-moss"
            name="photos"
            onChange={(event) => handleFileChange(event, "camera")}
            ref={cameraInputRef}
            type="file"
          />
        </label>
      </div>

      {previewUrl && fileName ? (
        <div className="rounded-lg border border-line bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={previewAlt}
            className="h-40 w-full rounded-md object-cover"
            src={previewUrl}
          />
          <p className="mt-2 text-sm font-semibold text-ink">{fileName}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="button-primary min-h-10 px-3 py-2 text-sm sm:w-fit" type="submit">
          Încarcă poza
        </button>
        <button
          className="button-secondary min-h-10 px-3 py-2 text-sm sm:w-fit"
          onClick={cancelUpload}
          type="button"
        >
          Renunță
        </button>
      </div>
    </form>
  );
}
