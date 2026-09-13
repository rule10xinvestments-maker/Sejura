import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoUploadForm } from "@/components/photos/photo-upload-form";

const createObjectURL = vi.fn(() => "blob:preview-url");
const revokeObjectURL = vi.fn();

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: createObjectURL
});

Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: revokeObjectURL
});

describe("PhotoUploadForm", () => {
  afterEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it("shows selected image preview before upload", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="room_id" type="hidden" value="room-1" />
      </PhotoUploadForm>
    );

    const file = new File(["photo"], "1000034430.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Alege din galerie"), {
      target: { files: [file] }
    });

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByAltText("Preview Camera Verde")).toHaveAttribute(
      "src",
      "blob:preview-url"
    );
    expect(screen.getByText("1000034430.jpg")).toBeVisible();
    expect(screen.getByRole("button", { name: "Încarcă poza" })).toBeVisible();
  });
});
