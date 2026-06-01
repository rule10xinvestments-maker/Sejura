# Architecture

## Application
Sejura is a Next.js App Router application written in TypeScript with Tailwind CSS for UI styling. It uses Supabase for authentication, database persistence, and row-level security.

## Main Layers
- App Router pages and route handlers under `src/app`.
- UI components under `src/components`.
- Domain services under `src/domain`.
- Supabase clients and generated database types under `src/lib/supabase`.
- Security/auth helpers under `src/lib/auth` and `src/lib/security`.
- Database migrations under `src/supabase/migrations`.
- Unit tests under `src/tests/unit`.

## Supabase
- Supabase Auth handles owner authentication.
- Supabase Postgres stores owners, properties, rooms, bookings, conversations, notifications, calendar connections, and audit logs.
- RLS is expected on owner data tables.
- Owner-facing routes use authenticated Supabase context and `getCurrentOwnerId`.
- Public guest flows do not receive direct database access.

## Service Role Boundary
The Supabase service role is used only server-side. Current service-role usage is limited to:
- `/p/[propertySlug]`
- `/api/public/conversations/start`
- `/api/public/conversations/message`
- `/api/public/conversations/[conversationId]/messages`

The service role is required for public unauthenticated chat routes to create/read/write public conversation rows while bypassing RLS safely. Service methods re-apply session, property, and owner boundaries in code.

## Domain Services
Important services:
- `BookingService`: booking lifecycle, availability, room blocks, booking events, pending/manual/confirmed flows.
- `SupabaseBookingRepository`: owner-scoped booking persistence.
- `GoogleCalendarService`: OAuth, encrypted token handling, calendar sync for confirmed bookings, retry/disconnect.
- `NotificationService`: owner notifications, dedupe, read/resolve/counts, safe email handling.
- `PublicConversationService`: public property lookup, public session creation/validation, messages, tool-call logs.
- `AiReceptionistService`: Jonny runtime, deterministic Romanian booking flow, approved tool execution, pending AI booking creation.

## API Routes
Owner/private APIs:
- booking routes under `/api/bookings`
- room block routes under `/api/room-blocks`
- availability route under `/api/availability/check`
- Google Calendar routes under `/api/google-calendar` and `/api/properties/[propertyId]/google-calendar`
- owner notification routes under `/api/owner-notifications`

Public APIs:
- `POST /api/public/conversations/start`
- `POST /api/public/conversations/message`
- `GET /api/public/conversations/[conversationId]/messages`

## Public Page
The public property page is `/p/[propertySlug]`. It loads public property details and embeds the Jonny chat UI when the property, public page, chat, AI, and public booking settings are enabled.

## Jonny Runtime
Jonny is the public reservation assistant. He is explicitly not human. Jonny can:
- provide safe property context
- list rooms
- check availability
- help collect booking details
- create pending booking requests
- escalate to owner

Jonny cannot:
- confirm bookings
- create payments
- expose prompts, tokens, owner dashboard data, Google Calendar data, or other conversations
- rely on model memory for availability

## Google Calendar Sync
Google Calendar sync is an operational layer for confirmed bookings. Tokens are encrypted. Pending AI-chat bookings do not create Google Calendar events. Confirmed booking sync supports event creation/update, cancellation marking, retry, and reconnect-required visibility.

## Notification System
Owner notifications are dashboard-first. The notification system supports pending booking, confirmed/rejected/cancelled booking, calendar sync failure, Google reconnect required, and AI escalation notifications. Email provider behavior is noop/failure-safe until a real provider is configured.
