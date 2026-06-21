import { describe, expect, it } from "vitest";
import { propertyFormSchema } from "@/domain/properties/schemas";
import { generatePropertySlug } from "@/domain/properties/slug";
import { normalizePropertyTime } from "@/domain/properties/time";

describe("property schema", () => {
  it("validates property setup without requiring owner-entered slug", () => {
    const parsed = propertyFormSchema.parse({
      name: "Cabana Brad",
      city: "Brasov",
      contact_phone: "0712345678",
      contact_email: "gazda@example.com",
      check_in_time: "15:00",
      check_out_time: "11:00",
      rules: "Fara fumat."
    });

    expect(parsed).toEqual({
      name: "Cabana Brad",
      city: "Brasov",
      contact_phone: "0712345678",
      contact_email: "gazda@example.com",
      check_in_time: "15:00",
      check_out_time: "11:00",
      rules: "Fara fumat."
    });
  });

  it("normalizes localized time values before validation", () => {
    const parsed = propertyFormSchema.parse({
      name: "Cabana Brad",
      city: "Brasov",
      contact_phone: "0712345678",
      contact_email: "gazda@example.com",
      check_in_time: "03:00 PM",
      check_out_time: "11:00 AM",
      rules: "Fara fumat."
    });

    expect(parsed.check_in_time).toBe("15:00");
    expect(parsed.check_out_time).toBe("11:00");
    expect(normalizePropertyTime("15:00:00")).toBe("15:00");
  });

  it("returns friendly time validation errors", () => {
    const parsed = propertyFormSchema.safeParse({
      name: "Cabana Brad",
      city: "Brasov",
      contact_phone: "0712345678",
      contact_email: "gazda@example.com",
      check_in_time: "25:99",
      check_out_time: "11:00",
      rules: "Fara fumat."
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.check_in_time?.[0]).toBe(
        "Foloseste ora in format HH:mm, de exemplu 15:00."
      );
    }
  });

  it("generates owner-friendly public link slugs from property names", () => {
    expect(generatePropertySlug("Pensiunea Șura Mare")).toBe(
      "pensiunea-sura-mare"
    );
    expect(generatePropertySlug("  Cabana Brad!  ")).toBe("cabana-brad");
  });

  it("handles empty property names safely when generating slugs", () => {
    expect(generatePropertySlug("")).toBe("proprietate");
    expect(generatePropertySlug(null)).toBe("proprietate");
    expect(generatePropertySlug(undefined)).toBe("proprietate");
  });
});
