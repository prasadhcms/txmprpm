/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `assigned_to` (uuid, references profiles)
      - `assigned_by` (uuid, references profiles)
      - `due_date` (date, optional)
      - `priority` (enum: low, medium, high)
      - `status` (enum: pending, in_progress, completed)
      - `department` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for users to view their assigned tasks
    - Add policies for managers to assign and manage tasks
*/

-- Create custom types
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  assigned_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date date,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  department text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their assigned tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can view tasks they assigned"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (assigned_by = auth.uid());

CREATE POLICY "Users can update their assigned tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Managers can view department tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'super_admin')
      AND (role = 'super_admin' OR department = tasks.department)
    )
  );

CREATE POLICY "Managers can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "Managers can update department tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('manager', 'super_admin')
      AND (role = 'super_admin' OR department = tasks.department)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_assigned_by_idx ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_department_idx ON tasks(department);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);

-- Create updated_at trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();