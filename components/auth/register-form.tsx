"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { User, Phone, Lock, AlertCircle, CheckCircle, UserPlus } from "lucide-react"

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone_number: "",
    password: "",
    telegram_id: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { register, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    try {
      await register(formData)
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{"Registration Successful!"}</h3>
              <p className="text-gray-600 mt-2">{"Your account has been created. You can now sign in."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
      <CardHeader className="text-center bg-transparent border-b-0">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">{"Create Account"}</CardTitle>
        <CardDescription className="text-gray-600">{"Join Aqlesia church management system"}</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">{"ስም"}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="name"
                  placeholder="ስም"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-10 bg-transparent border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-gray-700 font-medium">{"ክ/ስም"}</Label>
              <Input
                id="lastname"
                placeholder="ክ/ስም"
                value={formData.lastname}
                onChange={(e) => handleChange("lastname", e.target.value)}
                className="bg-transparent border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700 font-medium">{"ስልክ"}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="phone"
                type="tel"
                placeholder="+251912345678 or 0912345678"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                className="pl-10 bg-transparent border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">{"ፓስወርድ"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="password"
                type="password"
                placeholder="ፓስወርድ ይፍጠሩ"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="pl-10 bg-transparent border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
          </div>


          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 shadow-lg" 
            disabled={loading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {"Already have an account? "}
            <button type="button" onClick={onSwitchToLogin} className="text-green-600 hover:text-green-700 hover:underline font-medium transition-colors">
              {"Sign in"}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
