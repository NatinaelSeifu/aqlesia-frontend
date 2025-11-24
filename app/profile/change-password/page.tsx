"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect, useRouter } from "next/navigation"
import { ChangePassword } from "@/components/auth/change-password"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ChangePasswordPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

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
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 bg-white">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">{t("profile.changePassword.title")}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t("profile.changePassword.subtitle")}</p>
        </div>
        <ChangePassword 
          onSuccess={() => router.push("/profile?password_changed=true")} 
          onCancel={() => router.push("/profile")} 
        />
      </main>
    </div>
  )
}
