import { describe, expect, it, vi } from "vitest";
import { getCurrentOwnerId } from "@/lib/auth/server";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect: navigation.redirect
}));

function authClient(accountStatus: string | null) {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "owner-1" } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: accountStatus ? { account_status: accountStatus } : null,
            error: null
          })
        })
      })
    })
  } as never;
}

describe("getCurrentOwnerId", () => {
  it("returns active owner id", async () => {
    await expect(getCurrentOwnerId(authClient("active"))).resolves.toBe("owner-1");
  });

  it("blocks suspended owner from protected app access", async () => {
    await expect(getCurrentOwnerId(authClient("suspended"))).rejects.toThrow(
      "NEXT_REDIRECT:/account-suspended"
    );
  });
});
