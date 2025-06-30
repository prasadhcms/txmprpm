import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Moon, 
  Sun, 
  Shield, 
  Smartphone,
  Mail,
  Calendar,
  CheckSquare,
  Megaphone,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface UserPreferencesProps {
  onSave?: (preferences: any) => void
}

export function UserPreferences({ onSave }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      tasks: true,
      leaves: true,
      announcements: true,
      deadlines: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    privacy: {
      profileVisibility: 'team',
      showOnlineStatus: true,
      allowDirectMessages: true
    }
  })

  const [loading, setLoading] = useState(false)

  const handleNotificationChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const handleAppearanceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }))
  }

  const handlePrivacyChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Here you would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Preferences saved successfully!')
      onSave?.(preferences)
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="task-notifications">Task Updates</Label>
                </div>
                <Switch
                  id="task-notifications"
                  checked={preferences.notifications.tasks}
                  onCheckedChange={(checked) => handleNotificationChange('tasks', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <Label htmlFor="leave-notifications">Leave Requests</Label>
                </div>
                <Switch
                  id="leave-notifications"
                  checked={preferences.notifications.leaves}
                  onCheckedChange={(checked) => handleNotificationChange('leaves', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Megaphone className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="announcement-notifications">Announcements</Label>
                </div>
                <Switch
                  id="announcement-notifications"
                  checked={preferences.notifications.announcements}
                  onCheckedChange={(checked) => handleNotificationChange('announcements', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-red-500" />
                  <Label htmlFor="deadline-notifications">Deadline Reminders</Label>
                </div>
                <Switch
                  id="deadline-notifications"
                  checked={preferences.notifications.deadlines}
                  onCheckedChange={(checked) => handleNotificationChange('deadlines', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance & Language
          </CardTitle>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={preferences.appearance.theme} onValueChange={(value) => handleAppearanceChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={preferences.appearance.language} onValueChange={(value) => handleAppearanceChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={preferences.appearance.timezone} onValueChange={(value) => handleAppearanceChange('timezone', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy settings and data visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Who can see your profile information</p>
              </div>
              <Select 
                value={preferences.privacy.profileVisibility} 
                onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="team">Team Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="online-status">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch
                id="online-status"
                checked={preferences.privacy.showOnlineStatus}
                onCheckedChange={(checked) => handlePrivacyChange('showOnlineStatus', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="direct-messages">Allow Direct Messages</Label>
                <p className="text-sm text-muted-foreground">Allow team members to message you directly</p>
              </div>
              <Switch
                id="direct-messages"
                checked={preferences.privacy.allowDirectMessages}
                onCheckedChange={(checked) => handlePrivacyChange('allowDirectMessages', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="min-w-32">
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}