/*
  # Create announcements table

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `author_id` (uuid, references profiles)
      - `department` (text, optional - null means company-wide)
      - `attachment_url` (text, optional)
      - `is_priority` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `announcements` table
    - Add policies for all users to read announcements
    - Add policies for super_admins to create/manage announcements
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department text,
  attachment_url text,
  is_priority boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read relevant announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    department IS NULL OR 
    department = (SELECT department FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS announcements_department_idx ON announcements(department);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_is_priority_idx ON announcements(is_priority);

-- Create updated_at trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();