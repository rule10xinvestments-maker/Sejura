import { describe, expect, it } from "vitest";
import {
  decryptGoogleToken,
  encryptGoogleToken
} from "@/domain/google-calendar/crypto";
import type { SafeGoogleCalendarConnection } from "@/domain/google-calendar/types";

describe("Google Calendar security helpers", () => {
  it("encrypts tokens at rest and decrypts only server-side", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY =
      "test-google-token-encryption-key-32";

    const encrypted = encryptGoogleToken("raw-google-token");

    expect(encrypted).not.toContain("raw-google-token");
    expect(decryptGoogleToken(encrypted)).toBe("raw-google-token");
  });

  it("safe connection shape does not include token fields", () => {
    const safeConnection: SafeGoogleCalendarConnection = {
      status: "connected",
      google_account_email: "owner@example.com",
      calendar_id: "primary",
      calendar_name: "Calendar principal",
      last_sync_at: null,
      needs_reconnect: false,
      last_error_code: null
    };

    expect(JSON.stringify(safeConnection)).not.toContain("token");
    expect(JSON.stringify(safeConnection)).not.toContain("encrypted");
  });
});
