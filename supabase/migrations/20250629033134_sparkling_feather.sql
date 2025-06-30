/*
  # Create leave requests table

  1. New Tables
    - `leave_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles)
      - `leave_type` (enum: sick, vacation, personal, emergency)
      - `start_date` (date)
      - `end_date` (date)
      - `days_count` (integer)
      - `reason` (text)
      - `status` (enum: pending, approved, rejected)
      - `manager_id` (uuid, optional, references profiles)
      - `manager_comments` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leave_requests` table
    - Add policies for employees to manage their own requests
    - Add policies for managers to approve/reject requests
*/

-- Create custom types
CREATE TYPE leave_type AS ENUM ('sick', 'vacation', 'personal', 'emergency');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count integer NOT NULL,
  reason text NOT NULL,
  status leave_status DEFAULT 'pending',
  manager_id uuid REFERENCES profiles(id),
  manager_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can view their own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can create their own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their pending requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending');

CREATE POLICY "Managers can view department leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = leave_requests.employee_id
      AND p1.role IN ('manager', 'super_admin')
      AND (p1.role = 'super_admin' OR p1.department = p2.department)
    )
  );

CREATE POLICY "Managers can update leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = leave_requests.employee_id
      AND p1.role IN ('manager', 'super_admin')
      AND (p1.role = 'super_admin' OR p1.department = p2.department)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS leave_requests_employee_id_idx ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests(status);
CREATE INDEX IF NOT EXISTS leave_requests_start_date_idx ON leave_requests(start_date);

-- Create updated_at trigger
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();