"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect, useSearchParams } from "next/navigation"
import { AppointmentsList } from "@/components/appointments/appointments-list"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Calendar, Plus, User } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function AppointmentsPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const refreshKey = searchParams.get('refresh') || ''
  const [activeTab, setActiveTab] = useState("book")

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
  }, [user, loading])

  const handleBookingSuccess = () => {
    // Switch to list tab and trigger refresh
    setActiveTab("list")
    // Force a refresh of the appointments list
    window.location.href = "/appointments?refresh=" + Date.now()
  }

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
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-white">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Appointments</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">Book new appointments and manage your scheduled ones</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="bg-transparent border-none p-3 sm:p-6 w-full justify-center sm:justify-start">
                <TabsTrigger 
                  value="book"
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 hover:bg-gray-100 transition-colors flex-1 sm:flex-initial"
                  style={{}}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">Book New</span>
                  <span className="sm:hidden">Book</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 ml-2 sm:ml-3 hover:bg-gray-100 transition-colors flex-1 sm:flex-initial"
                  style={{}}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">My Appointments</span>
                  <span className="sm:hidden">My Apps</span>
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="book" className="p-3 sm:p-6 bg-white">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Schedule New Appointment</h3>
                <p className="text-sm sm:text-base text-gray-700">Choose an available date and book your appointment</p>
              </div>
              <AppointmentForm 
                onSuccess={handleBookingSuccess}
                onCancel={() => setActiveTab("list")}
              />
            </TabsContent>
          
            <TabsContent value="list" className="p-3 sm:p-6 bg-white">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your Scheduled Appointments</h3>
                <p className="text-sm sm:text-base text-gray-700">View and track the status of your appointments</p>
              </div>
              <AppointmentsList key={refreshKey} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
