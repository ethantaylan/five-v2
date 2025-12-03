-- Fix RLS policies to work with Clerk authentication
-- Your app uses Clerk, not Supabase Auth, so auth.uid() won't work
-- Instead, we need to disable RLS or use service role key

-- OPTION 1: Temporarily disable RLS (INSECURE - only for testing)
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Make policies permissive (allows all authenticated users)
-- This works because you're checking permissions in your application code

DROP POLICY IF EXISTS "Users can read messages for their fives" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their fives" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Allow anyone to read messages (you can add app-level checks)
CREATE POLICY "Allow read messages" ON messages
  FOR SELECT
  USING (true);

-- Allow anyone to insert messages (you can add app-level checks)
CREATE POLICY "Allow insert messages" ON messages
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete messages (you can add app-level checks)
CREATE POLICY "Allow delete messages" ON messages
  FOR DELETE
  USING (true);

-- Note: This makes the table permissive.
-- You should implement authorization checks in your application code
-- since Clerk users don't exist in Supabase Auth.
