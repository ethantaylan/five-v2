-- Debug script to check if a user can send messages to a five
-- Replace these values with actual IDs from your database
-- Get these from the browser console or Supabase table browser

-- Example usage:
-- 1. Get the user_id from auth.users table or from your app's console.log
-- 2. Get the five_id from the match you're trying to message
-- 3. Replace the UUIDs below and run this query

DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE';  -- Replace with actual user ID
  test_five_id UUID := 'YOUR_FIVE_ID_HERE';  -- Replace with actual five ID
BEGIN
  RAISE NOTICE 'Checking access for user % to five %', test_user_id, test_five_id;

  -- Check if user is a participant
  IF EXISTS (
    SELECT 1 FROM five_participants
    WHERE five_id = test_five_id
    AND user_id = test_user_id
  ) THEN
    RAISE NOTICE '✓ User IS a participant';
  ELSE
    RAISE NOTICE '✗ User is NOT a participant';
  END IF;

  -- Check if user is the creator
  IF EXISTS (
    SELECT 1 FROM fives
    WHERE id = test_five_id
    AND created_by = test_user_id
  ) THEN
    RAISE NOTICE '✓ User IS the creator';
  ELSE
    RAISE NOTICE '✗ User is NOT the creator';
  END IF;

  -- Show the creator of the five
  RAISE NOTICE 'Five creator: %', (SELECT created_by FROM fives WHERE id = test_five_id);

  -- Show all participants
  RAISE NOTICE 'Participants: %', (
    SELECT string_agg(user_id::text, ', ')
    FROM five_participants
    WHERE five_id = test_five_id
  );
END $$;
