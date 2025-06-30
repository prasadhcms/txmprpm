/*
  # Fix Tasks Table - Add Missing Department Column

  1. Problem
    - The tasks table is missing the 'department' column
    - This was accidentally removed in the divine_manor migration
    - The TypeScript types expect this column to exist

  2. Solution
    - Add the department column to the tasks table
    - Make it NOT NULL with a default value for existing records
    - Update any existing tasks to have a department value

  3. Security
    - Update RLS policies if needed to account for department filtering
*/

-- Add the missing department column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department text;

-- Set a default department for any existing tasks that don't have one
UPDATE tasks 
SET department = 'General' 
WHERE department IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE tasks ALTER COLUMN department SET NOT NULL;

-- Create index for better performance on department queries
CREATE INDEX IF NOT EXISTS tasks_department_idx ON tasks(department);