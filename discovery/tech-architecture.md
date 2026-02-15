# Technical Architecture: Crew Management App

## Executive Summary

This document defines the technical architecture for a sailboat racing crew management web application. The app enables boat owners to manage their vessels, invite crew members with role-based assignments, organize racing events, and coordinate to-do lists -- all while accounting for the reality that sailors frequently have poor or no connectivity on the water.

The architecture prioritizes: mainstream technology with large ecosystems, web-first with a clear mobile path, developer productivity for a small team, and cost-effective scaling from zero to thousands of boats.

---

## 1. Recommended Tech Stack

### Frontend: Next.js 14+ (App Router) with TypeScript

**Why Next.js:**
- Largest React meta-framework ecosystem; dominant market position in 2025-2026
- App Router provides React Server Components, reducing client-side JavaScript
- Built-in API routes eliminate the need for a separate backend server at launch
- Massive hiring pool -- more developers know Next.js than any alternative
- Vercel deployment is zero-config, but the app is deployable anywhere (Docker, AWS, etc.)
- TypeScript is non-negotiable for a production app with complex data relationships

**Why not alternatives:**
- **Remix / React Router v7**: Strong contender, but smaller ecosystem and community. Remix merged into React Router v7 in late 2024, creating transition confusion. Next.js has more tutorials, libraries, and hiring options.
- **SvelteKit**: Excellent DX but significantly smaller ecosystem. Harder to hire for.
- **Nuxt/Vue**: Good framework, but React dominates the job market and library ecosystem.

**Key frontend libraries:**

| Library | Purpose | Why |
|---------|---------|-----|
| Tailwind CSS 4 | Styling | Industry standard, rapid UI development, great with component libraries |
| shadcn/ui | Component library | Not a dependency -- copies components into your codebase. Tailwind-native, highly customizable, accessible |
| TanStack Query (React Query) | Client-side data fetching & caching | Best-in-class cache invalidation, optimistic updates, offline support |
| React Hook Form + Zod | Forms & validation | Performant forms with schema-based validation shared between client and server |
| date-fns | Date handling | Lightweight, tree-shakeable, timezone-aware |
| Zustand | Client state (minimal) | Tiny, simple, for the small amount of state that doesn't belong in server cache |

### Backend: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)

**Why Supabase:**
- **PostgreSQL underneath**: Industry-standard relational database. Perfect for the many-to-many relationships in crew management (crew members on multiple boats with different roles). Complex joins, foreign keys, and constraints are first-class.
- **Row Level Security (RLS)**: Security policies defined at the database level. A boat owner's RLS policy applies everywhere -- REST API, Realtime subscriptions, Edge Functions. This is critical for multi-tenant crew data.
- **Built-in Auth**: Email/password, magic links, OAuth (Google, Apple). The `@supabase/ssr` package handles cookie-based auth with Next.js App Router properly.
- **Realtime subscriptions**: Postgres Changes feature enables live updates when crew RSVP, to-do items are checked off, or event details change.
- **Edge Functions**: Deno-based serverless functions for custom logic (invitation emails, webhook handlers, Stripe integration). Direct database access.
- **No vendor lock-in**: Standard PostgreSQL. If Supabase disappears tomorrow, you migrate to any Postgres host (AWS RDS, Neon, Railway) and swap the client library for direct Postgres queries.
- **Cost-effective**: Free tier supports development and small-scale launch. Predictable pricing scales with resources, not per-read/write like Firebase.
- **Storage**: Built-in S3-compatible object storage for boat photos, profile pictures, event documents.

**Why not alternatives:**
- **Firebase**: NoSQL (Firestore) is a poor fit for many-to-many relationships. Vendor lock-in to Google. Per-read pricing can spike unpredictably. No real SQL.
- **Custom Express/Fastify API**: More flexibility, but dramatically more code to write for auth, permissions, realtime, file storage. A small team should not build infrastructure.
- **Prisma + PlanetScale**: Good for custom backends, but you're still building auth, realtime, and storage from scratch. Overkill when Supabase bundles them.
- **Convex/Appwrite**: Smaller ecosystems, less battle-tested at scale.

