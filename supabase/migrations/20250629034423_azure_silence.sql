/*
  # Fix Profile Creation Policy

  1. Security Fix
    - Add missing INSERT policy for profiles table
    - Allow authenticated users to create their own profile during registration
    - This resolves the "new row violates row-level security policy" error

  2. Changes
    - Add INSERT policy that checks auth.uid() = id
    - This allows users to create their own profile record when signing up
*/

-- Add the missing INSERT policy for profile creation
CREATE POLICY "Allow authenticated users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);