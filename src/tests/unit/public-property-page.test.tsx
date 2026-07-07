import React from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicPropertyPage from "@/app/p/[propertySlug]/page";
import {
  PublicConversationService,
  type PublicPageReadiness
} from "@/domain/public-chat/service";

vi.mock("@/components/public/jonny-chat", () => ({
  JonnyChat: () => <section aria-label="Jonny chat">Jonny</section>
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: vi.fn(() => ({}))
}));

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: { getUser }
  }))
}));

const readiness: PublicPageReadiness = {
  ok: true,
  reason: "READY" as const,
  context: {
    property: {
      id: "property-1",
      owner_id: "owner-1",
      name: "Peștera Pusnicului",
      slug: "pestera-pusnicului",
      status: "ready_pending_mode",
      contact_phone: "0700000000",
      contact_email: "owner@example.com",
      check_in_time: "15:00:00",
      check_out_time: "11:00:00",
      rules: "Fără fumat.",
      city: "Brașov",
      public_description: "Cabană liniștită aproape de trasee.",
      public_contact_phone: null,
      public_contact_email: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    },
    publicPage: {
      id: "page-1",
      owner_id: "owner-1",
      property_id: "property-1",
      is_public: true,
      chat_enabled: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    },
    settings: {
      id: "settings-1",
      owner_id: "owner-1",
      property_id: "property-1",
      ai_enabled: true,
      public_booking_enabled: true,
      allow_auto_confirmation: false,
      calendar_required_for_confirmation: false,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    }
  },
  rooms: [
    {
      name: "Camera Verde",
      max_guests: 2,
      base_price_per_night: 260
    }
  ]
};

describe("public property page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null } });
    vi.spyOn(PublicConversationService.prototype, "getPublicPageReadiness").mockResolvedValue(
      readiness
    );
  });

  it("renders compact public guest layout without requiring login", async () => {
    render(await PublicPropertyPage({ params: { propertySlug: "pestera-pusnicului" } }));

    expect(screen.getByRole("link", { name: "Înapoi la cazări" })).toHaveAttribute(
      "href",
      "/guest"
    );
    expect(screen.queryByRole("link", { name: "Administreaza pensiunea" })).not.toBeInTheDocument();

    const schedule = screen.getByLabelText("Program check-in și check-out");
    expect(within(schedule).getByText("Check-in")).toBeVisible();
    expect(within(schedule).getByText("15:00")).toBeVisible();
    expect(within(schedule).getByText("Check-out")).toBeVisible();
    expect(within(schedule).getByText("11:00")).toBeVisible();
    expect(screen.queryByText("15:00:00")).not.toBeInTheDocument();

    const roomsTitle = screen.getByRole("heading", { name: "Camere disponibile" });
    expect(roomsTitle).toBeVisible();
    expect(within(roomsTitle).getByRole("img", { name: "Camere" })).toBeInTheDocument();
    expect(screen.getByText("Camera Verde")).toBeVisible();
    expect(screen.getByText("până la 2 oaspeți")).toBeVisible();
    expect(screen.getByText("de la 260 RON/noapte")).toBeVisible();
  });
});
