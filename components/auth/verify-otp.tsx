"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth"
import type { VerifyOTPRequest } from "@/lib/auth"
import {
  MessageCircle,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  RefreshCw,
} from "lucide-react"

interface VerifyOTPProps {
  phoneNumber: string
  onBack?: () => void
  onSuccess?: (resetToken: string) => void
  onResendOTP?: () => void
}

export function VerifyOTP({ phoneNumber, onBack, onSuccess, onResendOTP }: VerifyOTPProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes countdown
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== "") && newOtp.join("").length === 6) {
      handleSubmit(null, newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text")
    const digits = pasteData.replace(/\D/g, "").slice(0, 6)
    
    if (digits.length === 6) {
      const newOtp = digits.split("")
      setOtp(newOtp)
      // Auto-submit pasted OTP
      handleSubmit(null, digits)
    }
  }

  const handleSubmit = async (e: React.FormEvent | null, otpValue?: string) => {
    if (e) e.preventDefault()
    
    const otpString = otpValue || otp.join("")
    
    setError("")
    setSuccess(false)

    if (otpString.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    try {
      setLoading(true)
      const requestData: VerifyOTPRequest = {
        phone_number: phoneNumber,
        otp: otpString,
      }
      
      const response = await authService.verifyOTP(requestData)
      
      if (response.valid && response.reset_token) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.(response.reset_token!)
        }, 1000)
      } else {
        setError(response.message || "Invalid OTP")
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "OTP verification failed"
      setError(errorMessage)
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resending) return
    
    try {
      setResending(true)
      await onResendOTP?.()
      setTimeLeft(300) // Reset timer
      setOtp(["", "", "", "", "", ""]) // Clear current OTP
      setError("")
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError("Failed to resend OTP")
    } finally {
      setResending(false)
    }
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {"OTP Verified Successfully!"}
              </h3>
              <p className="text-gray-600">{"Redirecting to password reset..."}</p>
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
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {"Verify OTP"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {"Enter the 6-digit code sent to your Telegram"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Phone number display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {"Code sent to your Telegram"}
                </p>
                <p className="text-sm text-blue-800">{phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">{"6-Digit OTP"}</Label>
            <div className="flex justify-between space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-bold border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Countdown and resend */}
          <div className="text-center space-y-3">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-600">
                {"Code expires in"} <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600">{"Code has expired"}</p>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOTP}
              disabled={resending || timeLeft > 240} // Can resend after 1 minute
              className="text-indigo-600 hover:text-indigo-700"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {"Resending..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {"Resend OTP"}
                </>
              )}
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium py-3 shadow-lg"
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {"Verifying..."}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {"Verify OTP"}
              </>
            )}
          </Button>
        </form>

        {onBack && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-700 hover:underline font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1 inline" />
              {"Back"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
