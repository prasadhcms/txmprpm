import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Database } from '@/types/database'

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row']
}

export function LeaveManagement() {
  const { profile } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  })

  useEffect(() => {
    fetchLeaveRequests()
  }, [profile])

  const fetchLeaveRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_employee_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      // If employee, only show their requests
      if (profile?.role === 'employee') {
        query = query.eq('employee_id', profile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setLeaveRequests(data || [])
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast.error('Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: profile.id,
          leave_type: formData.leave_type as any,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: daysCount,
          reason: formData.reason,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Leave request submitted successfully')
      setIsDialogOpen(false)
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' })
      fetchLeaveRequests()
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast.error('Failed to submit leave request')
    }
  }

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          manager_id: profile?.id,
          manager_comments: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success(`Leave request ${status} successfully`)
      fetchLeaveRequests()
    } catch (error) {
      console.error('Error updating leave request:', error)
      toast.error('Failed to update leave request')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800'
      case 'sick':
        return 'bg-red-100 text-red-800'
      case 'personal':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingRequests = leaveRequests.filter(req => req.status === 'pending')
  const myRequests = leaveRequests.filter(req => req.employee_id === profile?.id)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">
            Manage your leave requests and approvals
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(value) => setFormData({...formData, leave_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
            <TabsTrigger value="pending-approvals">
              Pending Approvals
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          )}
          {profile?.role === 'super_admin' && (
            <TabsTrigger value="all-requests">All Requests</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No leave requests</h3>
                  <p className="text-muted-foreground">You haven't submitted any leave requests yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline" className={getLeaveTypeColor(request.leave_type)}>
                            {request.leave_type.toUpperCase()}
                          </Badge>
                          {request.days_count} day{request.days_count > 1 ? 's' : ''}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                    {request.manager_comments && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Manager Comments:</strong> {request.manager_comments}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
          <TabsContent value="pending-approvals" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No pending requests</h3>
                    <p className="text-muted-foreground">All leave requests have been processed</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {request.profiles.full_name}
                            <Badge variant="outline" className={getLeaveTypeColor(request.leave_type)}>
                              {request.leave_type.toUpperCase()}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {request.profiles.department} • {request.days_count} day{request.days_count > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm"><strong>Duration:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                          <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {profile?.role === 'super_admin' && (
          <TabsContent value="all-requests" className="space-y-4">
            <div className="grid gap-4">
              {leaveRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {request.profiles.full_name}
                          <Badge variant="outline" className={getLeaveTypeColor(request.leave_type)}>
                            {request.leave_type.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {request.profiles.department} • {request.days_count} day{request.days_count > 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm"><strong>Duration:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                    <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                    {request.manager_comments && (
                      <p className="text-sm"><strong>Manager Comments:</strong> {request.manager_comments}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </p>
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