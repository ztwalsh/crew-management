-- Create enums
create type public.crew_role as enum ('owner', 'admin', 'crew');
create type public.sailing_position as enum (
  'skipper', 'helmsman', 'tactician', 'trimmer', 'bowman',
  'pit', 'grinder', 'navigator', 'crew'
);

create table public.crew_memberships (
  id uuid default gen_random_uuid() primary key,
  boat_id uuid references public.boats(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role public.crew_role default 'crew' not null,
  sailing_position public.sailing_position,
  joined_at timestamptz default now() not null,
  is_active boolean default true not null,
  unique(boat_id, user_id)
);

alter table public.crew_memberships enable row level security;

-- Helper functions (SECURITY DEFINER) to avoid infinite recursion in RLS policies
-- that need to query crew_memberships from within crew_memberships policies.
create or replace function public.get_user_boat_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select boat_id
  from public.crew_memberships
  where user_id = auth.uid() and is_active = true;
$$;

create or replace function public.get_user_admin_boat_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select boat_id
  from public.crew_memberships
  where user_id = auth.uid()
    and role in ('owner', 'admin')
    and is_active = true;
$$;

-- Crew can view memberships for their boats
create policy "Crew can view boat memberships"
  on public.crew_memberships for select
  using (boat_id in (select public.get_user_boat_ids()));

-- Owners/admins can add crew, or user can create their own membership (invitation acceptance)
create policy "System can insert memberships"
  on public.crew_memberships for insert
  with check (
    boat_id in (select public.get_user_admin_boat_ids())
    or user_id = auth.uid()
  );

-- Owners/admins can update memberships
create policy "Owners and admins can update memberships"
  on public.crew_memberships for update
  using (boat_id in (select public.get_user_admin_boat_ids()));

-- Owners/admins can remove crew, members can leave
create policy "Owners and admins can delete memberships"
  on public.crew_memberships for delete
  using (
    user_id = auth.uid()
    or boat_id in (select public.get_user_admin_boat_ids())
  );

-- Auto-create owner membership when a boat is created
create or replace function public.handle_new_boat()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.crew_memberships (boat_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_boat_created
  after insert on public.boats
  for each row execute procedure public.handle_new_boat();

-- Deferred from migration 1: profiles co-crew visibility policy
create policy "Users can view co-crew profiles"
  on public.profiles for select
  using (
    id in (
      select cm2.user_id
      from public.crew_memberships cm1
      join public.crew_memberships cm2 on cm1.boat_id = cm2.boat_id
      where cm1.user_id = auth.uid()
        and cm1.is_active = true
        and cm2.is_active = true
    )
  );
