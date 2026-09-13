import { describe, expect, it, vi } from "vitest";
import OnboardingPage from "@/app/(protected)/app/onboarding/page";

const onboardingMocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect: onboardingMocks.redirect
}));

describe("OnboardingPage", () => {
  it("redirects Start/onboarding traffic into Property setup", () => {
    expect(() =>
      OnboardingPage({ searchParams: { propertyId: "property-1" } })
    ).toThrow("redirect:/app/property?propertyId=property-1");
  });
});
