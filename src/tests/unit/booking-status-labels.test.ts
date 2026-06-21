import { describe, expect, it } from "vitest";
import { bookingStatusLabels } from "@/domain/bookings/status-labels";

describe("bookingStatusLabels", () => {
  it("maps persisted booking statuses to owner-facing Romanian labels", () => {
    expect(bookingStatusLabels.confirmed).toBe("Confirmată");
    expect(bookingStatusLabels.pending).toBe("În așteptare");
    expect(bookingStatusLabels.cancelled).toBe("Anulată");
    expect(bookingStatusLabels.rejected).toBe("Respinsă");
  });
});
