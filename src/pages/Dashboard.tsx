import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dataService, DashboardStats, RecentActivity } from '@/lib/data-service'
import { usePerformance } from '@/hooks/use-performance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckSquare, Megaphone, TrendingUp, Clock, ArrowUpRight, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget'
import { CSSBarChart, CSSPieChart } from '@/components/ui/css-charts'


export function Dashboard() {
  const { profile } = useAuth()
  const { trackDataFetch } = usePerformance('Dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      trackDataFetch.start()
      
      // Fetch dashboard stats and recent activity in parallel
      const [statsData, activityData] = await Promise.all([
        dataService.getDashboardStats(profile.id, profile.role, profile.department),
        dataService.getRecentActivity(profile.id)
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      trackDataFetch.end()
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 ">
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
    <div className="space-y-8 relative">
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
        <Card className="card-hover border shadow-sm bg-card group">
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
          <Card className="card-hover border shadow-sm bg-card group">
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
          <Card className="card-hover border shadow-sm bg-card group">
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
          <Card className="card-hover border shadow-sm bg-card group">
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
        <Card className="card-hover border shadow-sm bg-card group">
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

        <Card className="card-hover border shadow-sm bg-card group">
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

        <Card className="card-hover border shadow-sm bg-card group">
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

        <Card className="card-hover border shadow-sm bg-card group">
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
              <CSSBarChart 
                data={stats.leavesByDepartment.map(item => ({
                  name: item.name,
                  value: item.value,
                  color: '#3b82f6'
                }))}
                height={300}
                showValues={true}
                showLabels={true}
              />
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
              <div className="flex justify-center">
                <CSSPieChart 
                  data={stats.tasksByStatus.filter(item => item.value > 0).map(item => ({
                    name: item.name,
                    value: item.value,
                    color: item.color
                  }))}
                  size={200}
                  showLabels={true}
                  showLegend={true}
                />
              </div>
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