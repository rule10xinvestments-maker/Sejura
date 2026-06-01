# Pilot Metrics

## Purpose
Track whether Owner Pilot #1 proves the current Sejura MVP is useful, safe, and understandable.

## Success Definition
Owner Pilot #1 succeeds if the owner can use Sejura to receive and manage real pending booking requests with less friction than manual handling, without security incidents or booking-state confusion.

## Core KPIs
- Owner onboarding completed: yes/no.
- Public URL shared with owner: yes/no.
- Public page loaded successfully: count.
- Jonny conversations started: count.
- Availability requests attempted: count.
- Availability requests successful: count and percentage.
- Pending booking requests created: count.
- Owner viewed pending booking: count and percentage.
- Owner acted on pending booking: count and percentage.
- AI-created confirmed bookings: must be zero.
- Cross-tenant/security incidents: must be zero.

## Flow Quality Metrics
- Guest messages requiring clarification: count.
- Ambiguous date messages: count.
- Room selection failures: count.
- Contact extraction failures: count.
- Stale draft regressions: count, must be zero.
- Tool-call failures by tool:
  - `get_property_info`
  - `list_rooms`
  - `check_availability`
  - `create_pending_booking`
  - `escalate_to_owner`

## Owner Experience Metrics
Ask owner to rate 1-5:
- Setup clarity.
- Public page confidence.
- Jonny response quality.
- Booking review clarity.
- Notification usefulness.
- Trust in pending-only flow.
- Overall willingness to continue pilot.

## Support Metrics
- Bugs reported by severity:
  - P0
  - P1
  - P2
  - P3
- Time to acknowledge bug.
- Time to reproduce bug.
- Time to workaround or resolve.
- Number of support interventions during pilot.

## SQL Measurement Queries
Tool-call counts:

```sql
select
  tool_name,
  status,
  count(*) as count
from public.ai_tool_calls
group by tool_name, status
order by tool_name, status;
```

Recent AI-chat bookings:

```sql
select
  status,
  source,
  count(*) as count
from public.bookings
where source = 'ai_chat'
group by status, source
order by status;
```

Conversation volume:

```sql
select
  status,
  count(*) as count
from public.conversations
group by status
order by status;
```

Pending booking owner action:

```sql
select
  id,
  status,
  source,
  conversation_id,
  created_at,
  updated_at
from public.bookings
where source = 'ai_chat'
order by created_at desc;
```

## Pilot Pass Threshold
Minimum pass:
- 1 owner onboarded.
- 1 public smoke completed.
- 1 pending AI-chat booking created.
- Owner can find and act on the booking.
- No P0 issues.
- No AI-created confirmed bookings.
- No cross-tenant data exposure.

Strong pass:
- Owner completes at least 3 real or realistic guest flows.
- At least 80% of exact-date availability requests succeed.
- Owner rates booking review clarity 4/5 or higher.
- Owner wants to continue using Sejura after the pilot session.

## Metrics Review Rhythm
- During first dry run: record all setup and flow friction.
- During first live use: monitor every public conversation.
- End of pilot day: review bugs, owner ratings, and SQL metrics.
- Before next scope decision: decide whether to harden current MVP or expand carefully.
