"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { appointmentService } from "@/lib/appointments"
import type { AppointmentStatsResponse } from "@/lib/appointments"
import { Calendar, Clock, CheckCircle, X, AlertCircle } from "lucide-react"

export function StatsCards() {
  const [stats, setStats] = useState<AppointmentStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await appointmentService.getAppointmentStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) return null

  const statsData = [
    {
      title: "Total Appointments",
      value: stats.total_appointments,
      description: "All time appointments",
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Pending",
      value: stats.pending_appointments,
      description: "Awaiting completion",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Completed",
      value: stats.completed_appointments,
      description: "Successfully completed",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Cancelled",
      value: stats.cancelled_appointments,
      description: "Cancelled appointments",
      icon: X,
      color: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
