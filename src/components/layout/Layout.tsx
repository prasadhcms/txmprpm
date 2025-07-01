import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile and handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      // Auto-close sidebar when switching to mobile
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    // Check on mount
    checkScreenSize()

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        // Don't close if clicking on the hamburger button or inside sidebar
        const target = e.target as Element
        if (target?.closest('[data-hamburger-button]') || target?.closest('[data-sidebar]')) {
          return
        }
        setSidebarOpen(false)
      }
      
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [isMobile, sidebarOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative flex min-h-screen">
        {/* Desktop Sidebar - Always visible on desktop */}
        {!isMobile && (
          <Sidebar 
            collapsed={false} 
            onToggle={() => {}} 
            isMobile={false}
            isOpen={true}
          />
        )}
        
        {/* Mobile Sidebar - Overlay */}
        {isMobile && (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Mobile Sidebar */}
            <Sidebar 
              collapsed={false} 
              onToggle={() => setSidebarOpen(!sidebarOpen)} 
              isMobile={true}
              isOpen={sidebarOpen}
            />
          </>
        )}
        
        <div className="flex flex-1 flex-col">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            showMenuButton={isMobile}
          />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto px-3 md:px-6 py-4 md:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}