/*
  # Create profiles table for employee management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (enum: employee, manager, super_admin)
      - `department` (text)
      - `job_title` (text)
      - `joining_date` (date)
      - `phone` (text, optional)
      - `location` (text)
      - `reporting_to` (uuid, optional, references profiles)
      - `profile_picture` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to read profiles
    - Add policies for users to update their own profile
    - Add policies for managers and super_admins to manage profiles
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'super_admin');

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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all active profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_department_idx ON profiles(department);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(location);
CREATE INDEX IF NOT EXISTS profiles_reporting_to_idx ON profiles(reporting_to);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();