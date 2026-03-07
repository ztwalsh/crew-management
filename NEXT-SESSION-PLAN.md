# Next Session Plan: Onboarding, AI Copilot, Roles & Permissions

## Current State Summary

- **Stack**: Next.js 16, React 19, Supabase, shadcn/ui, Tailwind 4, React Hook Form + Zod
- **Schema**: boats, profiles, crew_memberships (owner/admin/crew roles + sailing_position), events, event_assignments (RSVP tracking), invitations, notifications
- **No AI infrastructure yet** — no LLM packages, no chat UI, no streaming. Greenfield.
- **cmdk** (command palette) is installed but unused — good foundation for copilot UX
- **Resend** handles transactional email (invitations)
- **Existing permissions**: owner/admin can manage crew + events, crew is read-only + RSVP

---

## Phase 1: Onboarding & Bulk Import

### 1A. First-Run Welcome Flow

**Goal**: When a user signs up and has zero boats, guide them through setup instead of dropping them on an empty dashboard.

**Files to create/modify:**
- `src/app/(dashboard)/boats/page.tsx` — detect empty state, render onboarding wizard
- `src/components/onboarding/onboarding-wizard.tsx` — multi-step client component
- `src/components/onboarding/step-create-boat.tsx` — boat name, type, details (reuse CreateBoatDialog form fields)
- `src/components/onboarding/step-invite-crew.tsx` — bulk email input (textarea, one email per line or comma-separated) + role assignment
- `src/components/onboarding/step-import-events.tsx` — CSV upload or paste for events
- `src/components/onboarding/step-complete.tsx` — success state with link to new boat dashboard

**Flow:**
1. **Create your boat** — name, type, sail number, home port (required: name only)
2. **Add your crew** — bulk email input with role selector (admin vs. crew). Option to skip.
3. **Import events** — CSV upload or skip. Preview table before confirming.
4. **You're all set** — redirect to boat dashboard

**Server actions:**
- `src/actions/import.ts` — `importCrew(boatId, entries[])` and `importEvents(boatId, entries[])`
- Crew import: validate emails, create invitations in batch, send emails via Resend
- Event import: validate rows against event schema, batch insert, auto-assign crew

### 1B. Bulk Import (Available Anytime, Not Just Onboarding)

**Goal**: Owner/admin can import crew and events from CSV at any time from the crew and events pages.

**Files to create:**
- `src/components/import/csv-import-dialog.tsx` — reusable dialog: file upload + paste area, column mapping preview, validation errors, confirm
- `src/components/import/import-crew-button.tsx` — trigger on crew page (owner/admin only)
- `src/components/import/import-events-button.tsx` — trigger on events page (owner/admin only)
- `src/lib/csv-parser.ts` — client-side CSV parsing (use `papaparse` or hand-roll for simple cases)

**CSV formats:**

Crew CSV:
```
email,role,sailing_position
jane@example.com,crew,bowman
bob@example.com,admin,skipper
```

Events CSV:
```
title,event_type,start_time,end_time,location,all_day
Tuesday Practice,practice,2026-03-03T18:00:00,,Marina,false
Spring Series Race 1,race,2026-03-07T10:00:00,2026-03-07T16:00:00,Bay,false
```

**Validation:**
- Show preview table with row-by-row validation status
- Highlight invalid rows (bad email, unknown event_type, missing required fields)
- Allow user to fix or skip invalid rows before confirming
- Return summary: "12 crew invited, 2 skipped (duplicate emails)"

**Files to modify:**
- `src/app/(dashboard)/boats/[boatId]/crew/page.tsx` — add import button next to invite button
- `src/app/(dashboard)/boats/[boatId]/events/page.tsx` — add import button next to create event button

### 1C. Export

**Goal**: Download crew roster and events as CSV for backup or sharing.

**Files to create:**
- `src/lib/csv-export.ts` — serialize arrays to CSV string, trigger browser download
- Add export buttons alongside import buttons on crew and events pages

---

## Phase 2: AI Copilot

### 2A. Infrastructure

**Goal**: Add Anthropic Claude integration with a chat-based copilot UI.

