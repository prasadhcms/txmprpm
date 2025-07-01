import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import logo from '../../assets/texam-logo.jpg'
// import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  Settings, 
  User, 
  LogOut,
  CheckSquare,
  Calendar,
  Megaphone,
  Menu
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

interface Notification {
  id: string
  type: 'task' | 'leave' | 'announcement'
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (profile) {
      fetchNotifications()
    }
  }, [profile])

  const fetchNotifications = async () => {
    if (!profile) return

    try {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'task',
          title: 'New Task Assigned',
          message: 'You have been assigned a new task: Complete project documentation',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'leave',
          title: 'Leave Request Update',
          message: 'Your vacation request for next week has been approved',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: '3',
          type: 'announcement',
          title: 'Company Update',
          message: 'New company policies have been published',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true
        }
      ]

      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-amber-500 text-neutral-800 border-0'
      case 'manager':
        return 'bg-blue-500 gradient-text border-0'
      default:
        return 'bg-neutral-500 gradient-text border-0'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm shadow-black/15 relative">
      {/* Enhanced visual separation with subtle gradient */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      {/* Subtle inner glow for depth */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left Section - Hamburger + Logo */}
        <div className="flex items-center space-x-3">
          {/* Hamburger Menu Button - Only on Mobile */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onMenuClick?.()
              }}
              className="lg:hidden p-2 hover:bg-muted/80 relative z-10"
              aria-label="Toggle menu"
              data-hamburger-button
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Texam Logo" />
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">WorkFlow Management</p>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-muted/80 transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 z-[60]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start space-y-1 p-3 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className={`p-1 rounded ${
                          notification.type === 'task' ? 'bg-blue-100 text-blue-600' :
                          notification.type === 'leave' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {notification.type === 'task' && <CheckSquare className="h-3 w-3" />}
                          {notification.type === 'leave' && <Calendar className="h-3 w-3" />}
                          {notification.type === 'announcement' && <Megaphone className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.timestamp), 'MMM dd, h:mm a')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm text-muted-foreground">
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-muted/80">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                    <AvatarImage src={profile.profile_picture || undefined} />
                    <AvatarFallback className="bg-blue-900 text-primary-foreground text-xs font-medium">
                      {profile.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-[60]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.profile_picture || undefined} />
                        <AvatarFallback className="bg-blue-900 text-primary-foreground">
                          {profile.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {profile.role.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{profile.department}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center space-x-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="flex items-center space-x-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}