"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth"
import type { TelegramLinkRequest } from "@/lib/auth"
import { Phone, AlertCircle, CheckCircle, MessageCircle, ArrowLeft, Copy, ExternalLink, Info } from "lucide-react"

interface TelegramLinkProps {
  phoneNumber?: string
  onBack?: () => void
  onSuccess?: () => void
  onReturnToForgotPassword?: () => void
}

export function TelegramLink({ phoneNumber, onBack, onSuccess, onReturnToForgotPassword }: TelegramLinkProps) {
  const [formData, setFormData] = useState<TelegramLinkRequest>({
    phone_number: phoneNumber || "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [linkResponse, setLinkResponse] = useState<{
    link_code: string
    telegram_url: string
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationMessage, setVerificationMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLinkResponse(null)

    if (!formData.phone_number.trim()) {
      setError("ስልክ ሰክ ዘሩሪ")
      return
    }

    try {
      setLoading(true)
      const response = await authService.linkTelegram(formData)
      setSuccess(true)
      setLinkResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link Telegram")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof TelegramLinkRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyCode = async () => {
    if (linkResponse?.link_code) {
      try {
        await navigator.clipboard.writeText(linkResponse.link_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }
  }

  const handleOpenTelegram = () => {
    if (linkResponse?.telegram_url) {
      window.open(linkResponse.telegram_url, '_blank')
    }
  }

  const handleCheckVerification = async () => {
    if (!formData.phone_number.trim()) {
      setError("ስልክ ሰክ ዘሩሪ")
      return
    }

    try {
      setCheckingVerification(true)
      setError("")
      setVerificationMessage("")
      
      // Use the proper verification check endpoint that doesn't send OTP
      const response = await authService.checkTelegramVerification({ phone_number: formData.phone_number })
      
      setIsVerified(response.verified)
      setVerificationMessage(response.message)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification check failed"
      setError(errorMessage)
      setIsVerified(false)
      setVerificationMessage("Failed to check verification status. Please try again.")
    } finally {
      setCheckingVerification(false)
    }
  }

  if (success && linkResponse) {
    return (
      <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
        <CardHeader className="text-center bg-transparent border-b-0">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{"Link Telegram"}</CardTitle>
          <CardDescription className="text-gray-600">
            {"Use this code with the Telegram bot"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{"Link Code Generated"}</h3>
            </div>

            {/* Link Code */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">{"Link Code"}</Label>
              <div className="flex items-center justify-between bg-white border border-gray-300 rounded-md p-3">
                <code className="text-lg font-mono text-blue-600 font-semibold">
                  {linkResponse.link_code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className={copied ? "border-green-500 text-green-600" : ""}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">{"How to Link"}</h4>
                  <ol className="text-blue-800 text-sm space-y-2">
                    <li>{"1. Click 'Open Telegram' to start a chat with our bot"}</li>
                    <li>{"2. Send the link code above to the bot"}</li>
                    <li>{"3. The bot will verify and link your account"}</li>
                    <li>{"4. Use 'Check if Linked' to confirm the connection"}</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            {verificationMessage && (
              <div className={`border rounded-lg p-4 ${
                isVerified === true
                  ? 'bg-green-50 border-green-200'
                  : isVerified === false
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start">
                  {isVerified === true ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  ) : isVerified === false ? (
                    <Info className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    isVerified === true
                      ? 'text-green-800'
                      : isVerified === false
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}>
                    {verificationMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleOpenTelegram}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 shadow-lg"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {"Open Telegram"}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              <Button
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                variant="outline"
                className="w-full border-green-500 text-green-700 hover:bg-green-50"
              >
                {checkingVerification ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    {"Checking..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {"Check if Linked"}
                  </>
                )}
              </Button>

              {isVerified && onReturnToForgotPassword && (
                <Button
                  onClick={onReturnToForgotPassword}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {"Return to Password Reset"}
                </Button>
              )}

              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  className="w-full text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {"Go Back"}
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                {"Code expires in 5 minutes"}
              </p>
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
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">{"Link Telegram"}</CardTitle>
        <CardDescription className="text-gray-600">
          {"Link Telegram to receive password reset links"}
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

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700 font-medium">{"ስልክ"}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="phone"
                type="tel"
                placeholder="+251912345678 ወይም 0912345678"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                className="pl-10 bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Why Telegram is needed */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">{"Why Telegram?"}</h4>
                <p className="text-blue-800 text-sm">
                  {"Linking Telegram allows you to securely receive OTP codes for password reset. This provides an extra layer of security for your account."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 shadow-lg" 
              disabled={loading}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {loading ? "Connecting..." : "Generate Telegram Link Code"}
            </Button>

            <Button
              type="button"
              onClick={handleCheckVerification}
              disabled={checkingVerification || !formData.phone_number.trim()}
              variant="outline"
              className="w-full border-green-500 text-green-700 hover:bg-green-50"
            >
              {checkingVerification ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  {"Checking..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {"Check Telegram Link"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Verification Status */}
        {verificationMessage && (
          <div className={`mt-4 border rounded-lg p-4 ${
            isVerified === true
              ? 'bg-green-50 border-green-200'
              : isVerified === false
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              {isVerified === true ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              ) : isVerified === false ? (
                <Info className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                isVerified === true
                  ? 'text-green-800'
                  : isVerified === false
                  ? 'text-yellow-800'
                  : 'text-blue-800'
              }`}>
                {verificationMessage}
              </p>
            </div>
            {isVerified === true && onReturnToForgotPassword && (
              <div className="mt-3">
                <Button
                  onClick={onReturnToForgotPassword}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {"Return to Password Reset"}
                </Button>
              </div>
            )}
          </div>
        )}

        {onBack && (
          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={onBack} 
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1 inline" />
              {"Go Back"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