### Hosting & Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Next.js hosting (free tier generous, automatic previews, edge network) |
| **Supabase Cloud** | Database, auth, realtime, storage, edge functions |
| **Resend** | Transactional email (invitations, event reminders). Simple API, good deliverability, generous free tier |
| **Stripe** | Payments (when monetizing). Best-in-class subscription billing |
| **Sentry** | Error tracking and performance monitoring |
| **PostHog** | Product analytics (open-source, self-hostable, generous free tier) |

### Why this stack works for a small team

This entire stack can be operated by 1-3 developers. Supabase eliminates the need to build and maintain a backend server, auth system, realtime infrastructure, or file storage service. Next.js App Router's server components and API routes handle server-side logic without a separate deployment. The total infrastructure cost at launch is $0 (free tiers) scaling to ~$50-100/month for the first few thousand users.

---

## 2. Data Model

### Entity Relationship Diagram (Text)

```
Users ----< CrewMemberships >---- Boats
  |              |                   |
  |              |                   |----< Events
  |              |                   |        |
  |              |                   |        |----< EventAssignments >---- Users
  |              |                   |        |
  |              |                   |        |----< TodoLists
  |              |                   |                   |
  |              |                   |                   |----< TodoItems
  |              |                   |
  |              |                   |----< Invitations
  |              |
  |              |---- role (enum: owner, admin, crew)
  |
  |----< Notifications
```

### Core Entities

#### `users`
Extends Supabase Auth's `auth.users` with a public profile table.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  weight_lbs INTEGER,          -- relevant for sailing (crew weight affects performance)
  sailing_experience TEXT,     -- free text: years, certifications, etc.
  default_roles TEXT[],        -- preferred positions: ['trimmer', 'bowman', 'helmsman']
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `boats`

```sql
CREATE TABLE public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boat_type TEXT,              -- e.g., 'J/105', 'Melges 24', 'Beneteau First 36.7'
  sail_number TEXT,
  home_port TEXT,
  photo_url TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `crew_memberships` (Junction Table -- Many-to-Many)
This is the critical relationship table. A user can be on multiple boats, and a boat has multiple crew members. Each membership has a role.

```sql
CREATE TYPE crew_role AS ENUM ('owner', 'admin', 'crew');
CREATE TYPE sailing_position AS ENUM (
  'skipper', 'helmsman', 'tactician', 'trimmer',
  'bowman', 'pit', 'grinder', 'navigator', 'crew'
);

CREATE TABLE public.crew_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role crew_role NOT NULL DEFAULT 'crew',
  sailing_position sailing_position DEFAULT 'crew',
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  UNIQUE(boat_id, user_id)     -- one membership per user per boat
);
```

**Role semantics:**
- `owner`: Full control. Can delete the boat, manage billing, transfer ownership. At least one owner per boat.
- `admin`: Can edit boat details, create/edit events, manage crew, send invitations. Cannot delete the boat or manage billing.
- `crew`: Can view boat info, RSVP to events, see and complete assigned to-do items. Cannot edit boat or event details.

#### `events`

```sql
CREATE TYPE event_type AS ENUM ('race', 'practice', 'social', 'maintenance', 'other');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type DEFAULT 'race',
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `event_assignments`
Tracks which crew members are assigned to an event and their RSVP status.

```sql
CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined', 'tentative');

CREATE TABLE public.event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rsvp_status rsvp_status DEFAULT 'pending',
  sailing_position sailing_position,    -- position for this specific event (may differ from default)
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, user_id)
);
```

#### `todo_lists`

```sql
CREATE TABLE public.todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,  -- optional: tied to an event
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `todo_items`

```sql
CREATE TABLE public.todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_list_id UUID NOT NULL REFERENCES public.todo_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `invitations`

```sql
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES public.boats(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_email TEXT NOT NULL,
  role crew_role DEFAULT 'crew',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(boat_id, invited_email)   -- one active invite per email per boat
);
```

#### `notifications`

