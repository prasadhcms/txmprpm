import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { StorageService } from '@/lib/storage'
import { ImageUtils } from '@/lib/image-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { User, Mail, Phone, MapPin, Calendar, Building, Briefcase, Loader2, Save, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { PasswordChangeForm } from '@/components/auth/PasswordChangeForm'
import { UserPreferences } from '@/components/user/UserPreferences'
import { UserActivityFeed } from '@/components/user/UserActivityFeed'

export function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState(profile?.profile_picture || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    job_title: profile?.job_title || '',
    location: profile?.location || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          job_title: formData.job_title,
          location: formData.location,
          profile_picture: profilePictureUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      setHasChanges(false)
      
      // Refresh the profile in the auth context
      await refreshProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleProfilePictureUploaded = async (url: string) => {
    setProfilePictureUrl(url)
    
    // Auto-save the profile picture
    if (profile) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            profile_picture: url,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)

        if (error) throw error

        toast.success('Profile picture updated successfully!')
        await refreshProfile()
      } catch (error) {
        console.error('Error updating profile picture:', error)
        toast.error('Failed to update profile picture')
      }
    }
  }

  const handleProfilePictureRemoved = () => {
    setProfilePictureUrl('')
    setHasChanges(true)
    toast.info('Profile picture removed! Don\'t forget to save your changes.')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-destructive text-destructive-foreground border-0'
      case 'manager':
        return 'bg-primary text-primary-foreground border-0'
      default:
        return 'bg-success text-success-foreground border-0'
    }
  }

  const locations = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Remote', 'Other'
  ]

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Modern Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
        <div className="p-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg animate-float">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary-subtle">My Profile</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Manage your personal information and account settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Overview */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Overview
              </CardTitle>
              <CardDescription>Your current profile information and picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-lg">
                    <AvatarImage 
                      src={profilePictureUrl ? ImageUtils.getOptimizedImageUrl(profilePictureUrl, { width: 200, height: 200, quality: 90 }) : undefined} 
                    />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                      {profile.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 shadow-lg">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{profile.full_name}</h3>
                    <p className="text-lg text-muted-foreground">{profile.job_title}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleBadgeColor(profile.role)}>
                      {profile.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">{profile.department}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your contact details and work information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{profile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{profile.location}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-muted-foreground">{profile.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Job Title</p>
                      <p className="text-sm text-muted-foreground">{profile.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Joining Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(profile.joining_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload or update your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImageUploaded={handleProfilePictureUploaded}
                onImageRemoved={handleProfilePictureRemoved}
                currentImages={profilePictureUrl ? [profilePictureUrl] : []}
                maxImages={1}
                bucket="profiles"
                userId={profile.id}
              />
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Note:</strong> Some fields like email, department, and role can only be changed by administrators.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-3">
                  <Button 
                    type="submit" 
                    disabled={loading || !hasChanges}
                    className={`transition-all duration-200 ${
                      hasChanges 
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                      </>
                    )}
                  </Button>
                  {hasChanges && (
                    <span className="text-sm text-muted-foreground animate-pulse">
                      You have unsaved changes
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <PasswordChangeForm />
          
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and security information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Email</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Last Sign In</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMMM dd, yyyy at h:mm a') : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <UserPreferences />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <UserActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  )
}