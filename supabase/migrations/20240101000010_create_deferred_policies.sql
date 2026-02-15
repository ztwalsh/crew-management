-- Deferred RLS policies that depend on crew_memberships table
-- These were moved from migrations 1 and 2 since crew_memberships didn't exist yet.
-- Uses helper functions defined in migration 000003 to avoid recursion.

-- Boats: crew members can view their boats (also allow creator to see their own boat)
create policy "Crew can view their boats"
  on public.boats for select
  using (
    id in (select public.get_user_boat_ids())
    or created_by = auth.uid()
  );

-- Boats: owners/admins can update boats
create policy "Owners and admins can update boats"
  on public.boats for update
  using (
    id in (select public.get_user_admin_boat_ids())
  );

-- Boats: owners can delete boats
create policy "Owners can delete boats"
  on public.boats for delete
  using (
    id in (select public.get_user_admin_boat_ids())
  );
