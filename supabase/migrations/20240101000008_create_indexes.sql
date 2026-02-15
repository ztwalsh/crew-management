-- Performance indexes
create index idx_crew_memberships_user on public.crew_memberships(user_id) where is_active = true;
create index idx_crew_memberships_boat on public.crew_memberships(boat_id) where is_active = true;
create index idx_events_boat_start on public.events(boat_id, start_time);
create index idx_event_assignments_event on public.event_assignments(event_id);
create index idx_event_assignments_user on public.event_assignments(user_id);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_invitations_email on public.invitations(invited_email) where status = 'pending';
create index idx_invitations_token on public.invitations(token) where status = 'pending';
