import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSSBarChart, CSSPieChart } from '@/components/ui/css-charts'
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  Target,
  AlertTriangle,
  Download
} from 'lucide-react'
import { subDays, startOfMonth } from 'date-fns'

interface ReportsData {
  // Employee Analytics
  totalEmployees: number
  activeEmployees: number
  employeesByDepartment: Array<{ name: string; value: number; color: string }>
  employeesByRole: Array<{ name: string; value: number }>
  newHiresThisMonth: number
  
  // Leave Analytics
  totalLeaveRequests: number
  approvedLeaves: number
  pendingLeaves: number
  rejectedLeaves: number
  leavesByType: Array<{ name: string; value: number; color: string }>
  leavesByMonth: Array<{ month: string; approved: number; pending: number; rejected: number }>
  averageLeaveDays: number
  
  // Task Analytics
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  tasksByPriority: Array<{ name: string; value: number; color: string }>
  tasksByDepartment: Array<{ name: string; completed: number; pending: number; overdue: number }>
  taskCompletionRate: number
  
  // Project Analytics
  totalProjects: number
  approvedProjects: number
  draftProjects: number
  submittedProjects: number
  projectsByLocation: Array<{ name: string; value: number }>
  
  // Performance Metrics
  departmentPerformance: Array<{ 
    department: string
    taskCompletion: number
    leaveUtilization: number
    projectSubmissions: number
    score: number
  }>
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal
]

