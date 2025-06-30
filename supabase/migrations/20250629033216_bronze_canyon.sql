/*
  # Insert demo data for testing

  1. Demo Users
    - Super Admin: admin@company.com
    - Manager: manager@company.com  
    - Employee: employee@company.com

  2. Sample Data
    - Profiles for different roles and departments
    - Sample leave requests
    - Sample announcements
    - Sample tasks

  Note: This assumes the auth.users already exist with these emails
*/

-- Insert demo profiles (these will be created when users sign up)
-- The auth.users entries need to be created through Supabase Auth first

-- Insert sample announcements
INSERT INTO announcements (title, content, author_id, department, is_priority) VALUES
('Welcome to the Employee Management System', 'We are excited to launch our new employee management platform. This system will help streamline our HR processes and improve communication across all departments.', 
 (SELECT id FROM profiles WHERE email = 'admin@company.com' LIMIT 1), NULL, true),
('IT Department Security Update', 'Please ensure all your devices are updated with the latest security patches. Contact IT support if you need assistance.', 
 (SELECT id FROM profiles WHERE email = 'admin@company.com' LIMIT 1), 'IT', false),
('Holiday Schedule 2024', 'Please find attached the official holiday schedule for 2024. Plan your leave requests accordingly.', 
 (SELECT id FROM profiles WHERE email = 'admin@company.com' LIMIT 1), NULL, false);

-- Note: Additional sample data will be inserted after user profiles are created through authentication