/**
 * Optimized data service with batching, caching, and parallel queries
 * Reduces database load and improves performance significantly
 */

import { supabase } from './supabase'
import { dataCache } from './cache'

export interface DashboardStats {
  totalEmployees: number
  pendingLeaves: number
  activeTasks: number
  recentAnnouncements: number
  leavesByDepartment: Array<{ name: string; value: number }>
  tasksByStatus: Array<{ name: string; value: number; color: string }>
  myTasks: number
  myPendingLeaves: number
  teamSize: number
  upcomingDeadlines: number
}

export interface RecentActivity {
  id: string
  type: 'task' | 'leave' | 'announcement' | 'project'
  title: string
  description: string
  timestamp: string
  status?: string
  priority?: string
}

class DataService {
  
  /**
   * Fetch dashboard stats with parallel queries and caching
   */
  async getDashboardStats(userId: string, userRole: string, userDepartment: string): Promise<DashboardStats> {
    // Check cache first
    const cached = dataCache.getDashboardStats(userId)
    if (cached) {
      return cached
    }

    try {
      // Execute all queries in parallel for better performance
      const [
        employeesResult,
        pendingLeavesResult,
        activeTasksResult,
        announcementsResult,
        leavesByDeptResult,
        tasksByStatusResult,
        myTasksResult,
        myLeavesResult,
        teamSizeResult,
        deadlinesResult
      ] = await Promise.all([
        // Global stats
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        
        // Data for charts
        supabase.from('leave_requests').select('id, profiles!leave_requests_employee_id_fkey(department)').eq('status', 'approved'),
        supabase.from('tasks').select('status'),
        
        // Personal stats
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).in('status', ['pending', 'in_progress']),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('employee_id', userId).eq('status', 'pending'),
        
        // Team stats (if manager)
        userRole === 'manager' || userRole === 'super_admin' 
          ? supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('department', userDepartment).eq('is_active', true)
          : Promise.resolve({ count: 0 }),
          
        // Upcoming deadlines
        this.getUpcomingDeadlines(userId)
      ])

      // Process leaves by department
      const leavesByDepartment = this.processLeavesByDepartment(leavesByDeptResult.data || [])
      
      // Process tasks by status
      const tasksByStatus = this.processTasksByStatus(tasksByStatusResult.data || [])

      const stats: DashboardStats = {
        totalEmployees: employeesResult.count || 0,
        pendingLeaves: pendingLeavesResult.count || 0,
        activeTasks: activeTasksResult.count || 0,
        recentAnnouncements: announcementsResult.count || 0,
        leavesByDepartment,
        tasksByStatus,
        myTasks: myTasksResult.count || 0,
        myPendingLeaves: myLeavesResult.count || 0,
        teamSize: teamSizeResult.count || 0,
        upcomingDeadlines: deadlinesResult
      }

      // Cache the results
      dataCache.setDashboardStats(userId, stats)
      
      return stats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get upcoming deadlines efficiently
   */
  private async getUpcomingDeadlines(userId: string): Promise<number> {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'in_progress'])

    return count || 0
  }

  /**
   * Process leaves by department data
   */
  private processLeavesByDepartment(data: any[]): Array<{ name: string; value: number }> {
    return data.reduce((acc: any[], curr: any) => {
      const dept = curr.profiles?.department
      if (dept) {
        const existing = acc.find(item => item.name === dept)
        if (existing) {
          existing.value++
        } else {
          acc.push({ name: dept, value: 1 })
        }
      }
      return acc
    }, [])
  }

  /**
   * Process tasks by status data
   */
  private processTasksByStatus(data: any[]): Array<{ name: string; value: number; color: string }> {
    return [
      { 
        name: 'Pending', 
        value: data.filter(t => t.status === 'pending').length,
        color: '#f59e0b'
      },
      { 
        name: 'In Progress', 
        value: data.filter(t => t.status === 'in_progress').length,
        color: '#3b82f6'
      },
      { 
        name: 'Completed', 
        value: data.filter(t => t.status === 'completed').length,
        color: '#10b981'
      }
    ]
  }

  /**
   * Fetch recent activity with optimized queries
   */
  async getRecentActivity(userId: string): Promise<RecentActivity[]> {
    try {
      // Fetch recent activities in parallel
      const [tasksResult, leavesResult, announcementsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, description, created_at, status, priority')
          .eq('assigned_to', userId)
          .order('created_at', { ascending: false })
          .limit(3),
          
        supabase
          .from('leave_requests')
          .select('id, leave_type, start_date, end_date, created_at, status')
          .eq('employee_id', userId)
          .order('created_at', { ascending: false })
          .limit(2),
          
        supabase
          .from('announcements')
          .select('id, title, content, created_at, priority')
          .order('created_at', { ascending: false })
          .limit(2)
      ])

      const activities: RecentActivity[] = []

      // Process tasks
      tasksResult.data?.forEach(task => {
        activities.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description || '',
          timestamp: task.created_at,
          status: task.status,
          priority: task.priority
        })
      })

      // Process leaves
      leavesResult.data?.forEach(leave => {
        activities.push({
          id: leave.id,
          type: 'leave',
          title: `${leave.leave_type} Leave Request`,
          description: `${leave.start_date} to ${leave.end_date}`,
          timestamp: leave.created_at,
          status: leave.status
        })
      })

      // Process announcements
      announcementsResult.data?.forEach(announcement => {
        activities.push({
          id: announcement.id,
          type: 'announcement',
          title: announcement.title,
          description: announcement.content?.substring(0, 100) + '...' || '',
          timestamp: announcement.created_at,
          priority: announcement.priority
        })
      })

      // Sort by timestamp and return top 5
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Fetch employees with caching
   */
  async getEmployees(): Promise<any[]> {
    // Check cache first
    const cached = dataCache.getProfiles()
    if (cached) {
      return cached
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error

      // Cache the results
      dataCache.setProfiles(data || [])
      
      return data || []
    } catch (error) {
      console.error('Error fetching employees:', error)
      return []
    }
  }

  /**
   * Fetch tasks with caching and optimized queries
   */
  async getTasks(userId: string, userRole: string): Promise<any[]> {
    // Check cache first
    const cached = dataCache.getTasks(userId)
    if (cached) {
      return cached
    }

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!assigned_to(*),
          assigned_by_profile:profiles!assigned_by(*)
        `)

      // Optimize query based on role
      if (userRole === 'employee') {
        // Employees only see their tasks and tasks they assigned
        query = query.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Cache the results
      dataCache.setTasks(userId, data || [])
      
      return data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  }

  /**
   * Invalidate cache when data changes
   */
  invalidateCache(type: 'user' | 'global', userId?: string) {
    if (type === 'user' && userId) {
      dataCache.invalidateUserData(userId)
    } else if (type === 'global') {
      dataCache.invalidateGlobalData()
    }
  }
}

// Export singleton instance
export const dataService = new DataService()