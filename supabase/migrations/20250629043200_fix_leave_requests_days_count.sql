/*
  # Fix Leave Requests Table - Add Missing days_count Column

  1. Problem
    - The leave_requests table has 'days_requested' column but the code expects 'days_count'
    - This was changed in the divine_manor migration
    - The TypeScript types expect 'days_count' to exist

  2. Solution
    - Add the days_count column to the leave_requests table
    - Copy values from days_requested to days_count if days_requested exists
    - Drop days_requested column if it exists

  3. Security
    - Maintain existing RLS policies
*/

-- Add the missing days_count column if it doesn't exist
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_count integer;

-- If days_requested column exists, copy its values to days_count and then drop it
DO $$
BEGIN
    -- Check if days_requested column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'days_requested') THEN
        -- Copy values from days_requested to days_count
        UPDATE leave_requests SET days_count = days_requested WHERE days_requested IS NOT NULL;
        
        -- Drop the days_requested column
        ALTER TABLE leave_requests DROP COLUMN days_requested;
    END IF;
END $$;

-- Set a default value for any existing records that don't have days_count
UPDATE leave_requests 
SET days_count = 1 
WHERE days_count IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE leave_requests ALTER COLUMN days_count SET NOT NULL;