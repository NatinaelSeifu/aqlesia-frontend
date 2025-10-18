"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ResetPassword } from "@/components/auth/reset-password"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError("No reset token provided. Please check your Telegram message for the reset link.")
    }
    setIsLoading(false)
  }, [searchParams])

  const handleSuccess = () => {
    router.push('/')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Show loading screen while parsing URL parameters
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Aqlesia</h1>
            </div>
            <p className="text-gray-600">{"Church Management System"}</p>
          </div>

          <Card className="border-gray-200 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading reset form...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Aqlesia</h1>
            </div>
            <p className="text-gray-600">{"Church Management System"}</p>
          </div>

          <Card className="border-red-200 shadow-xl bg-white">
            <CardContent className="p-8">
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/')}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                >
                  {"Back to Login"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Aqlesia</h1>
          </div>
          <p className="text-gray-600">{"Church Management System"}</p>
        </div>

        <ResetPassword 
          token={token || undefined}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  )
}
