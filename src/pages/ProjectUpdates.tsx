import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ImageUtils } from '@/lib/image-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Eye,
  Save,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Database } from '@/types/database'

type ProjectUpdate = Database['public']['Tables']['project_updates']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row']
}

export function ProjectUpdates() {
  const { profile } = useAuth()
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<ProjectUpdate | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    work_location: '',
    images: [] as string[]
  })

  const locations = [
    'Office - Main Building',
    'Office - Branch Location',
    'Client Site',
    'Remote - Home',
    'Remote - Co-working Space',
    'Field Work',
    'Other'
  ]

  useEffect(() => {
    fetchProjectUpdates()
  }, [profile])

  const fetchProjectUpdates = async () => {
    try {
      let query = supabase
        .from('project_updates')
        .select(`
          *,
          profiles!project_updates_employee_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      // Filter based on role
      if (profile?.role === 'employee') {
        query = query.eq('employee_id', profile.id)
      } else if (profile?.role === 'manager') {
        // Managers can see their department's updates
        query = query.or(`employee_id.eq.${profile.id}`)
      }

      const { data, error } = await query

      if (error) throw error
      setProjectUpdates(data || [])
    } catch (error) {
      console.error('Error fetching project updates:', error)
      toast.error('Failed to fetch project updates')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile || isSubmitting || isUploadingImages) return

    // Check if images are still uploading
    if (isUploadingImages) {
      toast.error('Please wait for images to finish uploading')
      return
    }

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Please enter a project title')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!formData.work_location) {
      toast.error('Please select a work location')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('project_updates')
        .insert({
          employee_id: profile.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          work_location: formData.work_location,
          images: formData.images.length > 0 ? formData.images : null,
          status: 'submitted'
        })

      if (error) throw error

      toast.success('Project update submitted successfully')
      setIsDialogOpen(false)
      setFormData({ title: '', description: '', work_location: '', images: [] })
      fetchProjectUpdates()
    } catch (error) {
      console.error('Error creating project update:', error)
      toast.error('Failed to submit project update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (updateId: string, status: 'approved' | 'draft') => {
    try {
      const { error } = await supabase
        .from('project_updates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', updateId)

      if (error) throw error

      toast.success(`Project update ${status} successfully`)
      fetchProjectUpdates()
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Failed to update project status')
    }
  }

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, url]
    }))
  }

  const handleImageRemoved = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />Submitted</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><FileText className="mr-1 h-3 w-3" />Draft</Badge>
    }
  }

  const myUpdates = projectUpdates.filter(update => update.employee_id === profile?.id)
  const pendingUpdates = projectUpdates.filter(update => update.status === 'submitted')
  
  // Smart default tab based on user role and pending reviews
  const getDefaultTab = () => {
    if (profile?.role === 'manager' || profile?.role === 'super_admin') {
      // For managers/admins, prioritize "Pending Reviews" if there are updates to review
      return pendingUpdates.length > 0 ? 'pending-reviews' : 'my-updates'
    }
    return 'my-updates'
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Project Updates</h2>
          <p className="text-muted-foreground">
            Share your project progress with images and detailed descriptions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && !isUploadingImages && setIsDialogOpen(open)}>
          <DialogTrigger asChild>
            <Button className="bg-gray-600 hover:bg-gray-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project Update</DialogTitle>
              <DialogDescription>
                Fill out the form to submit a new project update. Images can be uploaded to showcase progress.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="Enter project or task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="work_location">Work Location</Label>
                <Select value={formData.work_location} onValueChange={(value) => setFormData({...formData, work_location: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description & Progress</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you've accomplished, challenges faced, next steps..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Project Images</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  onImageRemoved={handleImageRemoved}
                  currentImages={formData.images}
                  maxImages={8}
                  bucket="projects"
                  userId={profile?.id || ''}
                  onUploadStateChange={setIsUploadingImages}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || isUploadingImages}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : isUploadingImages ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Images...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Update
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={getDefaultTab()} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-updates">My Updates</TabsTrigger>
          {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
            <TabsTrigger value="pending-reviews">
              Pending Reviews
              {pendingUpdates.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{pendingUpdates.length}</Badge>
              )}
            </TabsTrigger>
          )}
          {profile?.role === 'super_admin' && (
            <TabsTrigger value="all-updates">All Updates</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-updates" className="space-y-4">
          {myUpdates.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No project updates</h3>
                  <p className="text-muted-foreground">Start by creating your first project update with images</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myUpdates.map((update) => (
                <Card key={update.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{update.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{update.work_location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(update.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(update.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUpdate(update)
                            setIsViewDialogOpen(true)
                          }}
                          className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {update.description}
                    </p>
                    {update.images && update.images.length > 0 && (
                      <div className="flex gap-2">
                        {update.images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={ImageUtils.getOptimizedImageUrl(image, { width: 80, height: 60, quality: 80 })}
                            alt={`Project image ${index + 1}`}
                            className="w-16 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/64x48?text=Error'
                            }}
                          />
                        ))}
                        {update.images.length > 4 && (
                          <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                            +{update.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {(profile?.role === 'manager' || profile?.role === 'super_admin') && (
          <TabsContent value="pending-reviews" className="space-y-4">
            {pendingUpdates.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No pending reviews</h3>
                    <p className="text-muted-foreground">All project updates have been reviewed</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingUpdates.map((update) => (
                  <Card key={update.id} className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {update.title}
                            <Badge className="bg-blue-100 text-blue-800">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending Review
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={update.profiles.profile_picture || undefined} />
                                <AvatarFallback className="text-xs">
                                  {update.profiles.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{update.profiles.full_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{update.work_location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(update.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {update.description}
                      </p>
                      {update.images && update.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {update.images.slice(0, 5).map((image, index) => (
                            <img
                              key={index}
                              src={ImageUtils.getOptimizedImageUrl(image, { width: 80, height: 60, quality: 80 })}
                              alt={`Project image ${index + 1}`}
                              className="w-16 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/64x48?text=Error'
                              }}
                            />
                          ))}
                          {update.images.length > 5 && (
                            <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                              +{update.images.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate(update.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUpdate(update)
                            setIsViewDialogOpen(true)
                          }}
                          size="sm"
                          className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {profile?.role === 'super_admin' && (
          <TabsContent value="all-updates" className="space-y-4">
            <div className="grid gap-4">
              {projectUpdates.map((update) => (
                <Card key={update.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{update.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={update.profiles.profile_picture || undefined} />
                              <AvatarFallback className="text-xs">
                                {update.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{update.profiles.full_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{update.work_location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(update.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(update.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUpdate(update)
                            setIsViewDialogOpen(true)
                          }}
                          className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {update.description}
                    </p>
                    {update.images && update.images.length > 0 && (
                      <div className="flex gap-2">
                        {update.images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={ImageUtils.getOptimizedImageUrl(image, { width: 80, height: 60, quality: 80 })}
                            alt={`Project image ${index + 1}`}
                            className="w-16 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/64x48?text=Error'
                            }}
                          />
                        ))}
                        {update.images.length > 4 && (
                          <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                            +{update.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* View Update Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Update Details
            </DialogTitle>
            <DialogDescription>
              Review the details of the project update, including description and images.
            </DialogDescription>
          </DialogHeader>
          {selectedUpdate && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedUpdate.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedUpdate.profiles.profile_picture || undefined} />
                        <AvatarFallback className="text-xs">
                          {selectedUpdate.profiles.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedUpdate.profiles.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedUpdate.work_location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedUpdate.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedUpdate.status)}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description & Progress</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedUpdate.description}
                  </p>
                </div>
              </div>

              {selectedUpdate.images && selectedUpdate.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Project Images ({selectedUpdate.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedUpdate.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={ImageUtils.getOptimizedImageUrl(image, { width: 300, height: 200, quality: 85 })}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-32 object-cover rounded border hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => window.open(image, '_blank')}
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Error+Loading+Image'
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUpdate.status === 'submitted' && (profile?.role === 'manager' || profile?.role === 'super_admin') && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedUpdate.id, 'approved')
                      setIsViewDialogOpen(false)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve Update
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
