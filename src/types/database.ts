export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'employee' | 'manager' | 'super_admin'
          department: string
          job_title: string
          joining_date: string
          phone: string | null
          location: string
          reporting_to: string | null
          profile_picture: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'employee' | 'manager' | 'super_admin'
          department: string
          job_title: string
          joining_date: string
          phone?: string | null
          location: string
          reporting_to?: string | null
          profile_picture?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'employee' | 'manager' | 'super_admin'
          department?: string
          job_title?: string
          joining_date?: string
          phone?: string | null
          location?: string
          reporting_to?: string | null
          profile_picture?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: 'sick' | 'vacation' | 'personal' | 'emergency'
          start_date: string
          end_date: string
          days_count: number
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          manager_id: string | null
          manager_comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: 'sick' | 'vacation' | 'personal' | 'emergency'
          start_date: string
          end_date: string
          days_count: number
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          manager_id?: string | null
          manager_comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: 'sick' | 'vacation' | 'personal' | 'emergency'
          start_date?: string
          end_date?: string
          days_count?: number
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          manager_id?: string | null
          manager_comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          department: string | null
          attachment_url: string | null
          is_priority: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          department?: string | null
          attachment_url?: string | null
          is_priority?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          department?: string | null
          attachment_url?: string | null
          is_priority?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          assigned_to: string
          assigned_by: string
          due_date: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed'
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          assigned_to: string
          assigned_by: string
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          department: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          assigned_to?: string
          assigned_by?: string
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_updates: {
        Row: {
          id: string
          employee_id: string
          title: string
          description: string
          work_location: string
          images: string[] | null
          status: 'draft' | 'submitted' | 'approved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          title: string
          description: string
          work_location: string
          images?: string[] | null
          status?: 'draft' | 'submitted' | 'approved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          title?: string
          description?: string
          work_location?: string
          images?: string[] | null
          status?: 'draft' | 'submitted' | 'approved'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}