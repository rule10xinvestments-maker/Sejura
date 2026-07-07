import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("landing page", () => {
  it("shows the guest path before the owner path", () => {
    render(<HomePage />);

    const guestCard = screen.getByRole("heading", { name: "Caut cazare" }).closest("article");
    const ownerCard = screen
      .getByRole("heading", { name: "Am o pensiune, cabană sau vilă" })
      .closest("article");

    expect(guestCard).not.toBeNull();
    expect(ownerCard).not.toBeNull();
    expect(
      guestCard!.compareDocumentPosition(ownerCard!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps one global login CTA and removes guest-card login copy", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("link", { name: "Intră în cont" })).toHaveLength(1);
    expect(screen.queryByText("Am deja cont")).not.toBeInTheDocument();
  });

  it("does not repeat the guest title as identical CTA text", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Caut cazare" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Caut cazare" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Caută cazare" })).toBeVisible();
  });

  it("keeps guest and owner CTAs clickable", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "Caută cazare" })).toHaveAttribute(
      "href",
      "/guest"
    );
    expect(screen.getByRole("link", { name: "Administrează proprietatea" })).toHaveAttribute(
      "href",
      "/app"
    );
  });

  it("positions public Sejura pages as mini-sites for local discovery", () => {
    render(<HomePage />);

    const guestCard = screen.getByRole("heading", { name: "Caut cazare" }).closest("article");

    expect(guestCard).not.toBeNull();
    expect(
      within(guestCard!).getByText(
        "Paginile publice Sejura pot fi folosite ca mini-site pentru pensiuni care nu au un website propriu."
      )
    ).toBeVisible();
    expect(
      within(guestCard!).getByText(
        "Linkul poate fi trimis pe WhatsApp, Facebook, Instagram sau Google Business."
      )
    ).toBeVisible();
  });
});
