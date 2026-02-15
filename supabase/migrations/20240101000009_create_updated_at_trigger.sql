-- Reusable updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at before update on public.boats
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at before update on public.events
  for each row execute procedure public.handle_updated_at();

-- Enable realtime for key tables
alter publication supabase_realtime add table public.event_assignments;
alter publication supabase_realtime add table public.notifications;
