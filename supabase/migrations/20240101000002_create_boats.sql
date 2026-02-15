create table public.boats (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  boat_type text,
  sail_number text,
  home_port text,
  photo_url text,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.boats enable row level security;

-- Only authenticated users can create boats
create policy "Authenticated users can create boats"
  on public.boats for insert
  with check (auth.uid() = created_by);

-- Note: Select, update, and delete policies that depend on crew_memberships
-- are added in migration 20240101000003b after crew_memberships table exists.
