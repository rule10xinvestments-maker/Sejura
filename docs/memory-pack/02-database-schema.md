# Database Schema

## Core Tables
- `owners`: owner records tied to Supabase Auth users.
- `properties`: owner properties with slug, status, check-in/check-out, public copy/contact fields.
- `property_settings`: AI/public booking/calendar settings per property.
- `property_public_pages`: public page and chat enablement per property.
- `rooms`: active/inactive rooms/units with capacity and base price.
- `bookings`: pending/confirmed/rejected/cancelled booking records, source, conversation linkage, calendar sync fields.
- `booking_events`: audit/history events for booking lifecycle changes.
- `room_blocks`: owner-created blocks for unavailable room periods.
- `conversations`: public chat conversations, owner/property/session linkage, status, guest fields, metadata, related booking.
- `conversation_messages`: guest/Jonny/owner/system/tool messages for conversations.
- `ai_tool_calls`: Jonny tool-call audit rows with input/output summary, status, error code.
- `google_calendar_connections`: encrypted Google OAuth token storage and selected calendar state.
- `owner_notifications`: dashboard/action notifications for owners.
- `audit_logs`: operational audit records for important owner/system actions.

## Important Statuses And Enums
Property status:
- `draft`
- `setup_incomplete`
- `ready_pending_mode`
- `ready_auto_confirm_mode`
- `disabled`

Booking status:
- `pending`
- `confirmed`
- `rejected`
- `cancelled`

Booking source:
- `manual_owner`
- `ai_chat`

Calendar sync status:
- `not_required`
- `pending`
- `synced`
- `failed`
- `requires_reconnect`

Conversation channel:
- `web_chat`

Conversation status:
- `open`
- `waiting_for_guest`
- `waiting_for_owner`
- `booking_created`
- `closed`
- `escalated`

AI tool-call status:
- `success`
- `failed`
- `blocked`

Notification types:
- `booking_pending_created`
- `booking_confirmed`
- `booking_cancelled`
- `booking_rejected`
- `calendar_sync_failed`
- `google_reconnect_required`
- `ai_escalation_required`

## Migration Notes
Accepted migrations:
- `0001_sprint1_foundation.sql`: foundational owner/property/room/settings/public page schema and RLS baseline.
- `0002_booking_core_availability.sql`: bookings, booking events, room blocks, availability constraints and indexes.
- `0003_google_calendar_integration.sql`: Google Calendar connection and calendar sync fields.
- `0004_public_page_ai_receptionist.sql`: public page fields, conversations, conversation messages, AI tool calls.
- `0005_owner_notifications.sql`: owner notifications, notification enums, dedupe index, notification RLS.
- `0006_public_chat_schema_compatibility.sql`: compatibility migration for public chat schema drift and status constraints.
- `0007_public_chat_booking_draft.sql`: `conversations.metadata` and `bookings.conversation_id`.

## Schema Drift Fixes
- Sprint 4 public chat schema needed compatibility hardening for environments that had partial or older constraints.
- `0006_public_chat_schema_compatibility.sql` makes public chat types/tables/indexes idempotent where possible and aligns property statuses.
- `0007_public_chat_booking_draft.sql` adds durable draft metadata on conversations and booking-to-conversation linkage.
- Public booking closeout requires both `conversations.metadata` and `bookings.conversation_id`.

## Critical Relationships
- Most tenant-owned tables include `owner_id`.
- Property child rows include `property_id`.
- Public conversations are uniquely tied to `(property_id, public_session_id)`.
- Conversation messages point to `conversation_id` and include owner/property IDs.
- AI tool calls point to owner/property and optionally conversation.
- AI-chat bookings store `conversation_id` and `source = 'ai_chat'`.

## Data Safety Expectations
- Owners should only see rows matching their `owner_id`.
- Public guests should not directly access database tables.
- Public chat writes are mediated by server-only service-role route handlers.
- Pending AI-chat bookings should not have `google_calendar_event_id`.
