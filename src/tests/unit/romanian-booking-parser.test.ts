import { describe, expect, it } from "vitest";
import { parseBookingDetailsFromRomanianMessage } from "@/domain/public-chat/booking-parser";

const currentDate = new Date("2026-06-01T12:00:00.000Z");

describe("parseBookingDetailsFromRomanianMessage", () => {
  it("parses spaced Romanian date range and guests", () => {
    expect(
      parseBookingDetailsFromRomanianMessage(
        "vreau o cazare de pe 12 06 pana pe 16 06 4 persoane",
        currentDate
      )
    ).toMatchObject({
      start_date: "2026-06-12",
      end_date: "2026-06-16",
      guests_count: 4,
      missing_fields: []
    });
  });

  it("parses dotted compact date range", () => {
    expect(
      parseBookingDetailsFromRomanianMessage(
        "cazare 12.06-16.06 pentru 4 persoane",
        currentDate
      )
    ).toMatchObject({
      start_date: "2026-06-12",
      end_date: "2026-06-16",
      guests_count: 4
    });
  });

  it("does not treat date day after pentru as guest count", () => {
    expect(
      parseBookingDetailsFromRomanianMessage(
        "Aveti camera pentru 12 06 - 16 06?",
        currentDate
      )
    ).toMatchObject({
      start_date: "2026-06-12",
      end_date: "2026-06-16",
      guests_count: null,
      missing_fields: ["guests_count"]
    });
  });

  it("parses Romanian month names", () => {
    expect(
      parseBookingDetailsFromRomanianMessage(
        "din 12 iunie pana in 16 iunie, 4 persoane",
        currentDate
      )
    ).toMatchObject({
      start_date: "2026-06-12",
      end_date: "2026-06-16",
      guests_count: 4
    });
  });

  it("parses Romanian date range with a shared written month", () => {
    expect(
      parseBookingDetailsFromRomanianMessage(
        "Buna, aveti camera pentru 12-14 august, 2 persoane?",
        currentDate
      )
    ).toMatchObject({
      start_date: "2026-08-12",
      end_date: "2026-08-14",
      guests_count: 2,
      missing_fields: []
    });
  });

  it("does not infer vague weekend dates", () => {
    const parsed = parseBookingDetailsFromRomanianMessage(
      "vreau weekendul viitor",
      currentDate
    );

    expect(parsed.start_date).toBeNull();
    expect(parsed.end_date).toBeNull();
    expect(parsed.missing_fields).toContain("start_date");
  });

  it("asks for year when missing-year date is already past", () => {
    const parsed = parseBookingDetailsFromRomanianMessage(
      "cazare 12.05-16.05 pentru 4 persoane",
      currentDate
    );

    expect(parsed.missing_fields).toContain("year");
  });
});