export function Reports() {
  const { profile } = useAuth()
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    fetchReportsData()
    fetchDepartments()
  }, [timeRange, selectedDepartment])

  const fetchDepartments = async () => {
    try {
      const { data: deptData } = await supabase
        .from('profiles')
        .select('department')
        .eq('is_active', true)
      
      const uniqueDepts = [...new Set(deptData?.map(p => p.department) || [])]
      setDepartments(uniqueDepts)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = subDays(endDate, parseInt(timeRange))
      
      // Department filter
      const deptFilter = selectedDepartment === 'all' ? {} : { department: selectedDepartment }

      // Employee Analytics
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .match(deptFilter)

      const { count: activeEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .match(deptFilter)

      const { data: employeesByDept } = await supabase
        .from('profiles')
        .select('department')
        .eq('is_active', true)
        .match(selectedDepartment === 'all' ? {} : deptFilter)

      const { data: employeesByRole } = await supabase
        .from('profiles')
        .select('role')
        .eq('is_active', true)
        .match(deptFilter)

      const { count: newHires } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('joining_date', startOfMonth(new Date()).toISOString())
        .match(deptFilter)

      // Leave Analytics
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_employee_id_fkey(department)
        `)
        .gte('created_at', startDate.toISOString())
        .match(selectedDepartment === 'all' ? {} : { 'profiles.department': selectedDepartment })

      // Task Analytics
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .match(selectedDepartment === 'all' ? {} : deptFilter)

      // Project Analytics
      const { data: projects } = await supabase
        .from('project_updates')
        .select(`
          *,
          profiles!project_updates_employee_id_fkey(department)
        `)
        .gte('created_at', startDate.toISOString())
        .match(selectedDepartment === 'all' ? {} : { 'profiles.department': selectedDepartment })

      // Process data
      const processedData = processReportsData({
        employees: { total: totalEmployees || 0, active: activeEmployees || 0, newHires: newHires || 0 },
        employeesByDept: employeesByDept || [],
        employeesByRole: employeesByRole || [],
        leaveRequests: leaveRequests || [],
        tasks: tasks || [],
        projects: projects || []
      })

      setData(processedData)
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processReportsData = (rawData: any): ReportsData => {
    // Employee Analytics
    const deptCounts = rawData.employeesByDept.reduce((acc: any, emp: any) => {
      if (emp.department) {
        acc[emp.department] = (acc[emp.department] || 0) + 1
      }
      return acc
    }, {})

    const employeesByDepartment = Object.entries(deptCounts).map(([name, value], index) => ({
      name,
      value: value as number,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    const roleCounts = rawData.employeesByRole.reduce((acc: any, emp: any) => {
      if (emp.role) {
        acc[emp.role] = (acc[emp.role] || 0) + 1
      }
      return acc
    }, {})

    const employeesByRole = Object.entries(roleCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: value as number
    }))

    // Leave Analytics
    const leavesByStatus = rawData.leaveRequests.reduce((acc: any, leave: any) => {
      if (leave.status) {
        acc[leave.status] = (acc[leave.status] || 0) + 1
      }
      return acc
    }, {})

    const leavesByType = rawData.leaveRequests.reduce((acc: any, leave: any) => {
      if (leave.leave_type) {
        acc[leave.leave_type] = (acc[leave.leave_type] || 0) + 1
      }
      return acc
    }, {})

    const leavesByTypeChart = Object.entries(leavesByType).map(([name, value], index) => ({
      name: name.toUpperCase(),
      value: value as number,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    // Task Analytics
    const tasksByStatus = rawData.tasks.reduce((acc: any, task: any) => {
      if (task.status) {
        acc[task.status] = (acc[task.status] || 0) + 1
      }
      return acc
    }, {})

    const tasksByPriority = rawData.tasks.reduce((acc: any, task: any) => {
      if (task.priority) {
        acc[task.priority] = (acc[task.priority] || 0) + 1
      }
      return acc
    }, {})

    const tasksByPriorityChart = Object.entries(tasksByPriority).map(([name, value], index) => ({
      name: name.toUpperCase(),
      value: value as number,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    // Project Analytics
    const projectsByStatus = rawData.projects.reduce((acc: any, project: any) => {
      if (project.status) {
        acc[project.status] = (acc[project.status] || 0) + 1
      }
      return acc
    }, {})

    const projectsByLocation = rawData.projects.reduce((acc: any, project: any) => {
      if (project.work_location) {
        acc[project.work_location] = (acc[project.work_location] || 0) + 1
      }
      return acc
    }, {})

    const projectsByLocationChart = Object.entries(projectsByLocation).map(([name, value]) => ({
      name,
      value: value as number
    }))

    // Calculate completion rates and averages
    const totalTasks = rawData.tasks.length
    const completedTasks = tasksByStatus.completed || 0
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const totalLeaveDays = rawData.leaveRequests.reduce((sum: number, leave: any) => sum + (leave.days_count || 0), 0)
    const averageLeaveDays = rawData.leaveRequests.length > 0 ? totalLeaveDays / rawData.leaveRequests.length : 0

    return {
      // Employee Analytics
      totalEmployees: rawData.employees.total,
      activeEmployees: rawData.employees.active,
      employeesByDepartment,
      employeesByRole,
      newHiresThisMonth: rawData.employees.newHires,

      // Leave Analytics
      totalLeaveRequests: rawData.leaveRequests.length,
      approvedLeaves: leavesByStatus.approved || 0,
      pendingLeaves: leavesByStatus.pending || 0,
      rejectedLeaves: leavesByStatus.rejected || 0,
      leavesByType: leavesByTypeChart,
      leavesByMonth: [], // TODO: Implement monthly breakdown
      averageLeaveDays,

      // Task Analytics
      totalTasks,
      completedTasks,
      pendingTasks: tasksByStatus.pending || 0,
      overdueTasks: 0, // TODO: Calculate based on due_date
      tasksByPriority: tasksByPriorityChart,
      tasksByDepartment: [], // TODO: Implement department breakdown
      taskCompletionRate,

      // Project Analytics
      totalProjects: rawData.projects.length,
      approvedProjects: projectsByStatus.approved || 0,
      draftProjects: projectsByStatus.draft || 0,
      submittedProjects: projectsByStatus.submitted || 0,
      projectsByLocation: projectsByLocationChart,

      // Performance Metrics
      departmentPerformance: [] // TODO: Implement department performance metrics
    }
  }

  // Smart default tab based on user role
  const getDefaultTab = () => {
    if (profile?.role === 'super_admin') {
      return 'employees' // Admins likely want to see employee analytics first
    } else if (profile?.role === 'manager') {
      return 'tasks' // Managers likely want to see task performance first
    }
    return 'employees' // Default for employees (though they might not have access)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to load reports</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your organization</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.completedTasks} of {data.totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingLeaves} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Updates</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {data.approvedProjects} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue={getDefaultTab()} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employees by Department</CardTitle>
                <CardDescription>Distribution of employees across departments</CardDescription>
              </CardHeader>
              <CardContent>
                {data.employeesByDepartment.length > 0 ? (
                  <div className="flex justify-center">
                    <CSSPieChart 
                      data={data.employeesByDepartment}
                      size={200}
                      showLabels={true}
                      showLegend={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No department data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employees by Role</CardTitle>
                <CardDescription>Role distribution in the organization</CardDescription>
              </CardHeader>
              <CardContent>
                {data.employeesByRole.length > 0 ? (
                  <CSSBarChart 
                    data={data.employeesByRole.map(item => ({
                      name: item.name,
                      value: item.value,
                      color: COLORS.primary
                    }))}
                    height={300}
                    showValues={true}
                    showLabels={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No role data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
                <CardDescription>Task distribution by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                {data.tasksByPriority.length > 0 ? (
                  <div className="flex justify-center">
                    <CSSPieChart 
                      data={data.tasksByPriority}
                      size={200}
                      showLabels={true}
                      showLegend={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No task priority data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Overview</CardTitle>
                <CardDescription>Current status of all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="text-sm text-muted-foreground">{data.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="text-sm text-muted-foreground">{data.pendingTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overdue</span>
                    <span className="text-sm text-muted-foreground">{data.overdueTasks}</span>
                  </div>
                  <div className="pt-4">
                    <div className="text-2xl font-bold text-center">
                      {data.taskCompletionRate.toFixed(1)}%
                    </div>
                    <p className="text-center text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests by Type</CardTitle>
                <CardDescription>Distribution of leave types requested</CardDescription>
              </CardHeader>
              <CardContent>
                {data.leavesByType.length > 0 ? (
                  <div className="flex justify-center">
                    <CSSPieChart 
                      data={data.leavesByType}
                      size={200}
                      showLabels={true}
                      showLegend={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No leave type data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Statistics</CardTitle>
                <CardDescription>Key leave metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Approved</span>
                    <Badge variant="secondary">{data.approvedLeaves}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending</span>
                    <Badge variant="outline">{data.pendingLeaves}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rejected</span>
                    <Badge variant="destructive">{data.rejectedLeaves}</Badge>
                  </div>
                  <div className="pt-4">
                    <div className="text-2xl font-bold text-center">
                      {data.averageLeaveDays.toFixed(1)}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">Average Days per Request</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Location</CardTitle>
                <CardDescription>Distribution of project work locations</CardDescription>
              </CardHeader>
              <CardContent>
                {data.projectsByLocation.length > 0 ? (
                  <CSSBarChart 
                    data={data.projectsByLocation.map(item => ({
                      name: item.name,
                      value: item.value,
                      color: COLORS.secondary
                    }))}
                    height={300}
                    showValues={true}
                    showLabels={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No project location data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>Current status of all project updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Approved</span>
                    <Badge variant="secondary">{data.approvedProjects}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submitted</span>
                    <Badge variant="outline">{data.submittedProjects}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Draft</span>
                    <Badge variant="secondary">{data.draftProjects}</Badge>
                  </div>
                  <div className="pt-4">
                    <div className="text-2xl font-bold text-center">
                      {data.totalProjects}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">Total Project Updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}