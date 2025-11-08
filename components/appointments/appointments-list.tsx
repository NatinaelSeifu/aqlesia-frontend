"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { useTranslations } from "next-intl"

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
  const t = useTranslations()

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
      setError(err instanceof Error ? err.message : t("appointments.list.errors.loadFailed"))
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
      setError(err instanceof Error ? err.message : t("appointments.list.errors.cancelFailed"))
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
      setError(err instanceof Error ? err.message : t("appointments.list.errors.completeFailed"))
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
        <AlertDescription>{t("appointments.list.errors.noPermissionAll")}</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-700">{t("appointments.list.loading")}</span>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{showAllAppointments ? t("appointments.list.allTitle") : t("appointments.list.myTitle")}</h3>
        <Button 
          onClick={loadAppointments} 
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg self-start sm:self-auto"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t("common.refresh")}</span>
          <span className="sm:hidden">{t("common.reload")}</span>
        </Button>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mb-6">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t("appointments.list.empty.title")}</h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                {showAllAppointments
                  ? t("appointments.list.empty.descAll")
                  : t("appointments.list.empty.descMine")}
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Top section - Date and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex-shrink-0">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-base sm:text-lg">
                            {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {t("appointments.list.bookedOn")} {new Date(appointment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      {/* Status badge moved to top right */}
                      <Badge 
                        variant={getStatusBadgeVariant(getEffectiveStatus(appointment))} 
                        className={
                          getEffectiveStatus(appointment) === 'completed' 
                            ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-300 px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm"
                            : getEffectiveStatus(appointment) === 'cancelled'
                            ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-300 px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm"
                            : getEffectiveStatus(appointment) === 'overdue'
                            ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300 px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm"
                        }
                      >
                        <span className="flex items-center space-x-1 sm:space-x-1.5">
                          {getStatusIcon(getEffectiveStatus(appointment))}
                          <span className="capitalize font-medium">{getEffectiveStatus(appointment)}</span>
                        </span>
                      </Badge>
                    </div>

                    {/* Details section */}
                    <div className="space-y-2">
                      {/* Patient info for admin view */}
                      {showAllAppointments && appointment.user && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{`${appointment.user.name} ${appointment.user.lastname}`}</span>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{appointment.user.phone_number}</span>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {appointment.notes && (
                        <div className="flex items-start space-x-2 text-xs sm:text-sm">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 line-clamp-2" title={appointment.notes}>
                            {appointment.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions section */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => setSelectedAppointment(appointment)} 
                            className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-sm hover:shadow ring-1 ring-blue-400/30 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {t("appointments.list.view")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white max-w-md [&>button]:opacity-100 [&>button]:text-gray-500 [&>button:hover]:text-gray-700 [&>button]:bg-gray-100 [&>button:hover]:bg-gray-200 [&>button]:rounded-full [&>button]:p-1">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-purple-600" />
                              <span>{t("appointments.list.detailsTitle")}</span>
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
                          className="rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-sm hover:shadow ring-1 ring-green-400/30 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Complete</span>
                          <span className="sm:hidden">Done</span>
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
                          className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-sm hover:shadow ring-1 ring-red-400/30 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
            <div className="mt-6 sm:mt-8">
              <Pagination>
                <PaginationContent className="flex-wrap justify-center">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) handlePageChange(currentPage - 1)
                      }}
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // On mobile, show only current page and adjacent pages
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        return Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages
                      }
                      return true
                    })
                    .map((page, index, filteredPages) => {
                      // Add ellipsis for skipped pages on mobile
                      const showEllipsis = index > 0 && filteredPages[index - 1] !== page - 1
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-2 py-1 text-xs text-gray-400">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                              isActive={currentPage === page}
                              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${currentPage === page ? "bg-purple-100 text-purple-700 border-purple-200" : ""}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      )
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) handlePageChange(currentPage + 1)
                      }}
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Pagination Info */}
              <div className="text-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 px-2">
                <span className="hidden sm:inline">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, appointments.length)} to {Math.min(currentPage * itemsPerPage, appointments.length)} of {appointments.length} appointments
                </span>
                <span className="sm:hidden">
                  {currentPage} of {totalPages} pages ({appointments.length} total)
                </span>
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
