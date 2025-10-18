"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { appointmentService } from "@/lib/appointments"
import { apiService } from "@/lib/api"
import type { AppointmentStatsResponse } from "@/lib/appointments"
import type { User } from "@/lib/auth"
import { FileText, Download, Calendar, Users, TrendingUp, AlertCircle } from "lucide-react"

export function AdminReports() {
  const [stats, setStats] = useState<AppointmentStatsResponse | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      const [statsData, usersData] = await Promise.all([
        appointmentService.getAppointmentStats(),
        apiService.getUsers(),
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports data")
    } finally {
      setLoading(false)
    }
  }

  const generateReport = (type: string) => {
    // In a real app, this would generate and download actual reports
    console.log(`Generating ${type} report...`)
  }

  const getUsersByRole = () => {
    const roleCount = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return roleCount
  }

  const getCompletionRate = () => {
    if (!stats || stats.total_appointments === 0) return 0
    return Math.round((stats.completed_appointments / stats.total_appointments) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  const roleCount = getUsersByRole()
  const completionRate = getCompletionRate()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{"Total Users"}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{"Registered users"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{"Completion Rate"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">{"Appointments completed"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{"Active Appointments"}</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_appointments || 0}</div>
            <p className="text-xs text-muted-foreground">{"Pending completion"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{"This Month"}</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_appointments || 0}</div>
            <p className="text-xs text-muted-foreground">{"Total appointments"}</p>
          </CardContent>
        </Card>
      </div>

      {/* User Roles Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>{"User Roles Distribution"}</span>
          </CardTitle>
          <CardDescription>{"Breakdown of users by role"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(roleCount).map(([role, count]) => (
              <div key={role} className="flex items-center space-x-2">
                <Badge variant={role === "admin" ? "destructive" : role === "manager" ? "default" : "secondary"}>
                  {role}
                </Badge>
                <span className="text-sm font-medium">{count} users</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{"Generate Reports"}</span>
          </CardTitle>
          <CardDescription>{"Download detailed reports for analysis"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 bg-transparent"
              onClick={() => generateReport("appointments")}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{"Appointments Report"}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">{"Detailed appointment history and statistics"}</p>
              <Download className="h-4 w-4 self-end" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 bg-transparent"
              onClick={() => generateReport("users")}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">{"Users Report"}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">{"User registration and activity data"}</p>
              <Download className="h-4 w-4 self-end" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 bg-transparent"
              onClick={() => generateReport("analytics")}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{"Analytics Report"}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">{"Performance metrics and trends"}</p>
              <Download className="h-4 w-4 self-end" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