```sql
CREATE TYPE notification_type AS ENUM (
  'invitation_received', 'invitation_accepted',
  'event_created', 'event_updated', 'event_reminder',
  'rsvp_received', 'todo_assigned', 'todo_completed'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',        -- flexible payload (event_id, boat_id, etc.)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Indexes

```sql
CREATE INDEX idx_crew_memberships_user ON crew_memberships(user_id) WHERE is_active = true;
CREATE INDEX idx_crew_memberships_boat ON crew_memberships(boat_id) WHERE is_active = true;
CREATE INDEX idx_events_boat_start ON events(boat_id, start_time);
CREATE INDEX idx_event_assignments_event ON event_assignments(event_id);
CREATE INDEX idx_event_assignments_user ON event_assignments(user_id);
CREATE INDEX idx_todo_items_list ON todo_items(todo_list_id, sort_order);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_invitations_email ON invitations(invited_email) WHERE status = 'pending';
CREATE INDEX idx_invitations_token ON invitations(token) WHERE status = 'pending';
```

---

## 3. API Design

### Approach: Supabase Client SDK + Next.js Server Actions

Rather than building a traditional REST or GraphQL API, this architecture uses two complementary approaches:

**1. Supabase Client SDK (PostgREST auto-generated API)**
- Every table automatically gets a RESTful API with filtering, pagination, joins, and full-text search
- Type-safe via generated TypeScript types from your database schema (`supabase gen types typescript`)
- RLS policies handle authorization at the database level -- no middleware needed
- Supports complex queries with `.select('*, boats(name), profiles(full_name)')` join syntax

**2. Next.js Server Actions (for complex mutations)**
- Server-side functions that run on the server but are called like regular functions from client components
- Used for multi-step operations: "Create event AND assign all active crew AND send notification emails"
- Validate input with Zod schemas shared between client and server
- Use the Supabase service role (server-only) for admin operations that need to bypass RLS

### Key Query Patterns

```typescript
// Fetch user's boats with their role on each
const { data: myBoats } = await supabase
  .from('crew_memberships')
  .select('role, sailing_position, boats(id, name, boat_type, photo_url)')
  .eq('user_id', userId)
  .eq('is_active', true);

// Fetch upcoming events for a boat with crew assignments
const { data: events } = await supabase
  .from('events')
  .select(`
    *,
    event_assignments(
      rsvp_status,
      sailing_position,
      profiles(id, full_name, avatar_url)
    )
  `)
  .eq('boat_id', boatId)
  .gte('start_time', new Date().toISOString())
  .order('start_time', { ascending: true });

// Fetch to-do list with items and assignees
const { data: todoList } = await supabase
  .from('todo_lists')
  .select(`
    *,
    todo_items(
      *,
      assigned_to_profile:profiles!todo_items_assigned_to_fkey(full_name, avatar_url)
    )
  `)
  .eq('id', listId)
  .order('sort_order', { referencedTable: 'todo_items' });
```

### Server Action Examples

```typescript
// app/actions/events.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const CreateEventSchema = z.object({
  boatId: z.string().uuid(),
  title: z.string().min(1).max(200),
  eventType: z.enum(['race', 'practice', 'social', 'maintenance', 'other']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  assignAllCrew: z.boolean().default(true),
});

export async function createEvent(input: z.infer<typeof CreateEventSchema>) {
  const validated = CreateEventSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // RLS ensures only owners/admins can insert events for their boats
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      boat_id: validated.boatId,
      title: validated.title,
      event_type: validated.eventType,
      start_time: validated.startTime,
      end_time: validated.endTime,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-assign all active crew if requested
  if (validated.assignAllCrew) {
    const { data: crew } = await supabase
      .from('crew_memberships')
      .select('user_id, sailing_position')
      .eq('boat_id', validated.boatId)
      .eq('is_active', true);

    if (crew?.length) {
      await supabase.from('event_assignments').insert(
        crew.map(c => ({
          event_id: event.id,
          user_id: c.user_id,
          sailing_position: c.sailing_position,
        }))
      );
    }
  }

  return event;
}
```

### Realtime Strategy

Use **Supabase Realtime (Postgres Changes)** for live updates:

```typescript
// Subscribe to event assignment changes for a specific event
const channel = supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'event_assignments',
    filter: `event_id=eq.${eventId}`,
  }, (payload) => {
    // Update local state via React Query cache invalidation
    queryClient.invalidateQueries(['event-assignments', eventId]);
  })
  .subscribe();
