"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/admin/stats-cards"
import { RecentAppointments } from "@/components/admin/recent-appointments"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { AdminReports } from "@/components/admin/admin-reports"
import { AppointmentsList } from "@/components/appointments/appointments-list"
import { UsersList } from "@/components/users/users-list"
import { PERMISSIONS } from "@/lib/permissions"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const t = useTranslations()

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
  }, [user, loading])

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentAppointments />
              <div className="space-y-6">
                <AdminNavigation activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </div>
          </div>
        )
      case "appointments":
        return <AppointmentsList showAllAppointments={true} />
      case "users":
        return <UsersList />
      case "reports":
        return (
          <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_REPORTS}>
            <AdminReports />
          </ProtectedRoute>
        )
      case "settings":
        return (
          <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_SETTINGS}>
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("admin.settings.title")}</h3>
              <p className="text-muted-foreground">{t("admin.settings.desc")}</p>
            </div>
          </ProtectedRoute>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute
      requiredPermission={PERMISSIONS.ADMIN_PANEL}
      customMessage="You need admin or manager privileges to access the admin panel."
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.backToDashboard")}
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">{t("common.adminPanel")}</h1>
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{`${user.name} ${user.lastname}`}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex space-x-8 overflow-x-auto">
              {[
                { id: "overview", label: t("admin.tabs.overview") },
                { id: "appointments", label: t("admin.tabs.appointments") },
                { id: "users", label: t("admin.tabs.users") },
                { id: "reports", label: t("admin.tabs.reports") },
                { id: "settings", label: t("admin.tabs.settings") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">{renderTabContent()}</main>
      </div>
    </ProtectedRoute>
  )
}
