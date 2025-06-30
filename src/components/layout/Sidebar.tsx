import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Search,
  Briefcase
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

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
    const hasRole = profile?.role && item.roles.includes(profile.role)
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return hasRole && matchesSearch
  })

  return (
    <div className={cn(
      'flex h-screen flex-col transition-all duration-300 ease-out',
      collapsed ? 'w-16' : 'w-72'
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus:bg-background input-modern"
            />
          </div>
        </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-muted/80 transition-all duration-200 hover:scale-110"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <div key={item.name} className="stagger-item">
                <Link to={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 transition-all duration-200 ease-out group relative overflow-hidden",
                      collapsed ? "px-3" : "px-4",
                      isActive 
                        ? "bg-muted/60 text-primary border border-primary/20" 
                        : "hover:bg-muted/60 hover:shadow-sm hover:scale-[1.02]"
                    )}
                  >
                    {/* Icon with flat background */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary shadow-md" 
                        : "bg-muted group-hover:bg-neutral-700"
                    )}>
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors duration-200",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary-foreground"
                      )} />
                    </div>
                    
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 ml-3">
                        <span className={cn(
                          "font-medium transition-colors duration-200",
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
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-r-full" />
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
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
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