```

This is used for:
- RSVP status changes (crew see each other's responses in real time)
- To-do item completion (crew see items being checked off live)
- New notifications

**Not** used for: event creation, boat settings changes, invitation flows (these are adequately served by polling or server action responses).

---

## 4. Auth & Permissions Model

### Authentication Flow

```
User arrives --> Supabase Auth (email/password or magic link or Google/Apple OAuth)
            --> Session stored in HTTP-only cookies (via @supabase/ssr)
            --> Next.js middleware checks session on every request
            --> getUser() validates against Supabase auth server (not just JWT)
```

**Auth providers (launch):**
1. **Email + password** -- standard account creation
2. **Magic link (email)** -- passwordless, great for invitations
3. **Google OAuth** -- one-click sign-in

**Auth providers (post-launch):**
4. **Apple Sign-In** -- required for iOS App Store
5. **SMS OTP** -- optional, when phone-based invitations are added

### Row Level Security (RLS) Policies

RLS is the backbone of the permissions system. Every query, whether from the client SDK, realtime subscription, or edge function, passes through these policies.

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view profiles of people on the same boats
CREATE POLICY "Users can view co-crew profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT cm2.user_id FROM crew_memberships cm1
      JOIN crew_memberships cm2 ON cm1.boat_id = cm2.boat_id
      WHERE cm1.user_id = auth.uid()
      AND cm1.is_active = true
      AND cm2.is_active = true
    )
  );

-- Only owners and admins can create events for a boat
CREATE POLICY "Owners and admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crew_memberships
      WHERE boat_id = events.boat_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- All active crew can view events for their boats
CREATE POLICY "Crew can view boat events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_memberships
      WHERE boat_id = events.boat_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- Users can update their own RSVP
CREATE POLICY "Users can update own RSVP"
  ON event_assignments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only owners/admins can manage crew memberships
CREATE POLICY "Owners and admins can manage crew"
  ON crew_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crew_memberships AS cm
      WHERE cm.boat_id = crew_memberships.boat_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = true
    )
  );
```

### Invitation Flow

```
1. Owner/Admin enters email + role --> Creates invitation record with unique token
2. System sends email via Resend with link: /invite/{token}
3. Recipient clicks link:
   a. If already has account --> Login prompt, then auto-accept
   b. If no account --> Sign-up flow, then auto-accept
4. On accept: create crew_membership record, mark invitation as accepted
5. Invitation expires after 7 days (configurable)
```

**Edge cases handled:**
- User invited to boat they're already on: show "already a member" message
- User invited who doesn't have an account yet: sign-up flow preserves the invitation token
- Multiple pending invitations from different boats: accept flow is per-invitation
- Owner revokes invitation before acceptance: mark as expired, link no longer works

### Permission Helper (Client-Side)

```typescript
// hooks/useBoatPermission.ts
type BoatRole = 'owner' | 'admin' | 'crew';

export function useBoatPermission(boatId: string) {
  const { data: membership } = useQuery(['membership', boatId], ...);

  return {
    role: membership?.role as BoatRole | null,
    canManageCrew: ['owner', 'admin'].includes(membership?.role),
    canEditEvents: ['owner', 'admin'].includes(membership?.role),
    canDeleteBoat: membership?.role === 'owner',
    canManageBilling: membership?.role === 'owner',
    isMember: !!membership,
  };
}
```

---

## 5. Offline & Poor Connectivity Strategy

### The Reality of Sailing Connectivity

Sailors frequently lose cellular/WiFi connectivity when on the water. This is not an edge case -- it is a core usage scenario. However, the critical insight is: **most planning and coordination happens on shore.** The on-water needs are different from the on-shore needs.

### Pragmatic Approach: Progressive Enhancement, Not Full Offline-First

Building a true offline-first app with conflict resolution is extremely complex and often overkill. Instead, we take a layered approach:

#### Layer 1: PWA with App Shell Caching (Day 1)

```json
// next.config.js -- use next-pwa or serwist
// Cache the app shell, static assets, and navigation
```

- **Service Worker** caches the app shell (layout, navigation, CSS, JS bundles)
- On poor connectivity, the app loads instantly from cache
- Static pages (boat info, crew list) render from cache even offline
- Forms and actions queue silently and sync when connectivity returns

