"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { appointmentService } from "@/lib/appointments"
import type { CreateAppointmentRequest } from "@/lib/appointments"
import { Calendar, Clock, AlertCircle, CheckCircle, Info } from "lucide-react"
import { useTranslations } from "next-intl"

interface AppointmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    appointment_date: "",
    notes: "",
  })
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDates, setLoadingDates] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    loadAvailableDates()
  }, [])

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true)
      setError("") // Clear previous errors
      
      // Get available dates for the next 30 days
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30)
      
      const startDateStr = today.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]
      
      const response = await appointmentService.getAvailableDates(startDateStr, endDateStr)
      console.log('Available dates from API:', response) // Debug log
      
      // The API should return the response in the format expected by handleResponse
      // Handle both direct array and wrapped response
      let dates = response
      if (response && typeof response === 'object' && 'data' in response) {
        dates = response.data
      }
      if (response && typeof response === 'object' && 'available_dates' in response) {
        dates = response.available_dates
      }
      
      // Ensure we always have an array
      setAvailableDates(Array.isArray(dates) ? dates : [])
    } catch (err) {
      console.error('Error loading available dates:', err)
      setError(t("appointments.form.errors.loadDates"))
      setAvailableDates([]) // Set to empty array on error
    } finally {
      setLoadingDates(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!formData.appointment_date) {
      setError(t("appointments.form.errors.selectDate"))
      return
    }

    try {
      setLoading(true)
      const newAppointment = await appointmentService.createAppointment(formData)
      console.log('Appointment created successfully:', newAppointment)
      setSuccess(true)
      
      // Redirect after 3 seconds to give user time to see the confirmation
      setTimeout(() => {
        onSuccess?.()
      }, 3000)
    } catch (err) {
      console.error('Appointment creation error:', err)
      
      let errorMessage = t("appointments.form.errors.createFailed")
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Handle specific backend error messages
        if (err.message.toLowerCase().includes('already has')) {
          errorMessage = t("appointments.form.errors.alreadyActive")
        } else if (err.message.toLowerCase().includes('date is full')) {
          errorMessage = t("appointments.form.errors.dateFull")
        } else if (err.message.toLowerCase().includes('invalid date')) {
          errorMessage = t("appointments.form.errors.invalidDate")
        }
      }
      
      setError(errorMessage)
      
      // If the error is about already having an appointment, refresh available dates
      if (errorMessage.includes('already has')) {
        loadAvailableDates()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setFormData((prev) => ({ ...prev, appointment_date: date }))
  }

  const getDisplayDates = () => {
    if (!Array.isArray(availableDates)) {
      return []
    }

    // Convert the available dates from API into display format
    return availableDates.map(dateStr => {
      const date = new Date(dateStr)
      return {
        date: dateStr,
        display: date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        available: true, // All dates from API are available
      }
    }).sort((a, b) => a.date.localeCompare(b.date)) // Sort by date
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white border-gray-200">
        <CardContent className="pt-6 bg-white">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t("appointments.form.success.title")}</h3>
              <p className="text-sm text-gray-600 mb-4">{t("appointments.form.success.body")}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{t("appointments.form.success.date")}: {new Date(formData.appointment_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
                {formData.notes && (
                  <p className="text-sm text-gray-600">{t("appointments.form.success.notes")}: {formData.notes}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4">{t("appointments.form.success.redirect")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border-gray-200">
      <CardHeader className="bg-white p-4 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg sm:text-xl">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <span>{t("appointments.form.header.title")}</span>
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm sm:text-base">
          {t("appointments.form.header.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Temporary debug section */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-xs bg-gray-100 p-2 rounded border border-gray-200">
              <summary className="cursor-pointer text-gray-700">Debug Error Info</summary>
              <pre className="mt-2 text-xs overflow-auto text-gray-900">
                Error: {error}
              </pre>
            </details>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {t("appointments.form.info")}
            </AlertDescription>
          </Alert>

          {/* Date Selection */}
          <div className="space-y-4">
            <Label className="text-gray-900 font-medium text-sm sm:text-base">{t("appointments.form.selectDateLabel")}</Label>

            {loadingDates ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">{t("appointments.form.loadingDates")}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 sm:max-h-80 overflow-y-auto">
                {getDisplayDates().length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-600">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-700 text-sm sm:text-base">{t("appointments.form.noDates")}</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                      onClick={loadAvailableDates}
                    >
                      {t("common.refresh")}
                    </Button>
                  </div>
                ) : (
                  getDisplayDates().map(({ date, display, available }) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => available && handleDateSelect(date)}
                    disabled={!available}
                    className={`p-3 sm:p-4 text-left rounded-lg border transition-colors bg-white ${
                      formData.appointment_date === date
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : available
                          ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{display}</p>
                        <p className="text-xs text-gray-500">{date}</p>
                      </div>
                      <div>
                        {available ? (
                          <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
{t("appointments.form.available")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
                            {t("appointments.form.full")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-900 font-medium text-sm sm:text-base">{t("appointments.form.notesLabel")}</Label>
            <Textarea
              id="notes"
              placeholder={t("appointments.form.notesPlaceholder")}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-2 text-sm sm:text-base" 
              disabled={loading || !formData.appointment_date}
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? t("appointments.form.booking") : t("appointments.form.bookAppointment")}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 sm:py-2 text-sm sm:text-base sm:min-w-[100px]"
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
