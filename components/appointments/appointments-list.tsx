"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { appointmentService } from "@/lib/appointments"
import { PermissionService } from "@/lib/permissions"
import type { Appointment } from "@/lib/appointments"
import type { UserRole } from "@/lib/permissions"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, FileText, X, CheckCircle, AlertCircle, User, Phone, Eye, RefreshCw } from "lucide-react"

interface AppointmentsListProps {
  showAllAppointments?: boolean
}

export function AppointmentsList({ showAllAppointments = false }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  useEffect(() => {
    loadAppointments()
  }, [showAllAppointments])

  // Refresh appointments when page comes into focus (e.g., returning from booking)
  useEffect(() => {
    const handleFocus = () => {
      loadAppointments()
    }

    window.addEventListener('focus', handleFocus)
    
    // Also listen for visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAppointments()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError("") // Clear previous errors
      console.log('Loading appointments...', { showAllAppointments })
      
      const response = showAllAppointments
        ? await appointmentService.getAllAppointments()
        : await appointmentService.getMyAppointments()
      
      console.log('Appointments API response:', response)
      
      // Handle different response formats
      let appointmentsList = []
      if (Array.isArray(response)) {
        appointmentsList = response
      } else if (response && Array.isArray(response.appointments)) {
        appointmentsList = response.appointments
      } else if (response && response.data && Array.isArray(response.data)) {
        appointmentsList = response.data
      } else if (response && response.data && Array.isArray(response.data.appointments)) {
        appointmentsList = response.data.appointments
      }
      
      console.log('Processed appointments:', appointmentsList)
      setAppointments(appointmentsList)
    } catch (err) {
      console.error('Error loading appointments:', err)
      setError(err instanceof Error ? err.message : "Failed to load appointments")
      setAppointments([]) // Set to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return

    try {
      setCancelLoading(true)
      setError("")
      await appointmentService.cancelAppointment(appointmentToCancel.id)
      
      // Update the appointment status in the list
      setAppointments(
        (appointments || []).map((apt) => (apt.id === appointmentToCancel.id ? { ...apt, status: "cancelled" as const } : apt)),
      )
      
      // Show success message
      const appointmentDate = new Date(appointmentToCancel.appointment_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      setSuccess(`Appointment on ${appointmentDate} has been cancelled successfully.`)
      
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      setError(err instanceof Error ? err.message : "Failed to cancel appointment")
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      await appointmentService.completeAppointment(appointment.id)
      setAppointments(
        (appointments || []).map((apt) => (apt.id === appointment.id ? { ...apt, status: "completed" as const } : apt)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete appointment")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      case "overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <X className="h-4 w-4" />
      case "overdue":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const canCancelAppointment = (appointment: Appointment) => {
    // Only allow cancellation of pending appointments
    if (appointment.status !== "pending") return false
    
    // Allow cancellation if the appointment is in the future
    const appointmentDate = new Date(appointment.appointment_date)
    const today = new Date()
    
    // Set today to start of day for proper comparison
    today.setHours(0, 0, 0, 0)
    appointmentDate.setHours(0, 0, 0, 0)
    
    // Allow cancellation for today and future dates
    return appointmentDate >= today
  }

  const canCompleteAppointment = (appointment: Appointment) => {
    return appointment.status === "pending" && user && PermissionService.canCompleteAppointments(user.role as UserRole)
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

  // Pagination logic
  const paginatedAppointments = useMemo(() => {
    if (!appointments) return []
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return appointments.slice(startIndex, endIndex)
  }, [appointments, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    if (!appointments) return 0
    return Math.ceil(appointments.length / itemsPerPage)
  }, [appointments, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (showAllAppointments && user && !PermissionService.canViewAllAppointments(user.role as UserRole)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{"You don't have permission to view all appointments."}</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-700">Loading appointments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{showAllAppointments ? "All Appointments" : "My Appointments"}</h3>
        <Button 
          onClick={loadAppointments} 
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mb-6">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">No Appointments Found</h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                {showAllAppointments
                  ? "No appointments have been scheduled yet. When patients book appointments, they'll appear here."
                  : "You haven't scheduled any appointments yet. Click the 'Book New' tab to schedule your first appointment."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Appointments Grid */}
          <div className="grid gap-4 md:gap-6">
            {paginatedAppointments?.map((appointment) => (
              <Card 
                key={appointment.id} 
                className="border-gray-200 bg-white hover:shadow-md transition-all duration-200 hover:border-purple-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    {/* Left section - Date and Status */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            Booked on {new Date(appointment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle section - Status and Details */}
                    <div className="flex-1 md:mx-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={getStatusBadgeVariant(getEffectiveStatus(appointment))} 
                            className={
                              getEffectiveStatus(appointment) === 'completed' 
                                ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300 px-3 py-1"
                                : getEffectiveStatus(appointment) === 'cancelled'
                                ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-300 px-3 py-1"
                                : getEffectiveStatus(appointment) === 'overdue'
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300 px-3 py-1"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 px-3 py-1"
                            }
                          >
                            <span className="flex items-center space-x-1.5">
                              {getStatusIcon(getEffectiveStatus(appointment))}
                              <span className="capitalize font-medium">{getEffectiveStatus(appointment)}</span>
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Patient info for admin view */}
                        {showAllAppointments && appointment.user && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{`${appointment.user.name} ${appointment.user.lastname}`}</span>
                            <span className="text-gray-400">•</span>
                            <Phone className="h-4 w-4" />
                            <span>{appointment.user.phone_number}</span>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {appointment.notes && (
                          <div className="flex items-start space-x-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 line-clamp-2" title={appointment.notes}>
                              {appointment.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex items-center space-x-2 md:flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => setSelectedAppointment(appointment)} 
                            className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-sm hover:shadow ring-1 ring-blue-400/30"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white max-w-md [&>button]:opacity-100 [&>button]:text-gray-500 [&>button:hover]:text-gray-700 [&>button]:bg-gray-100 [&>button:hover]:bg-gray-200 [&>button]:rounded-full [&>button]:p-1">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-purple-600" />
                              <span>Appointment Details</span>
                            </DialogTitle>
                          </DialogHeader>
                          {selectedAppointment && (
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-700">Date & Time</label>
                                <p className="text-gray-900 font-semibold">
                                  {new Date(selectedAppointment.appointment_date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <div className="mt-1">
                                  <Badge 
                                    variant={getStatusBadgeVariant(getEffectiveStatus(selectedAppointment))} 
                                    className={
                                      getEffectiveStatus(selectedAppointment) === 'completed' 
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : getEffectiveStatus(selectedAppointment) === 'cancelled'
                                        ? "bg-red-100 text-red-800 border-red-300"
                                        : getEffectiveStatus(selectedAppointment) === 'overdue'
                                        ? "bg-orange-100 text-orange-800 border-orange-300"
                                        : "bg-blue-100 text-blue-800 border-blue-300"
                                    }
                                  >
                                    <span className="flex items-center space-x-1.5">
                                      {getStatusIcon(getEffectiveStatus(selectedAppointment))}
                                      <span className="capitalize">{getEffectiveStatus(selectedAppointment)}</span>
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                              {selectedAppointment.notes && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Notes</label>
                                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedAppointment.notes}</p>
                                </div>
                              )}
                              {showAllAppointments && selectedAppointment.user && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Patient Information</label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-900 font-medium">{`${selectedAppointment.user.name} ${selectedAppointment.user.lastname}`}</p>
                                    <p className="text-sm text-gray-600 flex items-center mt-1">
                                      <Phone className="h-4 w-4 mr-1" />
                                      {selectedAppointment.user.phone_number}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {canCompleteAppointment(appointment) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCompleteAppointment(appointment)}
                          className="rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-sm hover:shadow ring-1 ring-green-400/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      )}

                      {canCancelAppointment(appointment) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setAppointmentToCancel(appointment)
                            setCancelDialogOpen(true)
                          }}
                          className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-sm hover:shadow ring-1 ring-red-400/30"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) handlePageChange(currentPage - 1)
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page)
                        }}
                        isActive={currentPage === page}
                        className={currentPage === page ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) handlePageChange(currentPage + 1)
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Pagination Info */}
              <div className="text-center mt-4 text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, appointments.length)} to {Math.min(currentPage * itemsPerPage, appointments.length)} of {appointments.length} appointments
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Cancel Appointment</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to cancel this appointment? This action cannot be undone and you will need to book a new appointment if needed.
            </DialogDescription>
          </DialogHeader>
          {appointmentToCancel && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Date:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {new Date(appointmentToCancel.appointment_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {appointmentToCancel.notes && (
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                    <span className="text-sm font-medium text-gray-700">Notes:</span>
                    <span className="text-sm text-gray-900">{appointmentToCancel.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelLoading}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelAppointment}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
