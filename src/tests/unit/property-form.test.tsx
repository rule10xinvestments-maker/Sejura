import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertyForm } from "@/components/property/property-form";
import type { PropertyFormState } from "@/domain/properties/form-state";

describe("PropertyForm", () => {
  it("renders with empty initial values and no required slug field", () => {
    render(<PropertyForm action={vi.fn()} property={null} />);

    expect(screen.getByText("Link public rezervat")).toBeVisible();
    expect(
      screen.getByText(
        "\u00cel vom folosi mai t\u00e2rziu pentru pagina public\u0103 a pensiunii."
      )
    ).toBeVisible();
    expect(
      screen.getByText("\u00cel vom genera automat din numele propriet\u0103\u021bii.")
    ).toBeVisible();
    expect(screen.queryByLabelText("Slug public rezervat")).not.toBeInTheDocument();
    expect(screen.queryByText(/\/p\//)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Oras / localitate")).toBeVisible();
    expect(
      screen.getByText(
        "Apare pe pagina publica si il ajuta pe oaspete sa recunoasca proprietatea."
      )
    ).toBeVisible();
    expect(screen.getByLabelText("Check-in")).toHaveValue("15:00");
    expect(screen.getByLabelText("Check-out")).toHaveValue("11:00");
    expect(
      screen.getByText("Folose\u0219te ora local\u0103 a propriet\u0103\u021bii.")
    ).toBeVisible();
  });

  it("shows a friendly generated public link preview after property name input", () => {
    render(<PropertyForm action={vi.fn()} property={null} />);

    fireEvent.change(screen.getByLabelText("Nume proprietate"), {
      target: { value: "Pensiunea Sura Mare" }
    });

    expect(
      screen.getByText("Link public rezervat: /p/pensiunea-sura-mare")
    ).toBeVisible();
  });

  it("shows friendly validation errors returned from the server action", async () => {
    async function action(): Promise<PropertyFormState> {
      return {
        ok: false,
        errors: {
          name: ["Adauga numele proprietatii."],
          city: ["Adauga orasul sau localitatea proprietatii."],
          check_in_time: ["Foloseste ora in format HH:mm, de exemplu 15:00."]
        },
        message: "Verifica detaliile proprietatii si incearca din nou.",
        values: {}
      };
    }

    render(<PropertyForm action={action} property={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Salveaza proprietatea" }));

    await waitFor(() => {
      expect(screen.getByText("Adauga numele proprietatii.")).toBeVisible();
      expect(
        screen.getByText("Adauga orasul sau localitatea proprietatii.")
      ).toBeVisible();
      expect(
        screen.getByText("Foloseste ora in format HH:mm, de exemplu 15:00.")
      ).toBeVisible();
      expect(
        screen.getByText("Verifica detaliile proprietatii si incearca din nou.")
      ).toBeVisible();
    });
  });

  it("does not crash if the action returns undefined during navigation", async () => {
    async function action() {
      return undefined;
    }

    render(<PropertyForm action={action} property={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Salveaza proprietatea" }));

    await waitFor(() => {
      expect(screen.getByText("Link public rezervat")).toBeVisible();
    });
  });
});
