# Database Setup Instructions

Your Employee Management System requires database tables to be created in Supabase. Since the Supabase CLI is not available in this environment, you'll need to apply the migrations manually.

## Steps to Fix the Registration Error:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration SQL**
   Copy and paste the following SQL code into the editor and click "Run":

```sql
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

CREATE POLICY "Allow authenticated users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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
```

4. **Verify the Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see the `profiles` table listed
   - Click on it to verify the columns are created correctly

5. **Test Registration**
   - Return to your application
   - Try registering a new super admin account
   - The registration should now work without errors

## What This Migration Creates:

- **profiles table**: Stores employee information including role, department, job title, etc.
- **Row Level Security (RLS)**: Ensures users can only access appropriate data
- **Policies**: Define who can read/write profile data
- **Indexes**: Improve query performance
- **Triggers**: Automatically update the `updated_at` timestamp

After running this SQL, your registration form should work correctly and create user profiles in the database.