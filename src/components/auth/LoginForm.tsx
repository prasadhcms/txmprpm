import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff, Mail, FolderCheck, Users, ArrowRight, Watch, ListCheck } from 'lucide-react'
import { RegisterForm } from './RegisterForm'
import { toast } from 'sonner'
import logo from '../../assets/texam-logo.jpg'

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.')
      } else if (error.message.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a few minutes before trying again.')
      } else {
        setError(`Login failed: ${error.message}`)
      }
    }
    
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Please enter your email address first')
      return
    }

    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(`Reset failed: ${error.message}`)
      } else {
        toast.success('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="Texam Logo" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold gradient-text">Texam Projects</h1>
                <p className="text-xs text-muted-foreground">WorkFlow Management Suite</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span>Secure & Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          
          {/* Left Side - Hero Content */}
          <div className="space-y-8 ">
            <div className="space-y-6">

              <h1 className="text-5xl text-neutral-700 font-bold leading-tight">
                TEXAM WorkFlow Management
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Comprehensive WorkFlow Suite for managing Employee Directory, Announcements, Project Updates, Task Management, and Leave Requests.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-white border">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Employee Directory</h3>
                  <p className="text-sm text-muted-foreground">Manage and Access Employee Information</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-white border">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <FolderCheck className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Project Updates</h3>
                  <p className="text-sm text-muted-foreground">Stay Informed with Project uUpdates</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-white border">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <ListCheck className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Task Management</h3>
                  <p className="text-sm text-muted-foreground">Prioritize Tasks Effectively</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-white border">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <Watch className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Leave Management</h3>
                  <p className="text-sm text-muted-foreground">Leave Requests and Approvals</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold">Sign in to Access WorkFlow</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="input-modern h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="input-modern h-12 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 btn-modern bg-blue-900 text-primary-foreground font-medium" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 btn-modern"
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !email}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">New to WorkFlow?</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegister(true)}
                  className="w-full h-12 btn-modern border-primary/20 text-cyan-500 hover:bg-primary/10"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}