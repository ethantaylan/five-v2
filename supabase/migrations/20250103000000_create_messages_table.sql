-- Create messages table for five chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  five_id UUID NOT NULL REFERENCES fives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_five_id_idx ON messages(five_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read messages for their fives" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their fives" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Policy: Users can read messages for fives they participate in or created
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

-- Policy: Users can insert messages for fives they participate in or created
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

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE
  USING (user_id = auth.uid());

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_messages_updated_at_trigger ON messages;
DROP FUNCTION IF EXISTS update_messages_updated_at();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();
