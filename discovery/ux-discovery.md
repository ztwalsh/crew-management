# UX Discovery: Crew Management for Sailboat Racing

**Date:** 2026-02-08
**Author:** UX Designer (Discovery Phase)

---

## 1. Problem Space & Competitive Landscape

### The Problem

Sailboat racing crews currently cobble together a patchwork of tools to manage their operations: Google Sheets for availability tracking, Facebook groups for photos, email chains for race documents, and generic sports apps like TeamSnap that were never designed for sailing. The result is fragmented information, missed communications, and unnecessary friction in what should be an exciting, well-coordinated sport.

### What Exists Today

| Tool | Strengths | Weaknesses |
|------|-----------|------------|
| **TeamSnap** | Large user base, general sports management | Not sailing-specific; poor notification reliability (~30% delivery rate per user reports); clunky UI; ignored sailing feature requests for 2+ years |
| **Crew Manager** | Sailing-specific features; responsive to user feedback; email templates with mail merge | Dated visual design; desktop-centric; not a modern web app experience |
| **SailPro** | Boat management, race tracking, inventory | Focused on performance/tracking, not crew coordination |
| **Tactiqs** | Performance analysis, racing data | Tactical/performance tool, not a crew management platform |
| **Google Sheets + Email** | Free, flexible | Manual, no notifications, no structure, doesn't scale |
| **Facebook Groups** | Easy photo sharing, social | Not a management tool; mixing social with operations |

### The Opportunity

There is no modern, well-designed, sailing-specific crew management app. Every existing option is either (a) generic and poorly adapted, or (b) sailing-specific but visually dated and lacking modern UX patterns. The gap is clear: **build something that feels like Linear or Notion but is purpose-built for sailboat racing crews.**

---

## 2. User Personas

### Persona 1: The Boat Owner / Admin (Primary)

**Name:** "Captain Pat"
- Owns or manages 1-3 boats
- Organizes the racing calendar, recruits crew, assigns positions
- Needs to know who is available for each race at a glance
- Wants to distribute race documents (Notice of Race, Sailing Instructions) easily
- Coordinates pre-race to-do lists (gear checks, provisioning, logistics)
- Pain point: spends too much time chasing crew via text/email instead of sailing

**Goals:**
- See availability across the entire season in one view
- Assign crew to positions per event with minimal friction
- Distribute information without repetitive manual work
- Track to-do completion without nagging

### Persona 2: The Crew Member

**Name:** "Crew Casey"
- Sails on 2-4 different boats across the season
- Has a primary role (e.g., trimmer) but can fill other positions
- Needs a single place to see all upcoming events across all boats
- Wants to quickly mark availability (yes / no / maybe)
- Needs to see what to-do items are assigned to them
- Pain point: information scattered across multiple group chats and email threads

