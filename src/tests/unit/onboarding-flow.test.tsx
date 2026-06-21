import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

describe("OnboardingFlow", () => {
  it("renders safely when the owner has no property yet", () => {
    render(
      <OnboardingFlow
        activation={{
          ready: false,
          missingRequirements: ["Adauga detaliile proprietatii."]
        }}
        hasPropertyDetails={false}
        hasRoom={false}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Porneste cu baza corecta" })
    ).toBeVisible();
    expect(screen.getByText(/Adauga detaliile proprietatii\./)).toBeVisible();
    expect(screen.getByText("Nume, localitate, contact, ore si reguli.")).toBeVisible();
  });
});
