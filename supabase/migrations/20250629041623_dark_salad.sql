/*
  # Fix Profile Registration RLS Policy

  1. Problem
    - Users getting "new row violates row-level security policy" when registering
    - The current policies are preventing profile creation during registration

  2. Solution
    - Drop all existing policies on profiles table
    - Create a simple, non-recursive INSERT policy that allows users to create their own profile
    - Ensure other policies don't interfere with registration

  3. Security
    - Users can only insert their own profile (auth.uid() = id)
    - Users can read active profiles
    - Users can update their own profile
    - Super admins can manage all profiles (but this won't interfere with registration)
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_active" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_delete" ON profiles;

-- Create simple, working policies
-- Allow users to read all active profiles
CREATE POLICY "allow_read_active_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow users to insert their own profile (critical for registration)
CREATE POLICY "allow_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "allow_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow super admins to do everything (but won't interfere with registration)
CREATE POLICY "allow_super_admin_all"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Either it's the user's own profile OR they are a super admin
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  )
  WITH CHECK (
    -- Either it's the user's own profile OR they are a super admin
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;