import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Megaphone, Plus, AlertTriangle, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Database } from '@/types/database'

type Announcement = Database['public']['Tables']['announcements']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row']
}

export function Announcements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    department: 'company-wide',
    is_priority: false
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchDepartments()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      let query = supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      // Filter by department if user is not super admin
      if (profile?.role !== 'super_admin' && profile?.department) {
        query = query.or(`department.is.null,department.eq.${profile.department}`)
      }

      const { data, error } = await query

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('department')
        .eq('is_active', true)

      if (error) throw error

      const uniqueDepts = [...new Set(data?.map(p => p.department) || [])]
      setDepartments(uniqueDepts.sort())
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: profile.id,
          department: formData.department === 'company-wide' ? null : formData.department || null,
          is_priority: formData.is_priority
        })

      if (error) throw error

      toast.success('Announcement published successfully')
      setIsDialogOpen(false)
      setFormData({ title: '', content: '', department: 'company-wide', is_priority: false })
      fetchAnnouncements()
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('Failed to publish announcement')
    }
  }

  const getVisibilityBadge = (department: string | null) => {
    if (department) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">{department}</Badge>
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800">Company-wide</Badge>
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Stay updated with company news and updates
          </p>
        </div>
        {profile?.role === 'super_admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create a new announcement to share with your team or the entire company
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title..."
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your announcement content here..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department or leave empty for company-wide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company-wide">Company-wide</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_priority"
                    checked={formData.is_priority}
                    onCheckedChange={(checked) => setFormData({...formData, is_priority: !!checked})}
                  />
                  <Label htmlFor="is_priority">Mark as priority announcement</Label>
                </div>
                <Button type="submit" className="w-full">Publish Announcement</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No announcements</h3>
              <p className="text-muted-foreground">Check back later for company updates</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_priority ? 'border-orange-200 bg-orange-50' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_priority && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Priority
                        </Badge>
                      )}
                      {getVisibilityBadge(announcement.department)}
                    </div>
                    <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={announcement.profiles.profile_picture || undefined} />
                          <AvatarFallback className="text-xs">
                            {announcement.profiles.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{announcement.profiles.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(announcement.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}