**Dependencies to install:**
- `@anthropic-ai/sdk` (or use `ai` Vercel SDK with Anthropic provider for streaming)
- `ai` + `@ai-sdk/anthropic` — the Vercel AI SDK gives us streaming, tool calling, and React hooks out of the box

**Files to create:**
- `src/app/api/chat/route.ts` — streaming chat API route with tool definitions
- `src/lib/ai/tools.ts` — tool definitions the copilot can call (maps to server actions)
- `src/lib/ai/system-prompt.ts` — system prompt with app context, user role, current boat info

**Environment:**
- `ANTHROPIC_API_KEY` in `.env.local`

### 2B. Copilot Tools (Function Calling)

The copilot needs tools that map to existing server actions + new bulk operations:

**Boat management:**
- `create_boat` — name, type, sail_number, home_port
- `update_boat` — edit boat settings
- `list_boats` — show user's boats

**Crew management:**
- `invite_crew` — single or batch invite by email with role
- `update_crew_member` — change role, position
- `remove_crew_member` — remove from boat
- `list_crew` — list current crew with roles/positions
- `import_crew_csv` — parse and import crew from CSV text

**Event management:**
- `create_event` — single event with all fields
- `create_recurring_events` — e.g. "every Tuesday at 6pm for 8 weeks"
- `update_event` — edit event details
- `delete_event` — remove event
- `list_events` — upcoming/past events
- `import_events_csv` — parse and import events from CSV text

**RSVP:**
- `update_rsvp` — change the current user's RSVP status
- `get_event_availability` — show who's coming/maybe/declined for an event

**Each tool:**
1. Validates the user's permissions (role check) before executing
2. Calls the existing server action or a new one
3. Returns structured confirmation that the copilot can summarize

### 2C. Copilot UI

**Option A — Command Bar (recommended first pass):**
Leverage the already-installed `cmdk` package. Add a chat-enabled command palette.

**Files to create/modify:**
- `src/components/copilot/copilot-panel.tsx` — slide-out panel (right side) with chat messages + input
- `src/components/copilot/copilot-trigger.tsx` — floating button or keyboard shortcut (Cmd+K or Cmd+J)
- `src/components/copilot/message-bubble.tsx` — render user/assistant messages with markdown
- `src/components/copilot/tool-result-card.tsx` — render tool call results (e.g. "Created 5 events" with a mini table)

