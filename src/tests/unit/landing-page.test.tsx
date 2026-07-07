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

  it("uses the guest title row as the discovery CTA", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Caut cazare" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Caută cazare" })).toHaveAttribute(
      "href",
      "/guest"
    );
  });

  it("removes the lower duplicate guest CTA and keeps owner CTAs clickable", () => {
    render(<HomePage />);

    expect(screen.queryByText("Caută cazare")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Administrează proprietatea" })).toHaveAttribute(
      "href",
      "/app"
    );
    expect(screen.getByRole("link", { name: "Creează cont de proprietar" })).toHaveAttribute(
      "href",
      "/sign-up"
    );
  });

  it("moves mini-site helper copy from guest card to owner card", () => {
    render(<HomePage />);

    const guestCard = screen.getByRole("heading", { name: "Caut cazare" }).closest("article");
    const ownerCard = screen
      .getByRole("heading", { name: "Am o pensiune, cabană sau vilă" })
      .closest("article");

    expect(guestCard).not.toBeNull();
    expect(ownerCard).not.toBeNull();
    expect(
      within(guestCard!).queryByText(
        "Pagina publică Sejura poate fi folosită ca mini-site pentru pensiunea ta, chiar dacă nu ai un website propriu."
      )
    ).not.toBeInTheDocument();
    expect(
      within(ownerCard!).getByText(
        "Pagina publică Sejura poate fi folosită ca mini-site pentru pensiunea ta, chiar dacă nu ai un website propriu."
      )
    ).toBeInTheDocument();
    expect(
      within(ownerCard!).getByText(
        "Poți trimite linkul pe WhatsApp, Facebook, Instagram sau Google Business."
      )
    ).toBeInTheDocument();
  });

  it("shows a guest icon and keeps the owner icon square", () => {
    render(<HomePage />);

    expect(screen.getByTestId("guest-card-icon")).toBeVisible();
    expect(screen.getByTestId("owner-card-icon")).toHaveClass("h-12", "w-12");
  });
});
