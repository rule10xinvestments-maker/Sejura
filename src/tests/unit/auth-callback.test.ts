import { describe, expect, it } from "vitest";
import { GET } from "@/app/auth/callback/route";

describe("Google auth callback", () => {
  it("redirects missing code safely", async () => {
    const response = await GET(
      new Request("https://sejura.test/auth/callback?next=/app") as never
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sejura.test/sign-in?error=google-auth-missing-code"
    );
  });
});
