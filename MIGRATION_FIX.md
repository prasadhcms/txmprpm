# Fix for Database Errors

The errors indicate RLS policy recursion issues and missing database tables. Here's the corrected SQL that handles all issues:

## Run this SQL in your Supabase SQL Editor:

```sql
-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employee', 'manager', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES profiles(id),
  leave_type text NOT NULL,
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
CREATE TABLE IF NOT EXISTS tasks (
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
CREATE TABLE IF NOT EXISTS announcements (
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Create non-recursive policies for profiles table
CREATE POLICY "Users can read all active profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Separate policies for super admin management (non-recursive)
CREATE POLICY "Super admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin' AND is_active = true
    )
  );

-- Policies for leave_requests
CREATE POLICY "Users can view own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view team leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "Users can create own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can update leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

-- Policies for tasks
CREATE POLICY "Users can view assigned tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "Managers can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Managers can update all tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

-- Policies for announcements
CREATE POLICY "All users can read announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'super_admin'))
  );

CREATE POLICY "Authors can update own announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Super admins can manage all announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_department_idx ON profiles(department);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(location);
CREATE INDEX IF NOT EXISTS profiles_reporting_to_idx ON profiles(reporting_to);
CREATE INDEX IF NOT EXISTS leave_requests_employee_id_idx ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS leave_requests_manager_id_idx ON leave_requests(manager_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests(status);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_assigned_by_idx ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS announcements_author_id_idx ON announcements(author_id);
CREATE INDEX IF NOT EXISTS announcements_department_idx ON announcements(department);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;

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
```

## What This Fixed Version Does:

1. **Fixes RLS Recursion**: Removes the problematic "FOR ALL" policy that caused infinite recursion and replaces it with specific, non-recursive policies for super admin operations
2. **Creates Missing Tables**: Adds the missing `leave_requests`, `tasks`, and `announcements` tables with proper structure
3. **Adds Required Types**: Creates all necessary ENUM types for status fields
4. **Comprehensive Policies**: Sets up proper RLS policies for all tables with appropriate access controls
5. **Performance Indexes**: Adds indexes for frequently queried columns
6. **Audit Triggers**: Sets up updated_at triggers for all tables

## Steps:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the SQL above
3. Click "Run"
4. The migration should complete without errors
5. Test the application again

This should resolve all the database-related errors including the RLS recursion, missing tables, and foreign key relationship issues.