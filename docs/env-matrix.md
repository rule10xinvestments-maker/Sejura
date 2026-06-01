# Environment Matrix

## Required For Pilot
| Variable | Scope | Required | Used For | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public client/server | Yes | Supabase project URL | Safe to expose as public config. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client/server | Yes | Supabase anonymous client | Safe to expose; RLS remains required. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes | Public chat route handlers and service-role writes | Never expose with `NEXT_PUBLIC_`. |
| `OPENAI_API_KEY` | Server only | Yes | Jonny public reservation assistant | Without it, chat fails safely but pilot booking flow is not usable. |
| `APP_BASE_URL` | Server/config | Yes | Links, redirects, operational references | Must match deployed pilot URL. |

## Optional / Conditional
| Variable | Scope | Required | Used For | Notes |
| --- | --- | --- | --- | --- |
| `EMAIL_PROVIDER` | Server only | Optional | Owner email alerts | Dashboard notifications still work without email. |
| `EMAIL_PROVIDER_API_KEY` | Server only | Optional | Owner email alerts | Missing key should fail safely. |
| `EMAIL_FROM_ADDRESS` | Server only | Optional | Owner email alerts | Configure only when email provider is active. |
| `EMAIL_FROM_NAME` | Server only | Optional | Owner email alerts | Configure only when email provider is active. |
| `GOOGLE_CLIENT_ID` | Server only | Conditional | Google Calendar OAuth | Needed only if calendar connection is used in pilot. |
| `GOOGLE_CLIENT_SECRET` | Server only | Conditional | Google Calendar OAuth | Never expose publicly. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Server only | Conditional | Google OAuth callback | Must match provider configuration. |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Server only | Conditional | Encrypting Google tokens | Required if calendar OAuth is enabled; 32+ characters. |
| `E2E_OWNER_EMAIL` | Local/test | Optional | Full Playwright onboarding smoke | Not required for production. |
| `E2E_OWNER_PASSWORD` | Local/test | Optional | Full Playwright onboarding smoke | Not required for production. |

## Environment Rules
- Public variables may start with `NEXT_PUBLIC_`.
- Secrets must never start with `NEXT_PUBLIC_`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, Google secrets, and email provider keys server-only.
- Rotate secrets if they are pasted into chat, logs, screenshots, or client-visible output.
- Pilot deploy should use a dedicated Supabase project or a clearly isolated pilot tenant.

## Minimum Pilot Configuration
Use this minimum set when email and Google Calendar are not part of the first pilot:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
APP_BASE_URL=
```

## Validation
- App starts without missing env crashes.
- Public page loads.
- Public chat starts.
- Jonny responds to availability request.
- Pending booking can be created.
- Owner can sign in and view the booking.
