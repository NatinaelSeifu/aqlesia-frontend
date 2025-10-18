"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth"
import type { ResetPasswordRequest } from "@/lib/auth"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, KeyRound, ShieldCheck } from "lucide-react"

interface ResetPasswordProps {
  token?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function ResetPassword({ token, onSuccess, onError }: ResetPasswordProps) {
  const [formData, setFormData] = useState<ResetPasswordRequest>({
    token: token || "",
    new_password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Update token if it changes
  useEffect(() => {
    if (token) {
      setFormData(prev => ({ ...prev, token }))
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setMessage("")

    // Validation
    if (!formData.token.trim()) {
      setError("No reset token provided")
      return
    }

    if (!formData.new_password.trim()) {
      setError("New password is required")
      return
    }

    if (formData.new_password.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    if (formData.new_password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      const response = await authService.resetPassword(formData)
      setSuccess(true)
      setMessage(response.message)
      
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Password reset failed"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ResetPasswordRequest | "confirmPassword", value: string) => {
    if (field === "confirmPassword") {
      setConfirmPassword(value)
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto border-gray-200 shadow-xl bg-white overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{"Password Reset Successful!"}</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">{"You can now login with your new password"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border-gray-200 shadow-xl bg-white overflow-hidden">
      <CardHeader className="text-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">{"Reset Password"}</CardTitle>
        <CardDescription className="text-gray-600">
          {"Enter your new secure password"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Token field (hidden or readonly for user info) */}
          {!token && (
            <div className="space-y-2">
              <Label htmlFor="token" className="text-gray-700 font-medium">{"ዳግም አስጀመሪያ ማስመሪያ"}</Label>
              <Input
                id="token"
                type="text"
                value={formData.token}
                onChange={(e) => handleChange("token", e.target.value)}
                placeholder="የዳግም አስጀመሪያ ማስመሪያን ያስገቡ"
                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-gray-700 font-medium">{"አዲስ ፓስወርድ"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="new_password"
                type={showPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
                placeholder="አዲስ ፓስወርድ ያስገቡ"
                className="pl-10 pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {"Password must be at least 6 characters long"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-gray-700 font-medium">{"አዲስ ፓስወርድ ያረጋግጡ"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="አዲስ ፓስወርድ ያረጋግጡ"
                className="pl-10 pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Security tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <KeyRound className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">{"ደህንነት ምክር"}</h4>
                <p className="text-blue-800 text-sm">
                  {"ጠንካራ ፓስወርድ የአሃዞች፣ ፊደሎች እና ልዩ ቁምፊዎችን ይይዛል"}
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 shadow-lg" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {"እየቀየረ ነው..."}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {"ፓስወርድ ዳግም አስጀምር"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
