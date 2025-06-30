import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckSquare, Megaphone, TrendingUp, Clock, ArrowUpRight, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget'

interface DashboardStats {
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

interface RecentActivity {
  id: string
  type: 'task' | 'leave' | 'announcement' | 'project'
  title: string
  description: string
  timestamp: string
  status?: string
  priority?: string
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    fetchRecentActivity()
  }, [profile])

  const fetchDashboardStats = async () => {
    try {
      // Fetch employees count
      const { count: employeesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch pending leaves
      const { count: pendingLeavesCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch active tasks
      const { count: activeTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])

      // Fetch recent announcements
      const { count: announcementsCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })

      // Fetch leaves by department
      const { data: leavesByDept } = await supabase
        .from('leave_requests')
        .select(`
          id,
          profiles!leave_requests_employee_id_fkey(department)
        `)
        .eq('status', 'approved')

      // Fetch tasks by status
      const { data: tasksByStatus } = await supabase
        .from('tasks')
        .select('status')

      // Process data
      const leavesByDepartment = leavesByDept?.reduce((acc: any[], curr: any) => {
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
      }, []) || []

      const taskStatusData = [
        { 
          name: 'Pending', 
          value: tasksByStatus?.filter(t => t.status === 'pending').length || 0,
          color: '#f59e0b'
        },
        { 
          name: 'In Progress', 
          value: tasksByStatus?.filter(t => t.status === 'in_progress').length || 0,
          color: '#3b82f6'
        },
        { 
          name: 'Completed', 
          value: tasksByStatus?.filter(t => t.status === 'completed').length || 0,
          color: '#10b981'
        }
      ]

      // Fetch personalized data
      let myTasks = 0
      let myPendingLeaves = 0
      let teamSize = 0
      let upcomingDeadlines = 0

      if (profile) {
        // My tasks
        const { count: myTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', profile.id)
          .in('status', ['pending', 'in_progress'])

        myTasks = myTasksCount || 0

        // My pending leaves
        const { count: myLeavesCount } = await supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', profile.id)
          .eq('status', 'pending')

        myPendingLeaves = myLeavesCount || 0

        // Team size (if manager)
        if (profile.role === 'manager' || profile.role === 'super_admin') {
          const { count: teamCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department', profile.department)
            .eq('is_active', true)

          teamSize = teamCount || 0
        }

        // Upcoming deadlines (tasks due in next 7 days)
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        
        const { count: deadlinesCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', profile.id)
          .lte('due_date', nextWeek.toISOString().split('T')[0])
          .in('status', ['pending', 'in_progress'])

        upcomingDeadlines = deadlinesCount || 0
      }

      setStats({
        totalEmployees: employeesCount || 0,
        pendingLeaves: pendingLeavesCount || 0,
        activeTasks: activeTasksCount || 0,
        recentAnnouncements: announcementsCount || 0,
        leavesByDepartment,
        tasksByStatus: taskStatusData,
        myTasks,
        myPendingLeaves,
        teamSize,
        upcomingDeadlines
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    if (!profile) return

    try {
      const activities: RecentActivity[] = []

      // Recent tasks assigned to user
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, description, created_at, status, priority')
        .eq('assigned_to', profile.id)
        .order('created_at', { ascending: false })
        .limit(3)

      recentTasks?.forEach(task => {
        activities.push({
          id: task.id,
          type: 'task',
          title: `Task: ${task.title}`,
          description: task.description,
          timestamp: task.created_at,
          status: task.status,
          priority: task.priority
        })
      })

      // Recent leave requests
      const { data: recentLeaves } = await supabase
        .from('leave_requests')
        .select('id, leave_type, reason, created_at, status')
        .eq('employee_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(2)

      recentLeaves?.forEach(leave => {
        activities.push({
          id: leave.id,
          type: 'leave',
          title: `Leave Request: ${leave.leave_type}`,
          description: leave.reason,
          timestamp: leave.created_at,
          status: leave.status
        })
      })

      // Recent announcements
      const { data: recentAnnouncements } = await supabase
        .from('announcements')
        .select('id, title, content, created_at')
        .or(`department.is.null,department.eq.${profile.department}`)
        .order('created_at', { ascending: false })
        .limit(2)

      recentAnnouncements?.forEach(announcement => {
        activities.push({
          id: announcement.id,
          type: 'announcement',
          title: `Announcement: ${announcement.title}`,
          description: announcement.content.substring(0, 100) + '...',
          timestamp: announcement.created_at
        })
      })

      // Sort by timestamp and take the most recent 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 5))

    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-xl w-80 animate-pulse"></div>
          <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg w-96 animate-pulse"></div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-hover border-0 shadow-lg bg-gradient-to-br from-muted/20 to-muted/10">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid gap-8 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="card-hover border-0 shadow-lg">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-3xl font-bold text-primary-subtle">
                {getGreeting()}, {profile?.full_name?.split(' ')[0]}!
              </h1>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stagger-item card-hover border shadow-sm bg-card group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Tasks</CardTitle>
                  <div className="text-3xl font-bold text-foreground mt-1">{stats?.myTasks}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                <Link to="/tasks">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full w-3/5" />
              </div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </CardContent>
        </Card>

        {stats?.upcomingDeadlines && stats.upcomingDeadlines > 0 && (
          <Card className="stagger-item card-hover border shadow-sm bg-card group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Due Soon</CardTitle>
                    <div className="text-3xl font-bold text-foreground mt-1">{stats?.upcomingDeadlines}</div>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white border-0 shadow-sm">
                  Urgent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full w-4/5" />
                </div>
                <span className="text-xs text-muted-foreground">Next 7 days</span>
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.myPendingLeaves && stats.myPendingLeaves > 0 && (
          <Card className="stagger-item card-hover border shadow-sm bg-card group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">My Leave Requests</CardTitle>
                    <div className="text-3xl font-bold text-foreground mt-1">{stats?.myPendingLeaves}</div>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full w-1/2" />
                </div>
                <span className="text-xs text-muted-foreground">Awaiting approval</span>
              </div>
            </CardContent>
          </Card>
        )}

        {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
          <Card className="stagger-item card-hover border shadow-sm bg-card group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-teal-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">My Team</CardTitle>
                    <div className="text-3xl font-bold text-foreground mt-1">{stats?.teamSize}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                  <Link to="/directory">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full w-4/5" />
                </div>
                <span className="text-xs text-muted-foreground">Department</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* General Stats Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stagger-item card-hover border shadow-sm bg-card group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
                  <div className="text-3xl font-bold text-foreground mt-1">{stats?.totalEmployees}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-3/4" />
              </div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stagger-item card-hover border shadow-sm bg-card group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
                  <div className="text-3xl font-bold text-foreground mt-1">{stats?.pendingLeaves}</div>
                </div>
              </div>
              {stats?.pendingLeaves && stats.pendingLeaves > 0 && (
                <Badge className="bg-orange-500 text-white border-0 shadow-sm">
                  {stats.pendingLeaves}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full w-1/2" />
              </div>
              <span className="text-xs text-muted-foreground">Awaiting</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stagger-item card-hover border shadow-sm bg-card group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
                  <div className="text-3xl font-bold text-foreground mt-1">{stats?.activeTasks}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-4/5" />
              </div>
              <span className="text-xs text-muted-foreground">Progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stagger-item card-hover border shadow-sm bg-card group">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
                  <div className="text-3xl font-bold text-foreground mt-1">{stats?.recentAnnouncements}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full w-2/3" />
              </div>
              <span className="text-xs text-muted-foreground">Published</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Charts Section */}
          <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Leave Distribution</CardTitle>
                <CardDescription className="text-gray-600">Approved leaves by department</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
              >
                <Link to="/leave">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.leavesByDepartment && stats.leavesByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.leavesByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No leave data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Task Overview</CardTitle>
                <CardDescription className="text-gray-600">Current task distribution</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
              >
                <Link to="/tasks">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.tasksByStatus.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.tasksByStatus.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No task data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          <QuickStatsWidget />
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              <CardDescription>Your latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'task' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'leave' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'announcement' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'task' && <CheckSquare className="h-4 w-4" />}
                      {activity.type === 'leave' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'announcement' && <Megaphone className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM dd, h:mm a')}
                        </span>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                        {activity.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              activity.priority === 'high' ? 'border-red-200 text-red-600' :
                              activity.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                              'border-green-200 text-green-600'
                            }`}
                          >
                            {activity.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="text-sm font-medium">{stats?.myTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Leaves</span>
                <span className="text-sm font-medium">{stats?.myPendingLeaves || 0}</span>
              </div>
              {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Members</span>
                  <span className="text-sm font-medium">{stats?.teamSize || 0}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due This Week</span>
                <span className="text-sm font-medium text-red-600">{stats?.upcomingDeadlines || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors" 
              asChild
            >
              <Link to="/leave">
                <Calendar className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Apply for Leave</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-gray-100 text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors" 
              asChild
            >
              <Link to="/tasks">
                <CheckSquare className="h-6 w-6 text-green-600" />
                <span className="font-medium">View My Tasks</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-gray-100 text-gray-600 border-gray-300 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors" 
              asChild
            >
              <Link to="/directory">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Browse Directory</span>
              </Link>
            </Button>
            
            {profile?.role !== 'employee' && (
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-gray-100 text-gray-600 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors" 
                asChild
              >
                <Link to="/reports">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  <span className="font-medium">View Reports</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}