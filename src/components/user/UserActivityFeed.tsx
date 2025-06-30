import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  CheckSquare, 
  Calendar, 
  Megaphone, 
  FileText, 
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'task_created' | 'task_completed' | 'leave_requested' | 'leave_approved' | 'announcement_viewed' | 'profile_updated'
  title: string
  description: string
  timestamp: string
  metadata?: {
    status?: string
    priority?: string
    category?: string
  }
}

export function UserActivityFeed() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchActivities()
    }
  }, [profile])

  const fetchActivities = async (isRefresh = false) => {
    if (!profile) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // Mock data for demonstration - replace with actual API calls
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'task_completed',
          title: 'Completed Task',
          description: 'Finished the quarterly report analysis',
          timestamp: new Date().toISOString(),
          metadata: { status: 'completed', priority: 'high' }
        },
        {
          id: '2',
          type: 'leave_requested',
          title: 'Leave Request Submitted',
          description: 'Requested vacation leave for next week',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          metadata: { status: 'pending', category: 'vacation' }
        },
        {
          id: '3',
          type: 'task_created',
          title: 'New Task Assigned',
          description: 'Review and update project documentation',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          metadata: { status: 'pending', priority: 'medium' }
        },
        {
          id: '4',
          type: 'announcement_viewed',
          title: 'Viewed Announcement',
          description: 'Read company policy updates',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          metadata: { category: 'policy' }
        },
        {
          id: '5',
          type: 'profile_updated',
          title: 'Profile Updated',
          description: 'Updated contact information and job title',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '6',
          type: 'leave_approved',
          title: 'Leave Request Approved',
          description: 'Sick leave request was approved by manager',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          metadata: { status: 'approved', category: 'sick' }
        }
      ]

      setActivities(mockActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
      case 'task_completed':
        return <CheckSquare className="h-4 w-4" />
      case 'leave_requested':
      case 'leave_approved':
        return <Calendar className="h-4 w-4" />
      case 'announcement_viewed':
        return <Megaphone className="h-4 w-4" />
      case 'profile_updated':
        return <FileText className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'task_completed':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'leave_requested':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      case 'leave_approved':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'announcement_viewed':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'profile_updated':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusBadge = (activity: ActivityItem) => {
    if (!activity.metadata?.status) return null

    const status = activity.metadata.status
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
    
    if (status === 'completed' || status === 'approved') variant = "default"
    if (status === 'pending') variant = "outline"
    if (status === 'rejected') variant = "destructive"

    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    const colors = {
      high: 'bg-red-100 text-red-600 border-red-200',
      medium: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      low: 'bg-green-100 text-green-600 border-green-200'
    }

    return (
      <Badge variant="outline" className={`text-xs ${colors[priority as keyof typeof colors] || colors.medium}`}>
        {priority}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <CardDescription>Your recent activities and updates</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        {activity.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(activity)}
                        {getPriorityBadge(activity.metadata?.priority)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM dd, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                {index < activities.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}