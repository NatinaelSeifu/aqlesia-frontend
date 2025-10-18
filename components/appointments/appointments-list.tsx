"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No Appointments</h3>
              <p className="text-gray-600">
                {showAllAppointments
                  ? "No appointments have been scheduled yet."
                  : "You haven't scheduled any appointments yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900">Date</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                {showAllAppointments && <TableHead className="font-semibold text-gray-900">Patient</TableHead>}
                <TableHead className="font-semibold text-gray-900">Notes</TableHead>
                <TableHead className="font-semibold text-gray-900">Created</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map((appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span>
                        {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(appointment.status)} 
                      className={
                        appointment.status === 'completed' 
                          ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                          : appointment.status === 'cancelled'
                          ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                      }
                    >
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  {showAllAppointments && (
                    <TableCell className="text-gray-700">
                      {appointment.user ? (
                        <div>
                          <div className="font-medium">{`${appointment.user.name} ${appointment.user.lastname}`}</div>
                          <div className="text-sm text-gray-500">{appointment.user.phone_number}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="max-w-xs">
                    {appointment.notes ? (
                      <span className="text-gray-700 text-sm truncate block" title={appointment.notes}>
                        {appointment.notes.length > 50 ? `${appointment.notes.substring(0, 50)}...` : appointment.notes}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No notes</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {new Date(appointment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1.5">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedAppointment(appointment)} 
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900">Appointment Details</DialogTitle>
                          </DialogHeader>
                          {selectedAppointment && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Date</label>
                                <p className="text-gray-900">
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
                                <p className="capitalize text-gray-900">{selectedAppointment.status}</p>
                              </div>
                              {selectedAppointment.notes && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Notes</label>
                                  <p className="text-gray-900">{selectedAppointment.notes}</p>
                                </div>
                              )}
                              {showAllAppointments && selectedAppointment.user && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Patient</label>
                                  <p className="text-gray-900">{`${selectedAppointment.user.name} ${selectedAppointment.user.lastname}`}</p>
                                  <p className="text-sm text-gray-600">{selectedAppointment.user.phone_number}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {canCompleteAppointment(appointment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteAppointment(appointment)}
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                          title="Mark as Complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {canCancelAppointment(appointment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAppointmentToCancel(appointment)
                            setCancelDialogOpen(true)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                          title="Cancel Appointment"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Appointment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to cancel this appointment? This action cannot be undone and you will need to book a new appointment if needed.
            </DialogDescription>
          </DialogHeader>
          {appointmentToCancel && (
            <div className="py-4">
              <p className="text-sm text-gray-900">
                <strong>Date: </strong>
                {new Date(appointmentToCancel.appointment_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {appointmentToCancel.notes && (
                <p className="text-sm text-gray-900 mt-2">
                  <strong>Notes: </strong>
                  {appointmentToCancel.notes}
                </p>
              )}
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
                "Cancel Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
