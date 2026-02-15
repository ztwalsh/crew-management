create type public.event_type as enum ('race', 'practice', 'social', 'maintenance', 'other');

create table public.events (
  id uuid default gen_random_uuid() primary key,
  boat_id uuid references public.boats(id) on delete cascade not null,
  title text not null,
  description text,
  event_type public.event_type default 'race' not null,
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean default false not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.events enable row level security;

create policy "Crew can view their boat events"
  on public.events for select
  using (
    boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and is_active = true
    )
  );

create policy "Owners and admins can create events"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

create policy "Owners and admins can update events"
  on public.events for update
  using (
    boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

create policy "Owners and admins can delete events"
  on public.events for delete
  using (
    boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );
