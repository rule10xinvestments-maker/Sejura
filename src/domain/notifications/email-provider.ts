export type EmailPayload = {
  to: string | null;
  subject: string;
  body: string;
};

export type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  errorCode?: string | null;
};

export type EmailProvider = {
  sendOwnerEmail(payload: EmailPayload): Promise<EmailSendResult>;
};

export class NoopEmailProvider implements EmailProvider {
  async sendOwnerEmail(): Promise<EmailSendResult> {
    if (!process.env.EMAIL_PROVIDER_API_KEY) {
      return {
        ok: false,
        skipped: true,
        errorCode: "EMAIL_PROVIDER_NOT_CONFIGURED"
      };
    }

    return { ok: true };
  }
}