#### Layer 2: TanStack Query Stale-While-Revalidate (Day 1)

```typescript
// React Query defaults for the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // Data is fresh for 5 minutes
      gcTime: 24 * 60 * 60 * 1000,    // Keep in cache for 24 hours
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});
```

- Last-fetched data is shown immediately while revalidating in the background
- If offline, cached data is displayed with a subtle "offline" indicator
- This covers the most common scenario: user checked the app on shore, goes sailing, opens app again

#### Layer 3: Optimistic Updates for Writes (Day 1)

```typescript
// Example: toggling a to-do item
const toggleTodo = useMutation({
  mutationFn: (todoId) => supabase.from('todo_items').update({ is_completed: true }).eq('id', todoId),
  onMutate: async (todoId) => {
    // Immediately update UI (optimistic)
    queryClient.setQueryData(['todos', listId], (old) =>
      old.map(t => t.id === todoId ? { ...t, is_completed: true } : t)
    );
  },
  onError: (err, todoId, context) => {
    // Revert on failure
    queryClient.setQueryData(['todos', listId], context.previousTodos);
    toast.error('Failed to update -- will retry when online');
  },
});
```

#### Layer 4: Background Sync for Queued Actions (Post-Launch)

For critical write operations (RSVP changes, to-do completions), use the Background Sync API:

```typescript
// Queue failed mutations for retry when online
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.sync.register('sync-pending-actions');
  });
}
```

### What We Explicitly Do NOT Build

- **Full CRDT-based offline sync** (e.g., Yjs, Automerge): Overkill for this use case. We are not building a collaborative real-time editor.
- **Local-first database** (e.g., PowerSync, ElectricSQL): Interesting technology, but adds significant complexity. Revisit if user research shows offline editing is a top-3 demand.
- **Offline event creation**: Users create events on shore. If they really need to while on water, the mutation queues and syncs later. No need for a local database.

### Connectivity UX

- Show a subtle banner when offline: "You're offline. Showing cached data."
- Allow all read operations from cache
- Queue write operations and show pending state: checkmark with a sync icon
- When connectivity returns, sync silently and notify on conflicts (rare)

---

## 6. Mobile Conversion Path

### Recommended Path: PWA First, Then Capacitor

#### Phase 1: PWA (Launch)

The web app is built as a Progressive Web App from day one:
- **Web App Manifest**: Installable on home screens (Android + iOS Safari)
- **Service Worker**: Offline shell, cached data, background sync
- **Responsive Design**: Mobile-first Tailwind layouts work on all screen sizes
- **Push Notifications**: Web Push API for event reminders and RSVP requests (Android; limited on iOS until further adoption)

A PWA covers 80% of the mobile use case with 0% additional code.

#### Phase 2: Capacitor (When Needed)

When app store presence becomes a business requirement (or when native APIs are needed):

- **Capacitor 6+** wraps the existing Next.js web app in a native shell
- The same codebase runs as a website, PWA, and native iOS/Android app
- Capacitor provides access to native APIs: push notifications (APNs/FCM), camera, GPS, share sheet, haptics
- No code rewrite required -- Capacitor runs your web app in a WebView with native bridges

```
// Example project structure with Capacitor
crew-management/
  src/              # Next.js app (shared)
  ios/              # Capacitor iOS project (auto-generated)
  android/          # Capacitor Android project (auto-generated)
  capacitor.config.ts
```

#### Why NOT React Native

- React Native requires a **complete rewrite** of the UI layer. Components are different (`<View>` not `<div>`, `<Text>` not `<p>`).
- Two codebases to maintain: web (Next.js) + mobile (React Native)
- For a crew management app (forms, lists, calendars, text), there is no performance benefit from native rendering
- React Native makes sense for apps that are mobile-first or need heavy native animations/gestures. This app is web-first.

#### Decision Criteria for Moving to Capacitor

Move to Capacitor when any of these become true:
1. iOS users need reliable push notifications (Web Push on iOS is still limited)
2. App Store presence is required for user acquisition or credibility
3. Users need native GPS tracking for on-water location sharing
4. Revenue justifies the Apple Developer ($99/yr) and Google Play ($25 one-time) fees

---

## 7. Scalability Considerations

### Start Simple, Don't Over-Engineer

