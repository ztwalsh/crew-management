create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'expired');

create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  boat_id uuid references public.boats(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) not null,
  invited_email text not null,
  role public.crew_role default 'crew' not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  status public.invitation_status default 'pending' not null,
  expires_at timestamptz default (now() + interval '7 days') not null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  unique(boat_id, invited_email)
);

alter table public.invitations enable row level security;

-- Owners/admins can view invitations for their boats
create policy "Owners and admins can view invitations"
  on public.invitations for select
  using (
    boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Anyone can view invitation by token (for acceptance)
create policy "Anyone can view invitation by token"
  on public.invitations for select
  using (true);

-- Owners/admins can create invitations
create policy "Owners and admins can create invitations"
  on public.invitations for insert
  with check (
    auth.uid() = invited_by
    and boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Owners/admins can update invitations (revoke)
create policy "Owners and admins can update invitations"
  on public.invitations for update
  using (
    boat_id in (
      select boat_id from public.crew_memberships
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Allow authenticated users to update invitation status (for acceptance)
create policy "Users can accept invitations"
  on public.invitations for update
  using (true)
  with check (true);
