"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect, useSearchParams } from "next/navigation"
import { UserProfile } from "@/components/users/user-profile"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CheckCircle, User, Settings } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import Link from "next/link"
import { translations } from "@/lib/translations"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
  }, [user, loading])

  useEffect(() => {
    // Check if password was changed successfully
    if (searchParams.get('password_changed') === 'true') {
      setShowPasswordSuccess(true)
      setTimeout(() => setShowPasswordSuccess(false), 5000)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 bg-white">
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">{translations.profile.profileSettings}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{translations.profile.updatePersonalInfo}</p>
          </div>
          <div className="flex justify-center">
            <Link href="/profile/change-password">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg">
                <Lock className="h-4 w-4 mr-2" />
                {translations.profile.changePassword}
              </Button>
            </Link>
          </div>
        </div>
        {showPasswordSuccess && (
          <div className="mb-8 max-w-2xl mx-auto">
            <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-800 shadow-lg">
              <div className="p-2 bg-green-200 rounded-lg inline-flex">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
              <AlertDescription className="ml-3 text-green-800 font-medium">
                {translations.profile.passwordChanged}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <UserProfile />
      </main>
    </div>
  )
}
