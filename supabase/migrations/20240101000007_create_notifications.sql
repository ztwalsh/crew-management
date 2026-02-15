create type public.notification_type as enum (
  'invitation_received',
  'invitation_accepted',
  'event_created',
  'event_updated',
  'event_reminder',
  'rsvp_received',
  'todo_assigned',
  'todo_completed'
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb default '{}' not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

-- Users can only view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can update own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- Allow inserts from server (via service role or security definer functions)
create policy "Service can insert notifications"
  on public.notifications for insert
  with check (true);
