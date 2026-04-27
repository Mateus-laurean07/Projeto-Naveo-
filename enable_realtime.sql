-- Enable Realtime for profiles and subscriptions
BEGIN;

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Also ensure RLS is not blocking realtime (it shouldn't if policies are correct, but good to check)
-- The existing policies seem to allow authenticated users to see profiles and their own subscriptions.
-- For AdminPanel, the Super Admin has policy to see everything.

COMMIT;
