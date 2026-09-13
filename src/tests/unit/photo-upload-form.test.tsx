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

  it("keeps gallery and camera inputs separate", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="room_id" type="hidden" value="room-1" />
      </PhotoUploadForm>
    );

    expect(screen.queryByLabelText("Alege din galerie")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Fă poză")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));

    const galleryInput = screen.getByLabelText("Alege din galerie");
    const cameraInput = screen.getByLabelText("Fă poză");

    expect(galleryInput).toHaveAttribute("type", "file");
    expect(galleryInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(galleryInput).not.toHaveAttribute("capture");
    expect(cameraInput).toHaveAttribute("type", "file");
    expect(cameraInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(cameraInput).toHaveAttribute("capture", "environment");
    expect(screen.getAllByRole("button", { name: "Încarcă poza" })).toHaveLength(1);
  });

  it("shows selected gallery image preview before upload", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="property_id" type="hidden" value="property-1" />
      </PhotoUploadForm>
    );

    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));

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

  it("shows selected camera image preview before upload", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="room_id" type="hidden" value="room-1" />
      </PhotoUploadForm>
    );

    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));

    const file = new File(["photo"], "camera-capture.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Fă poză"), {
      target: { files: [file] }
    });

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByAltText("Preview Camera Verde")).toHaveAttribute(
      "src",
      "blob:preview-url"
    );
    expect(screen.getByText("camera-capture.webp")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Încarcă poza" })).toHaveLength(1);
  });

  it("keeps property and room hidden ids inside the upload form", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="property_id" type="hidden" value="property-1" />
        <input name="room_id" type="hidden" value="room-1" />
      </PhotoUploadForm>
    );

    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));

    const form = screen.getByRole("button", { name: "Încarcă poza" }).closest("form");

    expect(form?.querySelector('input[name="property_id"]')).toHaveAttribute(
      "value",
      "property-1"
    );
    expect(form?.querySelector('input[name="room_id"]')).toHaveAttribute(
      "value",
      "room-1"
    );
  });

  it("collapses after submit and keeps the selected thumbnail flow calm", () => {
    render(
      <PhotoUploadForm action={vi.fn()} previewAlt="Preview Camera Verde">
        <input name="room_id" type="hidden" value="room-1" />
      </PhotoUploadForm>
    );

    fireEvent.click(screen.getByRole("button", { name: "Adaugă poză" }));
    const file = new File(["photo"], "camera.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Alege din galerie"), {
      target: { files: [file] }
    });
    fireEvent.submit(screen.getByRole("button", { name: "Încarcă poza" }).closest("form")!);

    expect(screen.getByRole("button", { name: "Adaugă poză" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Încarcă poza" })).not.toBeInTheDocument();
  });
});
