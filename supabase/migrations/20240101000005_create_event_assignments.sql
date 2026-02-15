create type public.rsvp_status as enum ('pending', 'accepted', 'declined', 'tentative');

create table public.event_assignments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rsvp_status public.rsvp_status default 'pending' not null,
  sailing_position public.sailing_position,
  notes text,
  responded_at timestamptz,
  created_at timestamptz default now() not null,
  unique(event_id, user_id)
);

alter table public.event_assignments enable row level security;

-- Crew can view assignments for events on their boats
create policy "Crew can view event assignments"
  on public.event_assignments for select
  using (
    event_id in (
      select e.id from public.events e
      join public.crew_memberships cm on cm.boat_id = e.boat_id
      where cm.user_id = auth.uid() and cm.is_active = true
    )
  );

-- Owners/admins can create assignments
create policy "Owners and admins can create assignments"
  on public.event_assignments for insert
  with check (
    event_id in (
      select e.id from public.events e
      join public.crew_memberships cm on cm.boat_id = e.boat_id
      where cm.user_id = auth.uid() and cm.role in ('owner', 'admin') and cm.is_active = true
    )
  );

-- Users can update their own RSVP
create policy "Users can update own RSVP"
  on public.event_assignments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Owners/admins can also update assignments
create policy "Owners and admins can update assignments"
  on public.event_assignments for update
  using (
    event_id in (
      select e.id from public.events e
      join public.crew_memberships cm on cm.boat_id = e.boat_id
      where cm.user_id = auth.uid() and cm.role in ('owner', 'admin') and cm.is_active = true
    )
  );

-- Owners/admins can delete assignments
create policy "Owners and admins can delete assignments"
  on public.event_assignments for delete
  using (
    event_id in (
      select e.id from public.events e
      join public.crew_memberships cm on cm.boat_id = e.boat_id
      where cm.user_id = auth.uid() and cm.role in ('owner', 'admin') and cm.is_active = true
    )
  );
