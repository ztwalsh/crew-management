-- Seed data for local development
-- Note: Users must be created through Supabase Auth, so profiles are created via trigger.
-- This seed assumes you've already signed up at least one user through the UI.

-- If you want to test with pre-existing data, you can run this after creating a user.
-- Replace the UUIDs below with your actual user IDs from auth.users.

-- Example boat (uncomment and replace user_id after signing up):
-- INSERT INTO public.boats (id, name, boat_type, sail_number, home_port, description, created_by)
-- VALUES (
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'Wind Dancer',
--   'J/105',
--   'USA 123',
--   'San Francisco YC',
--   'Our trusty J/105 for Wednesday night racing and weekend regattas.',
--   'YOUR_USER_ID_HERE'
-- );
