import { describe, expect, it } from "vitest";
import { assertOwnerAccess, isOwner } from "@/lib/security/ownership";

describe("ownership helpers", () => {
  it("accepts matching owner records", () => {
    expect(isOwner({ owner_id: "owner-1" }, "owner-1")).toBe(true);
    expect(() => assertOwnerAccess({ owner_id: "owner-1" }, "owner-1")).not.toThrow();
  });

  it("rejects cross-owner access", () => {
    expect(isOwner({ owner_id: "owner-2" }, "owner-1")).toBe(false);
    expect(() => assertOwnerAccess({ owner_id: "owner-2" }, "owner-1")).toThrow(
      "Access denied"
    );
  });
});
