import { appointmentService } from "./appointments"
import { communionService } from "./communion"
import { apiService } from "./api"

export interface DashboardStats {
  totalUsers?: number
  pendingAppointments?: number
  communionRequests?: number
  completedAppointments?: number
  userAppointments?: number
  userCommunions?: number
  totalAppointments?: number
  managedUsers?: number
}

class DashboardStatsService {
  private async getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      throw new Error("Authentication failed")
    }

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Request failed"
      throw new Error(message)
    }

    return body?.data ?? body
  }

  async getAdminStats(): Promise<DashboardStats> {
    try {
      // Try to get stats, but handle permission errors gracefully
      const promises: Promise<any>[] = []
      
      // Always try to get appointment stats (should be available to admin)
      promises.push(
        appointmentService.getAppointmentStats().catch(() => ({ 
          total_appointments: 0, 
          pending_appointments: 0, 
          completed_appointments: 0 
        }))
      )
      
      // Try to get users count (should be available to admin)
      promises.push(
        apiService.getUsers(1, 1).catch(() => ({ total: 0 }))
      )
      
      // Try to get communion data (should be available to admin)
      promises.push(
        communionService.getPendingCommunions(1, 1).catch(() => ({ total: 0 }))
      )

      const [appointmentStats, usersData, communionData] = await Promise.all(promises)

      return {
        totalUsers: usersData.total || 0,
        pendingAppointments: appointmentStats.pending_appointments || 0,
        communionRequests: communionData.total || 0,
        totalAppointments: appointmentStats.total_appointments || 0,
        completedAppointments: appointmentStats.completed_appointments || 0,
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
      return {
        totalUsers: 0,
        pendingAppointments: 0,
        communionRequests: 0,
        totalAppointments: 0,
        completedAppointments: 0,
      }
    }
  }

  async getManagerStats(): Promise<DashboardStats> {
    try {
      const promises = [
        appointmentService.getMyAppointments(1, 100).catch(() => ({ appointments: [], total: 0 })),
        apiService.getUsers(1, 1).catch(() => ({ total: 0 })), // Manager can see user list
      ]

      const [myAppointments, usersData] = await Promise.all(promises)

      const pendingCount = myAppointments.appointments?.filter(apt => apt.status === 'pending').length || 0
      const completedCount = myAppointments.appointments?.filter(apt => apt.status === 'completed').length || 0

      return {
        userAppointments: myAppointments.total || 0,
        pendingAppointments: pendingCount,
        managedUsers: usersData.total || 0,
        completedAppointments: completedCount,
      }
    } catch (error) {
      console.error("Failed to fetch manager stats:", error)
      return {
        userAppointments: 0,
        pendingAppointments: 0,
        managedUsers: 0,
        completedAppointments: 0,
      }
    }
  }

  async getUserStats(): Promise<DashboardStats> {
    try {
      const promises = [
        appointmentService.getMyAppointments(1, 100).catch(() => ({ appointments: [], total: 0 })),
        communionService.getUserCommunions(1, 100).catch(() => ({ communions: [], total: 0 })),
      ]

      const [myAppointments, myCommunions] = await Promise.all(promises)

      const pendingAppointments = myAppointments.appointments?.filter(apt => apt.status === 'pending').length || 0
      const completedAppointments = myAppointments.appointments?.filter(apt => apt.status === 'completed').length || 0
      const approvedCommunions = myCommunions.communions?.filter(comm => comm.status === 'approved').length || 0

      return {
        userAppointments: myAppointments.total || 0,
        userCommunions: myCommunions.total || 0,
        pendingAppointments: pendingAppointments,
        completedAppointments: completedAppointments,
        communionRequests: approvedCommunions,
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
      return {
        userAppointments: 0,
        userCommunions: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        communionRequests: 0,
      }
    }
  }
}

export const dashboardStatsService = new DashboardStatsService()
