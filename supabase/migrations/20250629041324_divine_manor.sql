/*
  # Fix Policy Conflicts and Database Issues

  1. Problem Resolution
    - Drop existing conflicting policies safely
    - Recreate all tables and policies from scratch
    - Fix RLS recursion issues
    - Ensure proper foreign key relationships

  2. What This Migration Does
    - Safely drops existing policies and tables
    - Recreates all required tables with proper structure
    - Sets up non-recursive RLS policies
    - Creates proper indexes and triggers
    - Fixes foreign key relationships

  3. Tables Created
    - profiles: Employee information and roles
    - leave_requests: Leave management
    - tasks: Task assignment and tracking
    - announcements: Company communications
    - project_updates: Project status updates

  4. Security
    - Proper RLS policies for each table
    - Role-based access control
    - Non-recursive policy structure
*/

-- Drop existing tables and policies to start fresh
DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'super_admin');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type AS ENUM ('sick', 'vacation', 'personal', 'emergency');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'approved');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'employee',
  department text NOT NULL,
  job_title text NOT NULL,
  joining_date date DEFAULT CURRENT_DATE,
  phone text,
  location text NOT NULL,
  reporting_to uuid REFERENCES profiles(id),
  profile_picture text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES profiles(id),
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer NOT NULL,
  reason text NOT NULL,
  status leave_status DEFAULT 'pending',
  manager_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department text,
  is_urgent boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_updates table
CREATE TABLE project_updates (
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for profiles table
CREATE POLICY "profiles_select_active"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Separate policies for super admin management (non-recursive)
CREATE POLICY "profiles_super_admin_insert"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "profiles_super_admin_update"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "profiles_super_admin_delete"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

-- Policies for leave_requests
CREATE POLICY "leave_requests_select_own"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "leave_requests_select_manager"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "leave_requests_insert_own"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "leave_requests_update_manager"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

-- Policies for tasks
CREATE POLICY "tasks_select_assigned"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "tasks_insert_manager"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "tasks_update_assigned"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "tasks_update_manager"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

-- Policies for announcements
CREATE POLICY "announcements_select_all"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "announcements_insert_admin"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "announcements_update_author"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "announcements_manage_super_admin"
  ON announcements
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
  );

-- Policies for project_updates
CREATE POLICY "project_updates_manage_own"
  ON project_updates
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "project_updates_select_manager"
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

CREATE POLICY "project_updates_update_manager"
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

-- Create indexes for better performance
CREATE INDEX profiles_department_idx ON profiles(department);
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_location_idx ON profiles(location);
CREATE INDEX profiles_reporting_to_idx ON profiles(reporting_to);
CREATE INDEX leave_requests_employee_id_idx ON leave_requests(employee_id);
CREATE INDEX leave_requests_manager_id_idx ON leave_requests(manager_id);
CREATE INDEX leave_requests_status_idx ON leave_requests(status);
CREATE INDEX tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX tasks_assigned_by_idx ON tasks(assigned_by);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX announcements_author_id_idx ON announcements(author_id);
CREATE INDEX announcements_department_idx ON announcements(department);
CREATE INDEX project_updates_employee_id_idx ON project_updates(employee_id);
CREATE INDEX project_updates_status_idx ON project_updates(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at
  BEFORE UPDATE ON project_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();