/*
  # Fix Profiles INSERT Policy for Registration

  1. Problem
    - Users getting "new row violates row-level security policy" when registering
    - The INSERT policy may not be working correctly or there are conflicts

  2. Solution
    - Drop all existing policies and recreate them properly
    - Ensure the INSERT policy allows users to create their own profile
    - Add proper SELECT policy for profile creation verification

  3. Security
    - Users can only insert their own profile (auth.uid() = id)
    - Users can read active profiles
    - Users can update their own profile
    - Super admins can manage all profiles
*/

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Recreate policies with proper permissions
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "profiles_insert_policy"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_super_admin_policy"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;