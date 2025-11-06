"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../hooks/use-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/table"
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
  Eye,
  Trash2,
  Search,
  Phone,
  User,
  AlertCircle
} from "lucide-react"
import { DashboardHeader } from "../../../components/dashboard/dashboard-header"
import { useToast } from "../../../components/ui/use-toast"
import { appointmentService } from "../../../lib/appointments"
import type { Appointment } from "../../../lib/appointments"
import { format } from "date-fns"
import { formatEthiopianDate, formatEthiopianDateCustom } from "../../../lib/utils"

export default function AdminAppointmentsPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  
  // Add state for page-level errors
  const [pageError, setPageError] = useState<string | null>(null)
  
  // State management
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([])
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingPending, setLoadingPending] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
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
      loadAllAppointments()
      loadPendingAppointments()
    }
  }, [user])

  const loadAllAppointments = async () => {
    try {
      setLoadingAll(true)
      setPageError(null)
      
      console.log('Loading appointments for role:', user?.role)
      const appointments = await appointmentService.getAllAppointments()
      console.log('Appointments response:', appointments)
      
      // Handle different response formats
      let appointmentsList = []
      if (Array.isArray(appointments)) {
        appointmentsList = appointments
      } else if (appointments && Array.isArray(appointments.appointments)) {
        appointmentsList = appointments.appointments
      } else if (appointments && appointments.data && Array.isArray(appointments.data)) {
        appointmentsList = appointments.data
      }
      setAllAppointments(appointmentsList)
    } catch (error) {
      console.error('Failed to load all appointments:', error)
      const errorMessage = error instanceof Error ? error.message : "Please try again later"
      
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setPageError(`Access denied: You don't have permission to view appointments. Role: ${user?.role}`)
      } else {
        setPageError(`Failed to load appointments: ${errorMessage}`)
      }
      
      toast({
        title: "Failed to load appointments",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoadingAll(false)
    }
  }

  const loadPendingAppointments = async () => {
    try {
      setLoadingPending(true)
      const appointments = await appointmentService.getAllAppointments()
      // Handle different response formats and filter for pending
      let appointmentsList = []
      if (Array.isArray(appointments)) {
        appointmentsList = appointments
      } else if (appointments && Array.isArray(appointments.appointments)) {
        appointmentsList = appointments.appointments
      } else if (appointments && appointments.data && Array.isArray(appointments.data)) {
        appointmentsList = appointments.data
      }
      
      // Filter for pending appointments (including overdue ones)
      const pendingList = appointmentsList.filter(apt => apt.status === 'pending')
      setPendingAppointments(pendingList)
    } catch (error) {
      console.error('Failed to load pending appointments:', error)
      toast({
        title: "Failed to load pending appointments",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setLoadingPending(false)
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId)
      await appointmentService.completeAppointment(appointmentId)
      
      toast({
        title: "Appointment completed",
        description: "The appointment has been marked as completed successfully.",
        variant: "default"
      })
      
      // Reload data
      loadAllAppointments()
      loadPendingAppointments()
    } catch (error) {
      console.error('Failed to complete appointment:', error)
      toast({
        title: "Failed to complete appointment",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId)
      await appointmentService.cancelAppointment(appointmentId)
      
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
        variant: "default"
      })
      
      // Reload data
      loadAllAppointments()
      loadPendingAppointments()
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      toast({
        title: "Failed to cancel appointment",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Overdue logic
  const isOverdue = (appointment: Appointment) => {
    if (appointment.status !== "pending") return false
    const appointmentDate = new Date(appointment.appointment_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    appointmentDate.setHours(0, 0, 0, 0)
    return appointmentDate < today
  }

  const getEffectiveStatus = (appointment: Appointment): string => {
    return isOverdue(appointment) ? "overdue" : appointment.status
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">Cancelled</Badge>
      case 'overdue':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">Overdue</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredAllAppointments = allAppointments.filter(appointment =>
    appointment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.user?.phone_number?.includes(searchTerm) ||
    appointment.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEffectiveStatus(appointment).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPendingAppointments = pendingAppointments.filter(appointment =>
    appointment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.user?.phone_number?.includes(searchTerm) ||
    getEffectiveStatus(appointment).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const AppointmentTable = ({ 
    appointments, 
    loading, 
    showActions = true 
  }: { 
    appointments: Appointment[], 
    loading: boolean,
    showActions?: boolean 
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">User</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px]">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Phone</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">Date</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[80px]">Status</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px] hidden sm:table-cell">Booked At</TableHead>
            {showActions && <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-gray-700">Loading...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium mb-2">No appointments found</div>
                <div className="text-gray-400">Try refreshing or check back later</div>
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                <TableCell className="font-medium text-gray-900 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{appointment.user?.name || 'Unknown User'}</p>
                    {appointment.user?.lastname && (
                      <p className="truncate text-gray-600 text-xs">{appointment.user.lastname}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-700 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{appointment.user?.phone_number || 'N/A'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate">
                      {formatEthiopianDateCustom(appointment.appointment_date, { shortMonth: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`text-xs ${
                      getEffectiveStatus(appointment) === 'completed' 
                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                        : getEffectiveStatus(appointment) === 'cancelled'
                        ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                        : getEffectiveStatus(appointment) === 'overdue'
                        ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      {getEffectiveStatus(appointment) === 'completed' ? (
                        <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : getEffectiveStatus(appointment) === 'cancelled' ? (
                        <XCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : getEffectiveStatus(appointment) === 'overdue' ? (
                        <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : (
                        <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                      )}
                      <span className="capitalize text-xs">{getEffectiveStatus(appointment)}</span>
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 text-xs hidden sm:table-cell">
                  {formatEthiopianDateCustom(appointment.created_at, { shortMonth: true })}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {appointment.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={actionLoading === appointment.id}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                                title="Mark as Complete"
                              >
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Complete Appointment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to mark this appointment as completed for {appointment.user?.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCompleteAppointment(appointment.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Complete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={actionLoading === appointment.id}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                title="Cancel Appointment"
                              >
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this appointment for {appointment.user?.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Appointment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null
  
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
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-white">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Appointment Management</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">Review, manage, and track all appointment requests from church members</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-purple-900">Total Appointments</CardTitle>
              <div className="p-1.5 sm:p-2 bg-purple-200 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-purple-900">{allAppointments.length}</div>
              <p className="text-xs sm:text-sm text-purple-700 mt-1">All appointments</p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-amber-900">Pending & Overdue</CardTitle>
              <div className="p-1.5 sm:p-2 bg-amber-200 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-amber-900">{pendingAppointments.length}</div>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                {pendingAppointments.filter(apt => isOverdue(apt)).length} overdue, {pendingAppointments.filter(apt => !isOverdue(apt)).length} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-green-900">Completed Today</CardTitle>
              <div className="p-1.5 sm:p-2 bg-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-green-900">
                {allAppointments.filter(a => 
                  a.status === 'completed' && 
                  format(new Date(a.appointment_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </div>
              <p className="text-xs sm:text-sm text-green-700 mt-1">Completed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 sm:mb-8 border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3 sm:p-6 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <Tabs defaultValue="pending">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="bg-transparent border-none p-3 sm:p-6 w-full">
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                >
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">Pending Appointments ({filteredPendingAppointments.length})</span>
                  <span className="sm:hidden">Pending ({filteredPendingAppointments.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 ml-2 sm:ml-3 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">All Appointments ({filteredAllAppointments.length})</span>
                  <span className="sm:hidden">All ({filteredAllAppointments.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="pending" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Pending Appointments</h3>
                <Button 
                  onClick={loadPendingAppointments} 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPending ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            
              <AppointmentTable 
                appointments={filteredPendingAppointments} 
                loading={loadingPending}
                showActions={true}
              />
            </TabsContent>
          
            <TabsContent value="all" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">All Appointments</h3>
                <Button 
                  onClick={loadAllAppointments} 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAll ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
              
              <AppointmentTable 
                appointments={filteredAllAppointments} 
                loading={loadingAll}
                showActions={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
