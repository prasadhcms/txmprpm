/*
  # Fix Announcements Table - Add Missing is_priority Column

  1. Problem
    - The announcements table has 'is_urgent' column but the code expects 'is_priority'
    - This was changed in the divine_manor migration
    - The TypeScript types expect 'is_priority' to exist

  2. Solution
    - Add the is_priority column to the announcements table
    - Copy values from is_urgent to is_priority if is_urgent exists
    - Drop is_urgent column if it exists
    - Add expires_at column if it doesn't exist (from divine_manor migration)

  3. Security
    - Maintain existing RLS policies
*/

-- Add the missing is_priority column if it doesn't exist
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;

-- If is_urgent column exists, copy its values to is_priority and then drop it
DO $$
BEGIN
    -- Check if is_urgent column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'announcements' AND column_name = 'is_urgent') THEN
        -- Copy values from is_urgent to is_priority
        UPDATE announcements SET is_priority = is_urgent WHERE is_urgent IS NOT NULL;
        
        -- Drop the is_urgent column
        ALTER TABLE announcements DROP COLUMN is_urgent;
    END IF;
END $$;

-- Add expires_at column if it doesn't exist (from divine_manor migration)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Ensure is_priority has the correct default
ALTER TABLE announcements ALTER COLUMN is_priority SET DEFAULT false;