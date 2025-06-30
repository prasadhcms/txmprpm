import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickStats {
  tasksCompleted: number
  tasksTotal: number
  completionRate: number
  streakDays: number
  upcomingDeadlines: number
  weeklyGoal: number
  weeklyProgress: number
}

export function QuickStatsWidget() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchQuickStats()
    }
  }, [profile])

  const fetchQuickStats = async () => {
    if (!profile) return

    try {
      // Mock data for demonstration - replace with actual API calls
      const mockStats: QuickStats = {
        tasksCompleted: 12,
        tasksTotal: 15,
        completionRate: 80,
        streakDays: 5,
        upcomingDeadlines: 3,
        weeklyGoal: 20,
        weeklyProgress: 12
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
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
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Your performance at a glance</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQuickStats}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Task Completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Tasks Completed</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.tasksCompleted}/{stats.tasksTotal}
            </span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.completionRate}% completion rate this week
          </p>
        </div>

        {/* Weekly Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Weekly Goal</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.weeklyProgress}/{stats.weeklyGoal}
            </span>
          </div>
          <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.weeklyGoal - stats.weeklyProgress} tasks remaining
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-lg font-bold text-foreground">{stats.streakDays}</span>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-lg font-bold text-foreground">{stats.upcomingDeadlines}</span>
            </div>
            <p className="text-xs text-muted-foreground">Due Soon</p>
          </div>
        </div>

        {/* Achievement Badge */}
        {stats.completionRate >= 90 && (
          <div className="flex items-center justify-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-green-800">High Performer!</p>
                <p className="text-xs text-green-600">Excellent completion rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/tasks">
              <CheckSquare className="h-4 w-4 mr-1" />
              Tasks
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/leave">
              <Calendar className="h-4 w-4 mr-1" />
              Leave
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}