import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  Megaphone,
  BarChart3,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Briefcase
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  isOpen?: boolean
}

export function Sidebar({ collapsed, onToggle, isMobile = false, isOpen = true }: SidebarProps) {
  const { profile } = useAuth()
  const location = useLocation()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: null
    },
    { 
      name: 'Directory', 
      href: '/directory', 
      icon: Users, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: null
    },
    { 
      name: 'Leave Management', 
      href: '/leave', 
      icon: Calendar, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: '2'
    },
    { 
      name: 'Announcements', 
      href: '/announcements', 
      icon: Megaphone, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: null
    },
    { 
      name: 'Tasks', 
      href: '/tasks', 
      icon: CheckSquare, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: '5'
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: Briefcase, 
      roles: ['employee', 'manager', 'super_admin'],
      badge: null
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3, 
      roles: ['manager', 'super_admin'],
      badge: null
    },
    { 
      name: 'Admin Panel', 
      href: '/admin', 
      icon: Settings, 
      roles: ['super_admin'],
      badge: null
    },
  ]

  const filteredNavigation = navigation.filter(item => {
    return !item.roles || item.roles.includes(profile?.role || 'employee')
  })

  return (
    <div 
      className={cn(
        'flex min-h-screen flex-col transition-all duration-300 ease-out bg-background border-r border-border/50',
        // Desktop behavior
        !isMobile && (collapsed ? 'w-16' : 'w-72'),
        // Mobile behavior - overlay sidebar
        isMobile && [
          'fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        ]
      )}
      onClick={(e) => {
        // Prevent clicks inside sidebar from bubbling up to backdrop
        if (isMobile) {
          e.stopPropagation()
        }
      }}
      data-sidebar
    >
      {/* Header */}
      <div className="flex h-14 md:h-16 items-center justify-between px-2 md:px-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Home className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
            <div className="hidden md:block">
              <h2 className="text-sm font-semibold text-foreground">Navigation</h2>
              <p className="text-xs text-muted-foreground">Quick access</p>
            </div>
            <div className="md:hidden">
              <h2 className="text-sm font-semibold text-foreground">Menu</h2>
            </div>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        )}
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 md:px-3 py-3 md:py-6">
        <nav className="space-y-1 md:space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <div key={item.name} className="stagger-item">
                <Link 
                  to={item.href}
                  onClick={() => {
                    // Close mobile sidebar when navigation item is clicked
                    if (isMobile && isOpen) {
                      onToggle()
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 md:h-12 transition-colors duration-200 ease-out group relative",
                      collapsed ? "px-2 md:px-3" : "px-2 md:px-4",
                      isActive 
                        ? "bg-muted/60 text-primary" 
                        : "hover:bg-muted/60"
                    )}
                  >
                    {/* Icon with flat background */}
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary shadow-md" 
                        : "bg-muted group-hover:bg-primary"
                    )}>
                      <item.icon className={cn(
                        "h-3.5 w-3.5 md:h-4 md:w-4 transition-colors duration-200",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary-foreground"
                      )} />
                    </div>
                    
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 ml-2 md:ml-3">
                        <span className={cn(
                          "font-medium transition-colors duration-200 text-sm md:text-base",
                          isActive ? "text-primary" : "text-foreground"
                        )}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="h-5 px-2 text-xs bg-primary/20 text-primary border-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Button>
                </Link>
              </div>
            )
          })}
        </nav>
      </ScrollArea>
      
      {/* User Status Footer */}
      {!collapsed && profile && (
        <div className="p-2 md:p-4 border-t border-border/50">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}