**Goals:**
- One unified calendar across all boats
- Quick availability responses (don't make me log in and navigate 5 screens)
- Know exactly what to bring and do before each event
- Stay informed without being overwhelmed by notifications

### Persona 3: The Fleet / Club Organizer (Secondary / Future)

**Name:** "Fleet Frances"
- Manages a one-design fleet or yacht club racing program
- Needs to coordinate across multiple boats for series events
- Wants to see participation and results at the fleet level
- Could be a future expansion beyond MVP

**Goals:**
- Fleet-wide event management
- Aggregate participation data
- Communicate across all boats in the fleet

---

## 3. Key User Flows

### Flow 1: Onboarding & First Boat Setup

The onboarding flow should follow modern SaaS patterns: minimal friction, progressive disclosure, and a quick time-to-value.

```
Sign Up (Email / Google OAuth / Apple ID)
    |
    v
Welcome Screen: "Are you creating a boat or joining one?"
    |
    +---> "Creating a boat"
    |         |
    |         v
    |     Enter boat name + optional photo
    |         |
    |         v
    |     Select boat type / class (searchable list + custom)
    |         |
    |         v
    |     Invite crew (email / link / QR code)
    |         |
    |         v
    |     Land on the Boat Dashboard (populated with a sample event)
    |
    +---> "Joining a boat"
              |
              v
          Enter invite code or link
              |
              v
          Set your profile (name, primary role, weight)
              |
              v
          Land on the Boat Dashboard
```

**Design principles for onboarding:**
- 3-step max before seeing the dashboard
- Pre-populate a sample event so the workspace feels alive, not empty
- Allow skipping optional steps (photo, boat class) -- don't block progress
- Show a subtle onboarding checklist in the sidebar (a la Notion) that disappears once complete

### Flow 2: Creating an Event

```
From Boat Dashboard or Calendar view:
    |
    v
Click "+ New Event" or use Cmd+K > "Create event"
    |
    v
Quick-create modal (inline, not a new page):
  - Event name (pre-filled with "Race" or "Practice")
  - Date & time
  - Location (with recent locations suggested)
  - Event type: Race / Practice / Social / Other
    |
    v
Event created --> Crew automatically notified
    |
    v
Event detail view opens:
  - Crew assignment panel (drag crew to positions)
  - Availability tracker (who responded yes/no/maybe)
  - To-do checklist section
  - Documents section (attach NOR, SIs, etc.)
  - Discussion thread
```

### Flow 3: Crew Availability Response

This must be the fastest possible interaction -- ideally completable from a push notification or email without even opening the app.

```
Crew member receives notification:
"Race: Wednesday Night Series #4 - June 12. Can you make it?"
    |
    v
Three inline buttons: [Yes] [No] [Maybe]
    |
    v
Response recorded instantly. Done.
    |
    v
(Optional) Tap to open event details for more context
```

**Design note:** This is the single most important micro-interaction in the app. If responding to availability takes more than 2 taps/clicks, adoption will suffer. Model this after Doodle/When2meet simplicity but with better visual design.

### Flow 4: Managing To-Do Lists

```
Inside an Event detail view:
    |
    v
To-do section with quick-add input at top
    |
    v
Type task > press Enter > task created
    |
    v
Click task to expand:
  - Assign to crew member(s)
  - Set due date
  - Add notes
    |
    v
Crew members see their assigned tasks in:
  - The event detail view
  - Their personal "My Tasks" view (across all boats)
  - Notifications / reminders
```

### Flow 5: Switching Between Boats (Multi-Boat Crew Member)

```
Sidebar shows all boats the user belongs to:
  - [icon] Windchaser (active)
  - [icon] Rogue Wave
  - [icon] Second Wind
    |
    v
Click a boat name --> context switches to that boat's dashboard
    |
    v
Or: "All Boats" view shows:
  - Unified calendar with color-coded events by boat
  - Unified task list across all boats
  - Unified notification feed
```

---

## 4. Information Architecture

### Primary Navigation (Sidebar)

The app should use a collapsible left sidebar, following the pattern established by Linear, Notion, Discord, and Slack. This is the dominant navigation paradigm for modern web apps and for good reason: it scales well, provides persistent context, and works across screen sizes.

```
+------------------------------------------+
| [Logo] Crew                         [<]  |
+------------------------------------------+
|                                          |
| PERSONAL                                 |
|   Home (unified dashboard)               |
|   My Calendar                            |
|   My Tasks                               |
|   Notifications                          |
|                                          |
+------------------------------------------+
|                                          |
| BOATS                                    |
|   + Add Boat                             |
|                                          |
|   Windchaser                             |
|     Dashboard                            |
|     Events                               |
|     Crew                                 |
|     To-Dos                               |
|     Documents                            |
|     Settings                             |
|                                          |
|   Rogue Wave                             |
|     Dashboard                            |
|     Events                               |
|     ...                                  |
|                                          |
+------------------------------------------+
|                                          |
| [Avatar] Casey M.            [Settings]  |
+------------------------------------------+
```

### Key Views

**1. Home / Dashboard**
- Upcoming events across all boats (next 7-14 days)
- Pending availability requests requiring response
- Assigned tasks due soon
- Recent activity feed

**2. Boat Dashboard**
- Next upcoming event with crew assignment status
- Crew roster with availability heatmap for upcoming events
- Recent activity on this boat
- Quick actions: Create Event, Invite Crew, Add To-Do

**3. Events View**
- Calendar view (month/week toggle) OR list view
- Color-coded by event type (race = blue, practice = green, social = amber)
- Click event to open detail panel (slide-over or modal, not a page navigation)

**4. Crew View**
- Grid of crew members with their primary role, availability status
- Drag-and-drop to assign crew to positions for events
- Invite link / QR code generation
- Contact information (phone, email)

**5. Event Detail View**
- Header: Event name, date, location, type
- Tabs or sections: Crew Assignments | To-Dos | Documents | Discussion
- Crew assignment: visual position chart (not just a list -- show the boat layout with positions)
- Availability status per crew member

**6. To-Do View**
- Filterable by: boat, event, assignee, status
- Quick-add at top
- Checkbox interaction with satisfying animation
- Group by event or by assignee

---

## 5. UI/UX Design System Recommendations

### Design Philosophy

The app should feel like **Linear meets a nautical chart**: clean, fast, intentional, with subtle maritime character that never becomes kitschy. Avoid clipart anchors, rope borders, or wave patterns. Instead, convey the nautical theme through color, typography, and subtle atmospheric touches.

### Color System

**Dark mode as the default** (with light mode available). Sailing apps should feel premium, and dark mode conveys sophistication while being easier on the eyes for users checking the app outdoors on bright days (paradoxically, dark UI with high contrast text can be more readable in mixed lighting).

**Primary palette:**
- Background: Deep navy/charcoal (`#0F1117` -- almost black with a hint of blue)
- Surface: Slightly elevated dark (`#1A1D27`)
- Card/Panel: `#22252F` with subtle 1px border at `rgba(255,255,255,0.06)`
- Text Primary: `#E8E9ED` (warm off-white)
- Text Secondary: `#8B8D97`
- Accent: A distinctive teal/ocean blue (`#0EA5E9` or similar -- think clear tropical water)

**Semantic colors:**
- Available/Yes: `#22C55E` (green)
- Unavailable/No: `#EF4444` (red)
- Maybe: `#F59E0B` (amber)
- Race events: `#3B82F6` (blue)
- Practice events: `#22C55E` (green)
- Social events: `#A855F7` (purple)

**Light mode:** Invert thoughtfully. White/gray backgrounds, same accent colors. Don't just invert -- redesign surfaces for light context. Follow Linear's approach of using the same accent system but adjusting surface colors for each mode.

### Typography

Use a modern, clean sans-serif with good readability at small sizes:

- **Primary font:** Inter (the gold standard for modern web apps -- used by Linear, Vercel, and countless modern tools)
- **Monospace accent:** JetBrains Mono or Berkeley Mono for data-heavy elements (timestamps, coordinates, race numbers)
- **Headings:** Semi-bold or bold Inter, tracked slightly tighter
- **Body:** Regular Inter, 14-16px base size
- **Small text / metadata:** 12px, secondary color

### Component Patterns

**Command Palette (Cmd+K)**
This is non-negotiable for a modern app. The command palette should:
- Open with `Cmd+K` (Mac) / `Ctrl+K` (Windows)
- Search across: boats, events, crew members, actions, settings
- Show recent items and suggested actions
- Display keyboard shortcuts inline for discoverable power-user features
- Support scoped search (e.g., type `>` for commands, `@` for crew, `#` for boats)

**Contextual Menus (Right-Click)**
Every entity (event, crew member, task, boat) should have a right-click context menu with relevant actions. This is what separates apps that "feel right" from apps that feel like web pages.

- Event: Edit, Duplicate, Delete, Copy Link, Share
- Crew Member: View Profile, Message, Assign to Event, Remove from Boat
- Task: Edit, Reassign, Set Due Date, Delete

**Keyboard Shortcuts**
Invest heavily in keyboard navigation:
- `N` -- New event
- `T` -- New task
- `[` -- Collapse/expand sidebar
- `J/K` -- Navigate up/down in lists
- `Enter` -- Open selected item
- `Esc` -- Close modal/panel, go back
- `?` -- Show keyboard shortcuts help
- `1-9` -- Switch between boats

**Toasts & Feedback**
Every action should have instant visual feedback:
- Success toasts that auto-dismiss after 3 seconds (bottom-right, a la Sonner)
- Undo support for destructive actions ("Crew member removed. [Undo]")
- Optimistic updates -- don't wait for the server to update the UI

**Animations & Transitions**
- Page transitions: subtle fade + slight vertical shift (200ms ease-out)
- Modal/panel open: scale from 0.95 to 1.0 with fade (150ms)
- List reordering: smooth position animations (spring physics, not linear)
- Checkbox completion: satisfying checkmark draw animation with subtle confetti/particle for task completion
- Sidebar collapse: smooth width transition (250ms)
- Skeleton loading states instead of spinners

**Cards & Surfaces**
Use subtle elevation through borders and slight background shifts, not drop shadows. Consider dark glassmorphism for floating panels and modals:
- `backdrop-filter: blur(16px)` with semi-transparent backgrounds
- Subtle 1px borders with low-opacity white
- This creates depth without heavy visual weight

**Drag & Drop**
Essential for:
- Assigning crew to positions on the position chart
- Reordering to-do items
- Moving events on a calendar

Use a library like dnd-kit. Provide clear visual affordances (grab handles, drop zones that highlight on hover).

### Empty States

Every view needs a thoughtful empty state. Empty states are where apps either feel alive or feel broken.

- **No events yet:** "Your calendar is clear. Create your first event to get the crew together." [+ Create Event]
- **No crew yet:** "A boat needs a crew. Invite your team to get started." [Invite Crew]
- **No tasks:** "Nothing on the list. Smooth sailing ahead."

Use subtle illustrations (line-art style, nautical but minimal) for empty states. This is the one place where maritime theming can shine without being cheesy.

---

## 6. Mobile-Responsive Strategy

### Approach: Responsive Web, Not Separate Mobile App

Build web-first with responsive breakpoints. The app should work excellently in mobile Safari and Chrome. Eventually wrap with Capacitor or similar for app store distribution, but the web experience must stand alone.

### Mobile Navigation

On mobile (< 768px), replace the sidebar with:

**Bottom tab bar** (3-5 tabs):
```
+-------+-------+-------+-------+-------+
| Home  | Cal   |  [+]  | Tasks | More  |
+-------+-------+-------+-------+-------+
```

- **Home:** Dashboard / feed
- **Calendar:** Events across all boats
- **[+]:** Floating action button for quick creation (event, task, availability response)
- **Tasks:** My tasks view
- **More:** Boats list, profile, settings, notifications

This follows the Instagram/YouTube/Linear mobile pattern that users already understand.

### Mobile-Specific Patterns

**Swipe gestures:**
- Swipe left on a task to complete it
- Swipe right on a task to snooze/reschedule
- Swipe between boats in dashboard view
- Pull to refresh everywhere

**Bottom sheets instead of modals:**
On mobile, use bottom sheets (slide up from bottom) instead of centered modals. This keeps content within thumb reach and follows iOS/Android native patterns.

**Condensed event cards:**
On mobile, event cards should show the essential info at a glance:
```
+------------------------------------------+
| Wed Jun 12 - 6:00 PM                     |
| Wednesday Night Series #4                |
| Windchaser                               |
| 5/7 crew confirmed        [Yes] [No]    |
+------------------------------------------+
```

The availability response buttons should be inline on mobile -- never require navigating into the event just to respond.

### Progressive Web App (PWA) Features

- **Offline support:** Cache the schedule and crew info so it's viewable without connectivity (common at marinas)
- **Push notifications:** Critical for availability requests, event changes, and task reminders
- **Add to Home Screen:** Prompt users to install the PWA for native app-like access
- **Background sync:** Queue availability responses made offline and sync when connectivity returns

---

## 7. Notification Strategy

### Notification Channels

| Channel | Use Case | Priority |
|---------|----------|----------|
| **In-app** | Activity feed, task updates, discussion replies | All events |
| **Push notification** | New event created, availability request, event changes, task assigned | High priority |
| **Email digest** | Weekly summary of upcoming events, unresponded availability requests | Low priority / digest |
| **SMS (future)** | Day-of event reminders, last-minute cancellations | Critical only |

### Notification Design Principles

1. **Actionable from the notification itself** -- availability responses should be answerable from the push notification without opening the app (action buttons: Yes / No / Maybe)

2. **Smart batching** -- don't send 5 separate notifications for 5 new tasks. Batch them: "You have 5 new tasks for Wednesday Night Series #4"

3. **Respect user preferences** -- granular notification settings per channel and per event type. Some crew members want everything; others want minimal pings.

4. **Quiet hours** -- default quiet hours (10pm-7am) with user override

5. **In-app notification center** -- a panel (slide-over from right, like Linear) that shows all notifications grouped by time, with read/unread states and bulk actions

### Notification Triggers

| Trigger | Who Gets Notified | Channel |
|---------|-------------------|---------|
| New event created | All boat crew | Push + In-app |
| Availability request | Specific crew | Push + In-app |
| Crew member responds to availability | Boat admin | In-app |
| All crew have responded | Boat admin | Push + In-app |
| Event details changed (time, location) | Confirmed crew | Push + In-app |
| Event cancelled | All boat crew | Push + Email + In-app |
| Task assigned | Assignee | Push + In-app |
| Task completed | Task creator / admin | In-app |
| Task due soon (24h before) | Assignee | Push + In-app |
| New discussion message | Event participants | In-app (push if @mentioned) |
| Crew member invited | Invitee | Email + Push |

---

## 8. Interaction Details & Micro-Patterns

### The Position Chart

One of the most visually distinctive features: a simplified top-down or side-view diagram of the boat showing crew positions. This replaces a boring list of "Position: Name" pairs with something visual and intuitive.

```
         [Bowman]
            |
       [Mast/Pit]
      /          \
  [Port Trim]  [Stbd Trim]
      \          /
     [Tactician]
         |
     [Helmsman]
         |
      [Skipper]
```

- Drag crew member avatars onto position slots
- Empty positions glow subtly to indicate they need filling
- Filled positions show the crew member's avatar and name
- Tap a position to see who has filled it historically
- Show a "confidence score" based on availability (green = confirmed, amber = maybe, gray = no response)

### Availability Heatmap

For the season calendar view, show a heatmap-style grid:

```
              Jun 5   Jun 12  Jun 19  Jun 26  Jul 3
Casey M.      [YES]   [YES]   [NO]    [---]   [YES]
Pat D.        [YES]   [MAYBE] [YES]   [---]   [YES]
Jordan K.     [NO]    [YES]   [YES]   [---]   [MAYBE]
Alex T.       [YES]   [YES]   [YES]   [---]   [YES]
```

Color-coded cells. At a glance, the admin can see which events are well-staffed and which need attention.

### Quick Switcher

Beyond Cmd+K, a quick boat switcher in the sidebar header (click the current boat name to see a dropdown of all boats). Similar to Slack's workspace switcher or Linear's team switcher.

### Invite Flow

Multiple invite methods to reduce friction:
1. **Share link** -- copy a URL anyone can use to request to join
2. **QR code** -- perfect for in-person invites at the dock
3. **Email invite** -- enter email addresses, sends a branded invitation
4. **Invite code** -- short alphanumeric code (e.g., `WIND-4829`) for verbal sharing

---

## 9. Visual Identity Notes

### Do:
- Use clean, geometric sans-serif typography (Inter)
- Use a limited, intentional color palette with nautical undertones (navy, teal, ocean blue)
- Use subtle depth through borders and glassmorphism, not heavy shadows
- Use purposeful animations that convey speed and responsiveness
- Use photography of real sailing for marketing / onboarding, not in the app UI itself
- Consider a subtle wave or compass motif in the logo, abstracted into geometric form

### Don't:
- Use rope fonts, anchor icons, or ship wheel graphics
- Use blue-and-white striped patterns
- Use ocean/wave background textures
- Use overly playful illustrations (this is a tool for competitive sailors, not a kids' app)
- Use stock photography of sailing in the app interface
- Use gratuitous animations that slow down workflows

### Logo Direction

The app name "Crew" (or whatever is chosen) should have a clean wordmark. Consider a subtle nautical element integrated into the letterform -- perhaps the "C" suggests a compass rose or the negative space forms a sail. Abstract and geometric, never literal.

---

## 10. Technical UX Considerations

### Performance Budget

Modern users expect instant interactions. Target:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Route transitions: < 200ms (use optimistic UI)
- Action feedback (button click to visual response): < 100ms

### Optimistic Updates

Don't wait for server confirmation for common actions:
- Marking availability (update UI immediately, sync in background)
- Checking off tasks
- Sending messages in discussion threads

If the server rejects the action, roll back with a toast explaining why.

### Offline Resilience

Key data should be cached for offline access:
- Crew roster and contact info
- Upcoming event schedule
- To-do lists
- Recent activity (read-only)

Queue mutations (availability responses, task completions) for sync when online.

### Accessibility

- Full keyboard navigation (not just shortcuts -- tab order, focus management)
- ARIA labels on all interactive elements
- Minimum 4.5:1 contrast ratio for text (WCAG AA)
- Reduced motion mode that disables animations
- Screen reader support for the position chart (provide text alternative)

---

## 11. Prioritized Feature Roadmap (UX Perspective)

### Phase 1: Core (MVP)
- Boat creation and crew invitation
- Event creation with date/time/location
- Crew availability tracking (yes/no/maybe)
- Basic to-do lists per event
- Dark mode + light mode
- Mobile-responsive layout
- Push notifications for availability requests
- Command palette (Cmd+K)

### Phase 2: Enhanced
- Position chart with drag-and-drop crew assignment
- Availability heatmap (season view)
- Document attachments per event
- Discussion threads per event
- Email digest notifications
- PWA with offline support
- Keyboard shortcuts

### Phase 3: Growth
- Fleet / club level features
- Race results tracking
- Photo sharing per event
- Integration with calendar apps (Google Calendar, Apple Calendar)
- Recurring events / series management
- Crew weight tracking for racing class compliance
- SMS notifications for critical updates

---

## 12. Summary of Design Inspirations

| Inspiration | What to Take From It |
|---|---|
| **Linear** | Command palette, keyboard shortcuts, minimal but fast UI, sidebar navigation, dark theme, collapsible sidebar, notification panel |
| **Notion** | Progressive onboarding, workspace switcher, slash commands, flexible content blocks, empty states |
| **Discord** | Server/channel metaphor (boat/view), voice of the UI (casual but competent), member list with roles, real-time presence |
| **Figma** | Collaborative feel, contextual toolbars, command palette, avatar stacking for presence, right-click menus |
| **Slack** | Workspace switcher pattern, notification preferences granularity, thread-based discussions, quick reactions |
| **Doodle/When2Meet** | Availability polling simplicity -- one-tap responses |
| **Strava** | Social sports feed, activity-based social features, clean mobile experience |
| **Apple Calendar** | Date picker, event creation flow, color-coded calendars |

---

## References & Research Sources

- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Design Trend in SaaS](https://blog.logrocket.com/ux-design/linear-design/)
- [UI Design Trends 2026 - Raw Studio](https://raw.studio/blog/ui-and-ux-design-trends-for-2026-what-founders-and-designers-need-to-know/)
- [Web Design Trends 2026 - Figma](https://www.figma.com/resource-library/web-design-trends/)
- [Command Palette UI Design - Mobbin](https://mobbin.com/glossary/command-palette)
- [Command Palette UX Patterns - Alicja Suska](https://bootcamp.uxdesign.cc/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Dark Mode Design Guide 2026 - Digital Silk](https://www.digitalsilk.com/digital-trends/dark-mode-design-guide/)
- [Dark Glassmorphism UI 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Glassmorphism UI Trend 2026](https://www.designstudiouiux.com/blog/what-is-glassmorphism-ui-trend/)
- [Modern App Colors 2026](https://webosmotic.com/blog/modern-app-colors/)
- [PWA UX Tips 2025 - Lollypop Design](https://lollypop.design/blog/2025/september/progressive-web-app-ux-tips-2025/)
- [Bottom Navigation Guide - AppMySite](https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/)
- [Mobile App Design Patterns - ProCreator](https://procreator.design/blog/mobile-app-design-patterns-boost-retention/)
- [SaaS Onboarding Best Practices 2025](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples)
- [Sailboat Racing Crew Positions - Life of Sailing](https://www.lifeofsailing.com/post/positions-on-a-racing-sailboat)
- [Racing Crew Management Software - Sailing Anarchy Forums](https://forums.sailinganarchy.com/threads/racing-crew-management-software.210599/)
- [Crew Management Software Compared - Practical Sailor](https://www.practical-sailor.com/marine-electronics/crew-management-software-compared)
- [Real-Time Notification Services 2026 - Knock](https://knock.app/blog/the-top-real-time-notification-services-for-building-in-app-notifications)
- [Notion UI Patterns - Dashibase](https://dashibase.com/blog/notion-ui/)
- [Linear Keyboard Shortcuts](https://shortcuts.design/tools/toolspage-linear/)
- [Linear Features: Level Up](https://linear.app/features/level-up)
