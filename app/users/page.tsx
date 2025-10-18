"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UsersList } from "@/components/users/users-list"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PERMISSIONS } from "@/lib/permissions"
import { Users, Settings } from "lucide-react"

export default function UsersPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <ProtectedRoute
      requiredPermission={PERMISSIONS.USERS_LIST}
      customMessage="You need admin or manager privileges to manage users."
    >
      <div className="min-h-screen bg-white">
        <DashboardHeader />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 bg-white">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">User Management</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Manage and monitor all registered users in the system</p>
          </div>
          <UsersList />
        </main>
      </div>
    </ProtectedRoute>
  )
}
