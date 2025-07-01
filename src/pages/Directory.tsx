import { useEffect, useState } from 'react'
import { dataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Mail, Phone, MapPin, Calendar, User, Users } from 'lucide-react'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function Directory() {
  const [employees, setEmployees] = useState<Profile[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, departmentFilter, locationFilter])

  const fetchEmployees = async () => {
    try {
      const data = await dataService.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.department === departmentFilter)
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(employee => employee.location === locationFilter)
    }

    setFilteredEmployees(filtered)
  }

  const getDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.department))]
    return departments.sort()
  }

  const getLocations = () => {
    const locations = [...new Set(employees.map(emp => emp.location))]
    return locations.sort()
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

  if (loading) {
    return (
      <div className="space-y-8 ">
        {/* Header Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
          <div className="p-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-64 animate-pulse" />
                <div className="h-4 bg-muted rounded w-96 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Employee Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border shadow-sm bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 ">
      {/* Modern Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-muted/30 rounded-2xl -z-10" />
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg ">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary-subtle">Employee Directory</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Browse and connect with your colleagues
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span>{filteredEmployees.length} employees</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filters */}
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getLocations().map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee, _index) => (
          <Card key={employee.id} className="card-hover border shadow-sm bg-card group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
                    <AvatarImage src={employee.profile_picture || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {employee.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">{employee.full_name}</CardTitle>
                  <CardDescription className="truncate text-sm">{employee.job_title}</CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleBadgeColor(employee.role)}>
                      {employee.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                    <User className="h-4 w-4" />
                  </div>
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>{employee.location}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Joined {new Date(employee.joining_date).toLocaleDateString()}</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    View Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Employee Profile</DialogTitle>
                    <DialogDescription>
                      View detailed information about this employee.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedEmployee && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-6">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={selectedEmployee.profile_picture || undefined} />
                          <AvatarFallback className="text-lg">
                            {selectedEmployee.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-2xl font-bold">{selectedEmployee.full_name}</h3>
                          <p className="text-lg text-muted-foreground">{selectedEmployee.job_title}</p>
                          <Badge className={getRoleBadgeColor(selectedEmployee.role)} variant="outline">
                            {selectedEmployee.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Contact Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{selectedEmployee.email}</span>
                              </div>
                              {selectedEmployee.phone && (
                                <div className="flex items-center">
                                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{selectedEmployee.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{selectedEmployee.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Work Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{selectedEmployee.department}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Joined {new Date(selectedEmployee.joining_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}