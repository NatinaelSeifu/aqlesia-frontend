"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { appointmentService } from "@/lib/appointments"
import type { Appointment } from "@/lib/appointments"
import { Calendar, User, Phone, Clock, CheckCircle, X, AlertCircle } from "lucide-react"
import { formatEthiopianDateCustom } from "@/lib/utils"

export function RecentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadRecentAppointments()
  }, [])

  const loadRecentAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getAllAppointments(1, 10)
      setAppointments(response.appointments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.completeAppointment(appointmentId)
      setAppointments(
        appointments.map((apt) => (apt.id === appointmentId ? { ...apt, status: "completed" as const } : apt)),
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
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <X className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{"Recent Appointments"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>{"Recent Appointments"}</span>
        </CardTitle>
        <CardDescription>{"Latest appointment bookings and updates"}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{"No appointments found"}</div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, 8).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {formatEthiopianDateCustom(appointment.appointment_date, { shortMonth: true })}
                    </span>
                    <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-xs">
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status}</span>
                      </span>
                    </Badge>
                  </div>

                  {appointment.user && (
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{`${appointment.user.name} ${appointment.user.lastname}`}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{appointment.user.phone_number}</span>
                      </div>
                    </div>
                  )}
                </div>

                {appointment.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteAppointment(appointment.id)}
                    className="text-success hover:text-success"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
