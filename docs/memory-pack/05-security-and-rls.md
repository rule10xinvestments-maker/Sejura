# Security And RLS

## Tenant Isolation Rules
- Owner data is scoped by `owner_id`.
- Owner/private route handlers and server actions derive owner identity from authenticated Supabase user context.
- Domain services and repositories should always filter reads/writes by `owner_id`.
- Property child records also use `property_id`.
- Public guests never supply trusted `owner_id`.

## Owner ID Rules
- Owner app pages call `getCurrentOwnerId`.
- Booking repository methods filter by owner.
- Room, property, settings, notification, dashboard, and Google Calendar services filter or assert owner ownership.
- Owner conversation pages filter by owner.
- Public AI booking creation uses the conversation's owner/property context.

## Public Session Rules
- Public chat sessions are cookie-bound per property slug.
- Session IDs are random and stored in httpOnly cookies.
- Guests cannot list all conversations.
- Public message and message-read endpoints require matching public session cookie.
- Public conversation validation binds:
  - conversation ID
  - public session ID
  - requested property slug
  - property ID
  - current public page/chat/AI booking enabled state

## Service Role Boundaries
Service role is server-only and required for unauthenticated public chat writes. It must never be exposed to the frontend.

Allowed service-role surfaces:
- `/p/[propertySlug]`
- `/api/public/conversations/start`
- `/api/public/conversations/message`
- `/api/public/conversations/[conversationId]/messages`

Service-role methods must re-apply security checks in code:
- session validation
- property slug validation
- property ID match
- owner/property filters for message reads and updates
- guest-safe response shaping

## Frontend Secret Rules
Only these are public:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never expose these with `NEXT_PUBLIC_`:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `EMAIL_PROVIDER_API_KEY`

## RLS Expectations
- Owner tables should have RLS enabled.
- Owner policies should restrict rows to `auth.uid() = owner_id`.
- Public guests should not have direct table access to conversations, bookings, tool calls, notifications, or owner data.
- Public chat uses server-mediated service-role access instead of direct guest database access.
- Migration `0004` and compatibility migration `0006` enable RLS on public chat tables.

## Public Guest Limitations
Guests can:
- load enabled public property page
- start/resume their own cookie-bound conversation for that property
- send messages to Jonny
- read safe fields from their own conversation messages
- create pending booking requests through Jonny's backend tool path

Guests cannot:
- access owner dashboard
- list conversations
- read other conversations
- provide trusted owner IDs
- create confirmed bookings
- access Google Calendar tokens/data
- access notifications
- access AI prompts, secrets, tool schemas, or internal IDs beyond safe response data

## Known Remaining Risks
- Public rate limiting is in-memory and local-process only.
- Public chat cookies are bearer-like session tokens.
- Disposable Supabase DB/RLS integration test suite is not yet implemented.
- AI/tool logs need periodic review to ensure no sensitive data is stored.
- Broader launch should add production-grade shared rate limiting and live RLS regression coverage.
