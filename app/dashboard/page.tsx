"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { User } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  const getWelcomeMessage = () => {
    if (user.role === "admin") {
      return "Manage your church operations and community engagement"
    } else if (user.role === "manager") {
      return "Coordinate appointments and support church community"
    } else {
      return "Manage your appointments and communion requests"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl bg-white">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-semibold mb-2 text-gray-900">Welcome back, {user.name}</h1>
              <p className="text-gray-600 text-lg">{getWelcomeMessage()}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />
      </main>
    </div>
  )
}