The app's initial scale is modest: tens of boats, hundreds of users, thousands of events per year. PostgreSQL on Supabase handles this trivially. Here is what to keep in mind to avoid painting into a corner:

### Database

- **Indexes from day one** on foreign keys and common query patterns (defined in Section 2)
- **Soft deletes** on crew_memberships (`is_active` flag) rather than hard deletes. Preserves history.
- **JSONB for flexible data** (`notifications.data`, future custom fields) -- avoid wide column sprawl
- **UUID primary keys** everywhere -- no auto-incrementing integers that leak business data or cause issues in distributed systems

### Application

- **Server Components by default**: Only use `'use client'` when interactivity is needed. This keeps the JavaScript bundle small.
- **React Query cache**: Reduces redundant database queries. A well-tuned stale time means most navigation is instant.
- **Edge runtime** for middleware and lightweight API routes -- runs at the CDN edge, globally fast

### When to Scale (and How)

| Signal | Action |
|--------|--------|
| Database queries slowing | Add read replicas (Supabase supports this), optimize queries, add missing indexes |
| 10K+ concurrent realtime connections | Supabase scales this automatically, but evaluate costs |
| Email volume exceeds Resend free tier | Upgrade Resend plan ($20/mo for 50K emails) |
| Need multi-region | Deploy Next.js on Vercel (already global CDN), add Supabase read replica in second region |
| Need full-text search | Use Postgres `tsvector` (built-in) before reaching for Elasticsearch |
| Background jobs (reminders, digests) | Supabase Edge Functions with cron triggers, or Inngest for complex workflows |

### What NOT to Worry About Yet

- **Microservices**: A monolithic Next.js + Supabase app handles this workload for years
- **Kubernetes**: Vercel + Supabase abstracts all infrastructure
- **Custom caching layer (Redis)**: PostgreSQL + React Query caching is sufficient
- **Multi-tenancy isolation**: RLS provides logical isolation. Physical isolation (separate databases) is unnecessary until enterprise clients demand it.

---

## 8. Business Model Recommendations

### Recommended: Freemium with Per-Boat Pricing

Based on the technical architecture and the sailing crew management market:

#### Free Tier
- **1 boat**, unlimited crew members
- Up to **5 events per month**
- Basic to-do lists
- Email invitations

This is generous enough that casual sailors (weekend racing on one boat) never need to pay. This drives word-of-mouth adoption -- every crew member who joins creates a potential future boat owner/admin who pays.

#### Pro Tier ($9-12/month per boat, or $89-99/year per boat)
- **Unlimited boats**
- **Unlimited events**
- Advanced to-do lists (assignments, due dates, recurring items)
- Event reminders and notifications
- Crew availability tracking
- Export/reports (crew attendance history, RSVP rates)
- Priority support

#### Why Per-Boat, Not Per-User

- **Aligns with value**: The boat owner/admin gets the most value and is the natural payer. Crew members should never pay.
- **Simple decision**: "Is managing this boat worth $9/month?" -- easy yes for anyone racing competitively
- **Avoids crew friction**: If crew had to pay, adoption would stall. Free crew access is essential for network effects.
- **Scales naturally**: A sailing team with 3 boats pays 3x. A yacht club admin managing 20 boats is on a different tier.

#### Fleet / Yacht Club Tier ($49-99/month)
- **10+ boats** under one organization
- Centralized admin dashboard
- Cross-boat crew management
- Club-wide event calendar
- Custom branding
- SSO / team management

### Revenue Projections (Conservative)

| Milestone | Boats | Paying (20% conversion) | Monthly Revenue |
|-----------|-------|------------------------|-----------------|
| 6 months | 200 | 40 | $400 |
| 12 months | 1,000 | 200 | $2,000 |
| 24 months | 5,000 | 1,000 | $10,000 |
| 36 months | 15,000 | 3,000 | $30,000 |

### Cost Structure at Scale

| Service | 1,000 boats | 5,000 boats |
|---------|-------------|-------------|
| Supabase Pro | $25/mo | $75/mo (+ compute add-ons) |
| Vercel Pro | $20/mo | $20/mo |
| Resend | $0 (free tier) | $20/mo |
| Sentry | $0 (free tier) | $26/mo |
| Domain + misc | $15/mo | $15/mo |
| **Total** | **~$60/mo** | **~$160/mo** |

