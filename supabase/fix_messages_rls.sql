-- Quick fix for messages RLS policies
-- Run this directly in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read messages for their fives" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their fives" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Create new policies that allow both participants and creators
CREATE POLICY "Users can read messages for their fives" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM five_participants
      WHERE five_participants.five_id = messages.five_id
      AND five_participants.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM fives
      WHERE fives.id = messages.five_id
      AND fives.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their fives" ON messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM five_participants
        WHERE five_participants.five_id = messages.five_id
        AND five_participants.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM fives
        WHERE fives.id = messages.five_id
        AND fives.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE
  USING (user_id = auth.uid());
