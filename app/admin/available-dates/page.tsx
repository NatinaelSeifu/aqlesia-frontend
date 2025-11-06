"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../hooks/use-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Switch } from "../../../components/ui/switch"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Users,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { availableDatesService, type AvailableDate, type CreateAvailableDate, type UpdateAvailableDate } from "../../../lib/available-dates"
import { format, addDays, startOfWeek, endOfWeek } from "date-fns"
import { formatEthiopianDate, formatEthiopianDateCustom } from "../../../lib/utils"

export default function AdminAvailableDatesPage() {
  const { user, loading } = useAuth()
  
  // State management
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [loadingDates, setLoadingDates] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pageError, setPageError] = useState<string | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null)
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateAvailableDate>({
    slot_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    max_capacity: 10,
    is_active: true
  })
  const [editForm, setEditForm] = useState<UpdateAvailableDate>({})
  
  // Date range for viewing
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfWeek(addDays(new Date(), 30)), 'yyyy-MM-dd'))
  const [includeInactive, setIncludeInactive] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
    
    if (!loading && user && user.role !== "admin" && user.role !== "manager") {
      redirect("/dashboard")
    }
  }, [user, loading])

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "manager")) {
      loadAvailableDates()
    }
  }, [user, startDate, endDate, includeInactive])

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true)
      setError("")
      setPageError(null)
      
      console.log('Loading available dates for role:', user?.role)
      const dates = await availableDatesService.getAvailableDates({
        start_date: startDate,
        end_date: endDate,
        include_inactive: includeInactive,
      })
      console.log('Available dates response:', dates)
      setAvailableDates(dates)
    } catch (err) {
      console.error('Failed to load available dates:', err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load available dates"
      
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setPageError(`Access denied: You don't have permission to view available dates. Role: ${user?.role}`)
      } else {
        setPageError(`Failed to load available dates: ${errorMessage}`)
        setError(errorMessage)
      }
    } finally {
      setLoadingDates(false)
    }
  }

  const handleCreateDate = async () => {
    try {
      setError("")
      await availableDatesService.createAvailableDate(createForm)
      setSuccess("Available date created successfully!")
      setTimeout(() => setSuccess(""), 3000)
      setCreateDialogOpen(false)
      setCreateForm({
        slot_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        max_capacity: 10,
        is_active: true
      })
      loadAvailableDates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create available date")
    }
  }

  const handleEditDate = async () => {
    if (!selectedDate) return
    
    try {
      setError("")
      const dateStr = format(new Date(selectedDate.slot_date), 'yyyy-MM-dd')
      await availableDatesService.updateAvailableDate(dateStr, editForm)
      setSuccess("Available date updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
      setEditDialogOpen(false)
      setSelectedDate(null)
      setEditForm({})
      loadAvailableDates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update available date")
    }
  }

  const handleDeleteDate = async (date: AvailableDate) => {
    try {
      setError("")
      const dateStr = format(new Date(date.slot_date), 'yyyy-MM-dd')
      await availableDatesService.deleteAvailableDate(dateStr)
      setSuccess("Available date deleted successfully!")
      setTimeout(() => setSuccess(""), 3000)
      loadAvailableDates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete available date")
    }
  }

  const openEditDialog = (date: AvailableDate) => {
    setSelectedDate(date)
    setEditForm({
      max_capacity: date.max_capacity,
      is_active: date.is_active,
    })
    setEditDialogOpen(true)
  }

  const getStatusBadge = (date: AvailableDate) => {
    if (!date.is_active) {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300">
          <EyeOff className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      )
    }
    
    if (date.available_spots === 0) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Full
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Available
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) return null
  
  if (pageError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Page Error</h1>
          <p className="text-gray-600 mb-4">{pageError}</p>
          <p className="text-sm text-gray-500">User Role: {user?.role}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 bg-white">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-slate-800">Available Dates Management</h2>
          <p className="text-blue-600 max-w-2xl mx-auto">Manage appointment availability dates and capacity for the church scheduling system</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-blue-900">Total Dates</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{availableDates.length}</div>
              <p className="text-sm text-blue-700 mt-1">Available appointment dates</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-green-900">Active Dates</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {availableDates.filter(d => d.is_active).length}
              </div>
              <p className="text-sm text-green-700 mt-1">Currently active</p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-amber-900">Total Capacity</CardTitle>
              <div className="p-2 bg-amber-200 rounded-lg">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">
                {availableDates.reduce((sum, d) => sum + (d.is_active ? d.max_capacity : 0), 0)}
              </div>
              <p className="text-sm text-amber-700 mt-1">Total appointment slots</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold text-purple-900">Booked</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Clock className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {availableDates.reduce((sum, d) => sum + d.current_bookings, 0)}
              </div>
              <p className="text-sm text-purple-700 mt-1">Currently booked slots</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8 border-blue-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div>
                  <Label htmlFor="start_date" className="text-sm font-medium text-blue-700">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-blue-500 text-black placeholder:text-blue-500 rounded-lg px-3 py-2 shadow-sm"
                    style={{
                      colorScheme: 'none',
                      accentColor: '#3b82f6',
                      backgroundColor: 'white',
                      color: 'black'
                    }}
                  />
                  <p className="mt-1 text-xs text-blue-600">
                    {formatEthiopianDateCustom(startDate, { shortMonth: true })}
                  </p>
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-sm font-medium text-blue-700">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-blue-500 text-black placeholder:text-blue-500 rounded-lg px-3 py-2 shadow-sm"
                    style={{
                      colorScheme: 'none',
                      accentColor: '#3b82f6',
                      backgroundColor: 'white',
                      color: 'black'
                    }}
                  />
                  <p className="mt-1 text-xs text-blue-600">
                    {formatEthiopianDateCustom(endDate, { shortMonth: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include_inactive"
                    checked={includeInactive}
                    onCheckedChange={setIncludeInactive}
                  />
                  <Label htmlFor="include_inactive" className="text-sm font-medium text-blue-700">
                    Include Inactive
                  </Label>
                </div>
                
                <Button 
                  onClick={loadAvailableDates} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingDates ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Date
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-slate-800">Create Available Date</DialogTitle>
                      <DialogDescription className="text-blue-600">
                        Add a new date for appointment booking.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="create_date" className="text-sm font-medium text-blue-700">Date (Gregorian)</Label>
                        <Input
                          id="create_date"
                          type="date"
                          value={createForm.slot_date}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, slot_date: e.target.value }))}
                          className="mt-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-blue-500 text-black placeholder:text-blue-500 rounded-lg px-3 py-2 shadow-sm"
                          style={{
                            colorScheme: 'none',
                            accentColor: '#3b82f6',
                            backgroundColor: 'white',
                            color: 'black'
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                        {createForm.slot_date && (
                          <p className="mt-2 text-sm text-blue-700 font-medium">
                            📅 Ethiopian: {formatEthiopianDate(createForm.slot_date, 'long')}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="create_capacity" className="text-sm font-medium text-blue-700">Max Capacity</Label>
                        <Input
                          id="create_capacity"
                          type="number"
                          min="1"
                          max="100"
                          value={createForm.max_capacity}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))}
                          className="mt-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-blue-500 text-black placeholder:text-blue-500 rounded-lg px-3 py-2 shadow-sm"
                          style={{
                            colorScheme: 'none',
                            accentColor: '#3b82f6',
                            backgroundColor: 'white',
                            color: 'black'
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="create_active"
                          checked={createForm.is_active}
                          onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="create_active" className="text-sm font-medium text-blue-700">
                          Active immediately
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="bg-white text-blue-700 hover:bg-blue-50 border-2 border-blue-300 rounded-lg">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDate} className="bg-green-600 hover:bg-green-700 text-white">
                        Create Date
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Dates Table */}
        <Card className="border-blue-200 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-slate-800 text-xl">Available Appointment Dates</CardTitle>
                <CardDescription className="text-blue-600">
                  Manage appointment availability and capacity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingDates ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white border border-blue-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 border-b border-blue-200">
                      <TableHead className="font-semibold text-slate-800">Date</TableHead>
                      <TableHead className="font-semibold text-slate-800">Max Capacity</TableHead>
                      <TableHead className="font-semibold text-slate-800">Current Bookings</TableHead>
                      <TableHead className="font-semibold text-slate-800">Available Spots</TableHead>
                      <TableHead className="font-semibold text-slate-800">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableDates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                          <div className="text-slate-600 text-lg font-medium mb-2">No available dates found</div>
                          <div className="text-blue-400">Try adjusting your date range or filters</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableDates.map((date) => (
                        <TableRow key={date.id} className="hover:bg-blue-50 transition-colors border-b border-blue-100">
                          <TableCell className="font-medium text-slate-800">
                            {formatEthiopianDate(date.slot_date, 'long')}
                          </TableCell>
                          <TableCell className="text-slate-700">{date.max_capacity}</TableCell>
                          <TableCell className="text-slate-700">{date.current_bookings}</TableCell>
                          <TableCell className="text-slate-700">{date.available_spots}</TableCell>
                          <TableCell>
                            {getStatusBadge(date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(date)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md"
                                title="Edit Date"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                    title="Delete Date"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">Delete Available Date</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-600">
                                      Are you sure you want to delete this available date? This action cannot be undone.
                                      {date.current_bookings > 0 && (
                                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                                          <strong className="text-amber-800">Warning:</strong> This date has {date.current_bookings} active booking(s).
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-blue-300 text-blue-700 hover:bg-blue-50">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteDate(date)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Edit Available Date</DialogTitle>
              <DialogDescription className="text-blue-600">
                Update the capacity or status for {selectedDate && formatEthiopianDate(selectedDate.slot_date, 'short')}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_capacity" className="text-sm font-medium text-blue-700">Max Capacity</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={editForm.max_capacity || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || undefined }))}
                  className="mt-1 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-blue-500 text-black placeholder:text-blue-500 rounded-lg px-3 py-2 shadow-sm"
                  style={{
                    colorScheme: 'none',
                    accentColor: '#3b82f6',
                    backgroundColor: 'white',
                    color: 'black'
                  }}
                />
                {selectedDate && editForm.max_capacity && editForm.max_capacity < selectedDate.current_bookings && (
                  <p className="text-sm text-red-600 mt-1">
                    Cannot set capacity below current bookings ({selectedDate.current_bookings})
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_active"
                  checked={editForm.is_active ?? false}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="edit_active" className="text-sm font-medium text-blue-700">
                  Active for booking
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Cancel
              </Button>
              <Button 
                onClick={handleEditDate} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={selectedDate && editForm.max_capacity && editForm.max_capacity < selectedDate.current_bookings}
              >
                Update Date
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
