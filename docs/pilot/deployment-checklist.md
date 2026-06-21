# Owner Pilot #1 Deployment Checklist

Use this checklist before deploying Sejura to pilot staging. The deployment is a no-go until every required item is complete and the post-deploy smoke test passes.

## Scope Guard

- Do not add or enable WhatsApp, SMS, Stripe/payments, OTA sync, native apps, or feature expansion for this pilot deployment.
- AI-created bookings must remain pending until an owner confirms them.
- Calendar events must only be created for confirmed bookings.

## Deployment Configuration

- Confirm the deployment target is the intended pilot staging environment.
- Confirm the deployed branch/commit is the reviewed pilot build.
- Confirm `package.json` scripts are available for `lint`, `typecheck`, `test`, and `build`.
- Confirm `next.config.mjs` has no staging-specific rewrites, redirects, headers, or experimental runtime settings that need production review.
- Confirm the hosting platform runs `pnpm.cmd build` or the platform-equivalent Next.js build command.
- Confirm the app starts with the platform-equivalent Next.js runtime after build.

## Environment Variables

Required for all pilot deployments:

- `NEXT_PUBLIC_SUPABASE_URL`: public Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service role key.
- `OPENAI_API_KEY`: server-only OpenAI key.
- `APP_BASE_URL`: deployed application base URL, for example `https://staging.example.com`.

Required when Google Calendar sync is included in the pilot:

- `GOOGLE_CLIENT_ID`: server-only Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: server-only Google OAuth client secret.
- `GOOGLE_CALENDAR_REDIRECT_URI`: exact callback URL for the deployed environment.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: server-only token encryption key, at least 32 characters.

Optional email provider variables:

- `EMAIL_PROVIDER`: optional provider selector.
- `EMAIL_PROVIDER_API_KEY`: server-only provider API key.
- `EMAIL_FROM_ADDRESS`: optional sender address.
- `EMAIL_FROM_NAME`: optional sender display name.

Safety checks:

- No secret value is prefixed with `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, and `EMAIL_PROVIDER_API_KEY` are only set in server-side hosting secrets.
- No secret is committed to the repository, exposed in browser code, copied into AI prompts, or printed in deployment logs.
- The deployment environment matches `docs/env-matrix.md`.

## Google OAuth Redirect URIs

Configure these in Google Cloud OAuth authorized redirect URIs before testing calendar sync:

- Staging: `https://<staging-domain>/api/google-calendar/callback`
- Production: `https://<production-domain>/api/google-calendar/callback`

For each deployed environment:

- `GOOGLE_CALENDAR_REDIRECT_URI` must exactly match the Google Cloud authorized redirect URI for that environment.
- The callback must use HTTPS for deployed staging and production.
- The Google OAuth client must be the intended client for the environment being deployed.
- Reconnect messaging must be visible to the owner if token refresh or authorization fails.

## Database Migrations

Apply Supabase migrations in this order:

1. `0001_sprint1_foundation.sql`
2. `0002_booking_core_availability.sql`
3. `0003_google_calendar_integration.sql`
4. `0004_public_page_ai_receptionist.sql`
5. `0005_owner_notifications.sql`
6. `0006_public_chat_schema_compatibility.sql`
7. `0007_public_chat_booking_draft.sql`

Migration safety checks:

- Do not skip or reorder migrations.
- Confirm migrations run against the intended staging Supabase project, not production by accident.
- Confirm confirmed booking overlap protection exists for room availability.
- Confirm pending bookings, owner notifications, public chat, Google Calendar token storage, and booking draft fields exist after migration.
- Confirm row-level security remains enabled for owner-scoped tables.
- Confirm service role usage is limited to server-only code paths.

## Pre-Deploy Validation

Run and record results:

1. `pnpm.cmd lint`
2. `pnpm.cmd typecheck`
3. `pnpm.cmd test`
4. `pnpm.cmd build`

The deployment is blocked if any command fails.

## Deploy Steps

1. Select the pilot staging hosting target and matching Supabase project.
2. Verify the reviewed branch/commit is selected for deployment.
3. Set all required environment variables in the hosting platform.
4. Set Google OAuth variables if calendar sync is included in the pilot.
5. Apply database migrations in the listed order.
6. Run the pre-deploy validation commands locally or in CI.
7. Deploy the app.
8. Open `APP_BASE_URL` and confirm the app responds.
9. Open the sign-in page and confirm authentication loads.
10. Run `docs/pilot/post-deploy-smoke.md`.
11. Record smoke-test result, known risks, and any owner-facing blockers before inviting the pilot owner.

## No-Go Conditions

The deployment is a no-go if any of these are true:

- A required environment variable is missing or exposed in a public/browser context.
- A migration fails, is skipped, or is applied to the wrong Supabase project.
- Google Calendar is included in pilot scope but OAuth redirect URI or token encryption is not configured.
- Sign-in fails after deployment.
- Owner onboarding, property setup, or room setup cannot be completed without developer help.
- Public page or Jonny chat cannot open for a signed-out guest.
- Availability or price is invented instead of coming from backend availability checks.
- A pending booking is communicated as confirmed.
- Pending booking creation does not create an owner notification.
- Calendar sync status is hidden when calendar sync is configured.

## Rollback Notes

- If deployment fails before owner use, redeploy the previous known-good build.
- If public guest flow fails after deployment, disable public pilot access until fixed.
- Keep created bookings, conversations, notifications, and audit records for review unless the owner explicitly requests test-data cleanup.