**UX flow:**
1. User opens copilot with keyboard shortcut or button
2. Panel slides in from right (doesn't navigate away from current page)
3. User types natural language: "Create practice sessions every Tuesday at 6pm for March"
4. Copilot calls `create_recurring_events` tool, streams confirmation
5. Page revalidates to show new events
6. Copilot shows summary: "Created 4 practice sessions for March 2026"

**Context injection:**
- System prompt includes: current boat name/id, user role, crew count, upcoming event count
- Copilot is scoped to the current boat (from URL params)
- Messages persist per-session only (no DB storage needed initially)

### 2D. Smart Suggestions

**Goal**: Proactive copilot suggestions based on context.

- Empty events page → "Want me to set up a recurring practice schedule?"
- After importing crew → "Should I create a welcome event for the new crew members?"
- Before a race → "3 crew haven't RSVP'd for Saturday's race. Want me to send reminders?"

Render these as dismissible suggestion chips above the copilot input.

---

## Phase 3: Roles & Permissions

### 3A. Tighten Existing Permission Model

**Current gaps to fix:**
- Boat creation doesn't auto-add creator to crew_memberships as owner — verify and fix
- Some actions don't explicitly check boat membership — add guards
- Admins can currently do almost everything owners can — consider differentiating

**Permission matrix to implement:**

| Action                  | Owner | Admin | Crew |
|------------------------|-------|-------|------|
| Delete boat            | ✅    | ❌    | ❌   |
| Edit boat settings     | ✅    | ✅    | ❌   |
| Invite crew            | ✅    | ✅    | ❌   |
| Remove crew            | ✅    | ✅*   | ❌   |
| Promote to admin       | ✅    | ❌    | ❌   |
| Create/edit events     | ✅    | ✅    | ❌   |
| Delete events          | ✅    | ✅    | ❌   |
| RSVP to events         | ✅    | ✅    | ✅   |
| View crew/events       | ✅    | ✅    | ✅   |
| Import crew/events     | ✅    | ✅    | ❌   |
| Use copilot (mutating) | ✅    | ✅    | ❌   |
| Use copilot (read)     | ✅    | ✅    | ✅   |
| Export data            | ✅    | ✅    | ✅   |

*Admin can remove crew but not other admins

**Files to create:**
- `src/lib/permissions.ts` — centralized `can(role, action)` helper used by all server actions and UI components
- Refactor all server actions to use this helper instead of inline role checks

### 3B. Per-Event Role Assignments (Race Positions)

**Goal**: For race events, assign specific positions to crew members (who's helming, who's on bow, etc.)

**Current state**: `event_assignments` already has a `sailing_position` column that's copied from the crew membership default. But there's no UI to change it per-event.

**Files to create/modify:**
- `src/components/events/position-assignment.tsx` — drag-and-drop or dropdown UI for assigning positions to crew for a specific event
- Modify event detail page to show position assignments in a visual layout
- Modify `src/actions/events.ts` — add `updateEventAssignment(assignmentId, { sailing_position })` action

**UI concept for race events:**
- Show a "Crew Positions" card on the event detail page
- List all assigned crew with a position dropdown next to each
- Owner/admin can change positions; crew can see but not edit
- Visual indicator for unfilled critical positions (e.g., no skipper assigned)

### 3C. Position Templates

**Goal**: Save and reuse position configurations across races.

**Schema addition:**
```sql
create table position_templates (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid references boats(id) on delete cascade,
  name text not null,
  positions jsonb not null, -- { "skipper": "user_id", "bowman": "user_id", ... }
  created_at timestamptz default now()
);
```

**Files to create:**
- `src/components/events/position-template-selector.tsx` — apply a saved template to an event
- `src/actions/position-templates.ts` — CRUD for templates
- Migration file for new table

---

## Implementation Order

**Session 1 — Foundation (do first):**
1. `src/lib/permissions.ts` — centralized permission helper (Phase 3A)
2. Refactor existing server actions to use it
3. `src/lib/csv-parser.ts` + `src/lib/csv-export.ts` — parsing/export utilities

**Session 2 — Bulk Import/Export:**
4. `src/actions/import.ts` — bulk import server actions
5. `src/components/import/csv-import-dialog.tsx` — reusable import dialog
6. Wire import/export buttons into crew and events pages
7. Test with sample CSVs

**Session 3 — Onboarding Wizard:**
8. `src/components/onboarding/` — wizard components
9. Empty-state detection and wizard trigger
10. Connect wizard steps to existing + import actions

**Session 4 — AI Copilot Infrastructure:**
11. Install `ai` + `@ai-sdk/anthropic`
12. `src/app/api/chat/route.ts` — streaming endpoint
13. `src/lib/ai/tools.ts` — tool definitions mapping to server actions
14. `src/lib/ai/system-prompt.ts`

**Session 5 — Copilot UI:**
15. `src/components/copilot/` — panel, trigger, message rendering
16. Wire into dashboard layout
17. Test conversational flows (create events, invite crew, check availability)

**Session 6 — Per-Event Positions:**
18. Position assignment UI on event detail page
19. Position templates (schema + CRUD + UI)

---

## Open Questions (To Decide Before Building)

1. **Copilot placement**: Slide-out panel (like Cursor) vs. inline on each page vs. full command bar? Recommendation: slide-out panel.
2. **Copilot scope**: Should crew members be able to use the copilot for read-only queries ("who's coming Saturday?"), or is it admin-only?
3. **Import sources**: Just CSV, or also Google Sheets / Notion / other integrations later?
4. **Recurring events**: Store as individual events (simpler) or as a recurrence rule with expansion (more flexible)? Recommendation: individual events generated from a pattern.
5. **Real-time**: Should crew see live updates when admin makes changes via copilot? Supabase Realtime is available but not wired up yet.
6. **Position templates**: Are these needed for v1, or can we ship with just per-event position editing first?
