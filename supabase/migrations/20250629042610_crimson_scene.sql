/*
  # Fix RLS Policy for Profile Registration

  1. Problem
    - The "allow_super_admin_all" policy creates a circular dependency
    - When registering, it tries to check if user is super admin but profile doesn't exist yet
    - This causes "new row violates row-level security policy" error

  2. Solution
    - Remove the problematic policy that causes circular dependency
    - Create separate, simple policies that don't reference the same table
    - Allow all authenticated users to insert their own profile
    - Keep other policies simple and non-recursive

  3. Security
    - Users can only insert/update their own profile (auth.uid() = id)
    - Users can read all active profiles
    - Super admin management will be handled separately after profile exists
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "allow_read_active_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_super_admin_all" ON profiles;

-- Create simple, non-recursive policies

-- 1. Allow reading active profiles
CREATE POLICY "profiles_read_active"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. Allow users to insert their own profile (CRITICAL for registration)
CREATE POLICY "profiles_insert_self"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "profiles_update_self"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow users to delete their own profile (optional)
CREATE POLICY "profiles_delete_self"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Note: Super admin privileges will be handled at the application level
-- rather than through RLS policies to avoid circular dependencies