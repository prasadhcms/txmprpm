import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_to_profile: Database['public']['Tables']['profiles']['Row']
  assigned_by_profile: Database['public']['Tables']['profiles']['Row']
}

export function Tasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Database['public']['Tables']['profiles']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Fetch tasks and employees in parallel using optimized service
      const [tasksData, employeesData] = await Promise.all([
        dataService.getTasks(profile.id, profile.role),
        dataService.getEmployees()
      ])

      setTasks(tasksData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Task title is required')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Task description is required')
      return
    }
    if (!formData.assigned_to) {
      toast.error('Please select an employee to assign the task to')
      return
    }
    if (!profile.department) {
      toast.error('Your profile is missing department information. Please update your profile.')
      return
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: formData.assigned_to,
        assigned_by: profile.id,
        due_date: formData.due_date || null,
        priority: formData.priority as 'low' | 'medium' | 'high',
        department: profile.department || 'General',
        status: 'pending' as const
      }


      const { error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select(`
          *,
          assigned_to_profile:profiles!assigned_to(*),
          assigned_by_profile:profiles!assigned_by(*)
        `)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      toast.success('Task assigned successfully')
      setIsDialogOpen(false)
      setFormData({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' })
      fetchData()
    } catch (error: any) {
      console.error('Error creating task:', error)
      
      // More specific error messages
      if (error.message?.includes('foreign key')) {
        toast.error('Invalid employee selected. Please try again.')
      } else if (error.message?.includes('check constraint')) {
        toast.error('Invalid task data. Please check all fields.')
      } else {
        toast.error(`Failed to assign task: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleStatusUpdate = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error

      toast.success('Task status updated successfully')
      fetchData()
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground border-0"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-primary text-primary-foreground border-0"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
      default:
        return <Badge className="bg-warning text-warning-foreground border-0"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-destructive text-destructive-foreground border-0">High</Badge>
      case 'medium':
        return <Badge className="bg-orange-500 text-white border-0">Medium</Badge>
      default:
        return <Badge variant="outline" className="border-muted-foreground/30">Low</Badge>
    }
  }

  const myTasks = tasks.filter(task => task.assigned_to === profile?.id)
  const assignedByMe = tasks.filter(task => task.assigned_by === profile?.id)
  
  // Smart default tab based on user role and task counts
  const getDefaultTab = () => {
    if (profile?.role === 'manager' || profile?.role === 'super_admin') {
      // For managers/admins, prioritize "Assigned by Me" if they have tasks they've assigned
      // Otherwise default to "My Tasks"
      return assignedByMe.length > 0 ? 'assigned-by-me' : 'my-tasks'
    }
    return 'my-tasks'
  }

  if (loading) {
    return (
      <div className="space-y-8 ">
        {/* Header Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
          <div className="p-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-64 animate-pulse" />
                <div className="h-4 bg-muted rounded w-96 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Task Cards Skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border shadow-sm bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-48 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full overflow-hidden">
      {/* Modern Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-subtle break-words">Task Management</h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
                  Organize and track tasks across your organization
                </p>
              </div>
            </div>
            
            {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
              <div className="flex-shrink-0">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Assign New Task</span>
                      <span className="sm:hidden">New Task</span>
                    </Button>
                  </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create and assign a new task to a team member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title..."
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task details..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date (Optional)</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Assign Task</Button>
              </form>
            </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={getDefaultTab()} className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
            <TabsTrigger value="assigned-by-me">Assigned by Me</TabsTrigger>
          )}
          {profile?.role === 'super_admin' && (
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-tasks" className="space-y-6">
          {myTasks.length === 0 ? (
            <Card className="border shadow-sm bg-card">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                    <CheckSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">No tasks assigned</h3>
                    <p className="text-muted-foreground mt-2">You don't have any tasks assigned to you yet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {myTasks.map((task, _index) => (
                <Card key={task.id} className="card-hover border shadow-sm bg-card group">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 flex-shrink-0">
                            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg font-semibold break-words">{task.title}</CardTitle>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                              {getPriorityBadge(task.priority)}
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardDescription className="text-xs sm:text-sm truncate">
                          Assigned by {task.assigned_by_profile.full_name}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed break-words">{task.description}</p>
                    {task.status !== 'completed' && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {task.status === 'pending' && (
                          <Button
                            onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                            size="sm"
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                          >
                            Start Task
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            onClick={() => handleStatusUpdate(task.id, 'completed')}
                            className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90 transition-all duration-200 hover:scale-105"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
          <TabsContent value="assigned-by-me" className="space-y-4">
            <div className="grid gap-4">
              {assignedByMe.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {task.title}
                          {getPriorityBadge(task.priority)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assigned_to_profile.profile_picture || undefined} />
                            <AvatarFallback className="text-xs">
                              {task.assigned_to_profile.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {task.assigned_to_profile.full_name}
                          {task.due_date && (
                            <span> • Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {profile?.role === 'super_admin' && (
          <TabsContent value="all-tasks" className="space-y-4">
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {task.title}
                          {getPriorityBadge(task.priority)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Assigned to:</span>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assigned_to_profile.profile_picture || undefined} />
                              <AvatarFallback className="text-xs">
                                {task.assigned_to_profile.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {task.assigned_to_profile.full_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">By:</span>
                            {task.assigned_by_profile.full_name}
                          </div>
                        </CardDescription>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}