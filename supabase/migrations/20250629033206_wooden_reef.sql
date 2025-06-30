/*
  # Create project updates table

  1. New Tables
    - `project_updates`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `work_location` (text)
      - `images` (text array, optional)
      - `status` (enum: draft, submitted, approved)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_updates` table
    - Add policies for employees to manage their own updates
    - Add policies for managers to view and approve updates
*/

-- Create custom types
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'approved');

-- Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  work_location text NOT NULL,
  images text[],
  status project_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can manage their own project updates"
  ON project_updates
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view department project updates"
  ON project_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = project_updates.employee_id
      AND p1.role IN ('manager', 'super_admin')
      AND (p1.role = 'super_admin' OR p1.department = p2.department)
    )
  );

CREATE POLICY "Managers can update project status"
  ON project_updates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = project_updates.employee_id
      AND p1.role IN ('manager', 'super_admin')
      AND (p1.role = 'super_admin' OR p1.department = p2.department)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS project_updates_employee_id_idx ON project_updates(employee_id);
CREATE INDEX IF NOT EXISTS project_updates_status_idx ON project_updates(status);
CREATE INDEX IF NOT EXISTS project_updates_created_at_idx ON project_updates(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_project_updates_updated_at
  BEFORE UPDATE ON project_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();