The infrastructure costs are negligible relative to revenue at any meaningful scale. This is a high-margin SaaS business.

### Monetization Timeline

1. **Months 1-3**: Everything free. Focus on getting 50+ boats onboarded and validating product-market fit.
2. **Months 4-6**: Introduce Pro tier. Grandfather early adopters with a discount.
3. **Months 6-12**: Introduce annual billing (20% discount). Add Fleet tier for yacht clubs.
4. **Year 2+**: Consider marketplace features (find crew, find boats to crew on) as a premium add-on.

---

## 9. Project Structure

```
crew-management/
  src/
    app/                          # Next.js App Router
      (auth)/                     # Auth group (login, signup, invite)
        login/page.tsx
        signup/page.tsx
        invite/[token]/page.tsx
      (dashboard)/                # Authenticated app
        layout.tsx                # Sidebar + nav
        boats/
          page.tsx                # My boats list
          [boatId]/
            page.tsx              # Boat detail (crew, upcoming events)
            events/
              page.tsx            # Events list
              [eventId]/page.tsx  # Event detail (assignments, RSVP, todos)
            crew/page.tsx         # Crew management
            settings/page.tsx     # Boat settings (owner/admin only)
            todos/
              page.tsx            # Todo lists
              [listId]/page.tsx   # Todo list detail
        profile/page.tsx          # User profile settings
        notifications/page.tsx    # Notification center
      api/                        # API routes (webhooks, cron)
        webhooks/stripe/route.ts
    actions/                      # Server Actions
      boats.ts
      events.ts
      invitations.ts
      todos.ts
    components/                   # Shared UI components
      ui/                         # shadcn/ui components
      boats/
      events/
      todos/
    hooks/                        # Custom React hooks
    lib/                          # Utility functions
    utils/
      supabase/
        client.ts                 # Browser Supabase client
        server.ts                 # Server Supabase client
        middleware.ts             # Auth middleware helper
    types/
      database.ts                 # Generated Supabase types
  supabase/
    migrations/                   # SQL migration files
    seed.sql                      # Development seed data
  public/
    manifest.json                 # PWA manifest
    sw.js                         # Service worker
  capacitor.config.ts             # (Added when mobile is needed)
```

---

## 10. Development Workflow

### Local Development

```bash
# Start Supabase locally (Docker)
npx supabase start

# Start Next.js dev server
npm run dev

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/types/database.ts
```

### Database Migrations

```bash
# Create a new migration
npx supabase migration new add_events_table

# Apply migrations locally
npx supabase db reset

# Push to production
npx supabase db push
```

### CI/CD

- **Vercel**: Auto-deploys on `main` push. Preview deployments on PRs.
- **Supabase**: Migrations applied via `supabase db push` in CI pipeline, or via Supabase's GitHub integration for linked projects.
- **Type checking**: `tsc --noEmit` in CI to catch type errors before deploy.
- **Linting**: ESLint with Next.js config + Prettier for formatting.

---

## Appendix: Key Technical Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js App Router | Largest ecosystem, SSR/RSC, hiring pool, Vercel deployment |
| Database | PostgreSQL (Supabase) | Relational data, RLS, no vendor lock-in, joins for many-to-many |
| Auth | Supabase Auth | Integrated with RLS, cookie-based SSR, magic links for invitations |
| Styling | Tailwind + shadcn/ui | Rapid development, accessible components, no runtime CSS |
| Data fetching | Supabase SDK + TanStack Query | Auto-generated API, client caching, optimistic updates, offline resilience |
| Realtime | Supabase Realtime (Postgres Changes) | Built-in, RLS-aware, no additional infrastructure |
| Email | Resend | Developer-friendly, good deliverability, generous free tier |
| Mobile path | PWA first, then Capacitor | No code rewrite, same codebase for web and mobile |
| Offline | Service Worker + React Query cache + optimistic updates | Pragmatic, covers real use cases without CRDT complexity |
| Payments | Stripe | Industry standard, best subscription billing |
| Hosting | Vercel + Supabase Cloud | Zero-config, global CDN, generous free tiers |
