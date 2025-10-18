"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth"
import type { ChangePasswordRequest } from "@/lib/auth"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Shield, X } from "lucide-react"

interface ChangePasswordProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChangePassword({ onSuccess, onCancel }: ChangePasswordProps) {
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    current_password: "",
    new_password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    if (!formData.current_password.trim()) {
      setError("የአሁኑ ፓስወርድ ዘሩሪ")
      return
    }

    if (!formData.new_password.trim()) {
      setError("አዲስ ፓስወርድ ዘሩሪ")
      return
    }

    if (formData.new_password.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    if (formData.new_password !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (formData.current_password === formData.new_password) {
      setError("New password must be different from current password")
      return
    }

    try {
      setLoading(true)
      await authService.changePassword(formData)
      setSuccess(true)
      
      // Reset form
      setFormData({ current_password: "", new_password: "" })
      setConfirmPassword("")
      
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ChangePasswordRequest | "confirmPassword", value: string) => {
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
              <h3 className="text-xl font-semibold text-gray-900">Password Changed Successfully!</h3>
              <p className="text-gray-600 mt-2">Your password has been updated securely.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border-gray-200 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-gray-900 text-xl">Change Password</CardTitle>
            <CardDescription className="text-gray-600">
              Update your password to keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">የአሁኑ ፓስወርድ</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.current_password}
                onChange={(e) => handleChange("current_password", e.target.value)}
                placeholder="የአሁኑ ፓስወርድ ያስገቡ"
                className="pr-10 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password">አዲስ ፓስወርድ</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
                placeholder="አዲስ ፓስወርድ ያስገቡ"
                className="pr-10 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">አዲስ ፓስወርድ ያረጋግጡ</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="አዲስ ፓስወርድ ያረጋግጡ"
                className="pr-10 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
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

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium shadow-lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
