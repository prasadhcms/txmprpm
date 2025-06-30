/*
  # Fix Remaining Schema Discrepancies

  1. Problem
    - divine_manor migration created tables with different schemas than TypeScript expects
    - Missing columns and nullability mismatches

  2. Solution
    - Add missing attachment_url column to announcements
    - Fix tasks.description to be NOT NULL
    - Ensure all schemas match TypeScript definitions

  3. Changes
    - announcements: Add attachment_url column
    - tasks: Make description NOT NULL (set default for existing records)
*/

-- Fix announcements table: Add missing attachment_url column
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_url text;

-- Fix tasks table: Make description NOT NULL
-- First, set a default value for any existing NULL descriptions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        UPDATE tasks 
        SET description = 'No description provided' 
        WHERE description IS NULL;
    END IF;
END $$;

-- Then make the column NOT NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER TABLE tasks ALTER COLUMN description SET NOT NULL;
    END IF;
END $$;

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS announcements_attachment_url_idx ON announcements(attachment_url) WHERE attachment_url IS NOT NULL;