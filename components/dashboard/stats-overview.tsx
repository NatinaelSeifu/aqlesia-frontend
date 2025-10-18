"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Users, Calendar, MessageSquare, TrendingUp, Clock, CheckCircle, User as UserIcon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { dashboardStatsService, type DashboardStats } from "@/lib/dashboard-stats"

interface StatItem {
  label: string
  value: string
  change: string
  icon: any
  bgColor: string
  iconColor: string
}

export function StatsOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        let dashboardStats: DashboardStats
        
        if (user.role === "admin") {
          dashboardStats = await dashboardStatsService.getAdminStats()
        } else if (user.role === "manager") {
          dashboardStats = await dashboardStatsService.getManagerStats()
        } else {
          dashboardStats = await dashboardStatsService.getUserStats()
        }
        
        setStats(dashboardStats)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        setStats({}) // Set empty stats on error
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (!user) return null
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6 border-gray-200 bg-white animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-200 ml-4"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const getStatsForRole = (): StatItem[] => {
    if (!stats) return []
    
    if (user.role === "admin") {
      return [
        {
          label: "Total Users",
          value: (stats.totalUsers || 0).toLocaleString(),
          change: "Registered users",
          icon: Users,
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
        },
        {
          label: "Pending Appointments",
          value: (stats.pendingAppointments || 0).toString(),
          change: "Awaiting review",
          icon: Calendar,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          label: "Communion Requests",
          value: (stats.communionRequests || 0).toString(),
          change: "Pending approval",
          icon: MessageSquare,
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
        },
        {
          label: "Total Appointments",
          value: (stats.totalAppointments || 0).toLocaleString(),
          change: "All time",
          icon: TrendingUp,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
      ]
    } else if (user.role === "manager") {
      return [
        {
          label: "My Appointments",
          value: (stats.userAppointments || 0).toString(),
          change: "Total bookings",
          icon: Calendar,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          label: "Pending Reviews",
          value: (stats.pendingAppointments || 0).toString(),
          change: "Awaiting action",
          icon: Clock,
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
        },
        {
          label: "Managed Users",
          value: (stats.managedUsers || 0).toString(),
          change: "Under management",
          icon: Users,
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
        },
        {
          label: "Completed",
          value: (stats.completedAppointments || 0).toString(),
          change: "Finished sessions",
          icon: CheckCircle,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
        },
      ]
    } else {
      return [
        {
          label: "My Appointments",
          value: (stats.userAppointments || 0).toString(),
          change: `${stats.pendingAppointments || 0} pending`,
          icon: Calendar,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          label: "Communion Requests",
          value: (stats.userCommunions || 0).toString(),
          change: `${stats.communionRequests || 0} approved`,
          icon: MessageSquare,
          bgColor: "bg-indigo-50",
          iconColor: "text-indigo-600",
        },
        {
          label: "Completed Sessions",
          value: (stats.completedAppointments || 0).toString(),
          change: "Finished appointments",
          icon: CheckCircle,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
        },
        {
          label: "Profile Status",
          value: "Active",
          change: "Account verified",
          icon: UserIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
      ]
    }
  }

  const statsItems = getStatsForRole()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsItems.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6 hover:shadow-lg transition-all duration-200 border-gray-200 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold mb-1 text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center ml-4`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
