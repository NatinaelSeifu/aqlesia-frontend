"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { apiService } from "@/lib/api"
import {
  User,
  Phone,
  Briefcase,
  GraduationCap,
  Heart,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  UserCircle,
  X
} from "lucide-react"
import { useTranslations } from "next-intl"

export function UserProfile() {
  const { user: currentUser } = useAuth()
  const t = useTranslations()
  const [userProfile, setUserProfile] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone_number: "",
    job_title: "",
    education: "",
    marriage_status: "",
    partner_name: "",
    childrens_name: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [childName, setChildName] = useState("")
  // Fetch fresh user data
  const fetchUserProfile = async () => {
    if (!currentUser?.id) return
    
    try {
      const freshUserData = await apiService.getUserById(currentUser.id)
      setUserProfile(freshUserData)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserProfile()
    }
  }, [currentUser?.id])

  useEffect(() => {
    const userData = userProfile || currentUser
    if (userData) {
      const newFormData = {
        name: userData.name || "",
        lastname: userData.lastname || "",
        phone_number: userData.phone_number || "",
        job_title: userData.job_title || "",
        education: userData.education || "",
        marriage_status: userData.marriage_status || "",
        partner_name: userData.partner_name || "",
        childrens_name: Array.isArray(userData.childrens_name) ? userData.childrens_name : [],
      }
      setFormData(newFormData)
    }
  }, [userProfile, currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Basic validation
    if (!formData.name.trim()) {
      setError(t("profile.validation.nameRequired"))
      return
    }
    if (!formData.lastname.trim()) {
      setError(t("profile.validation.lastnameRequired"))
      return
    }
    if (!formData.phone_number.trim()) {
      setError(t("profile.validation.phoneRequired"))
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Only send fields that have values or have been modified
      const updateData = {
        name: formData.name.trim(),
        lastname: formData.lastname.trim(), 
        phone_number: formData.phone_number.trim(),
        job_title: formData.job_title.trim(),
        education: formData.education.trim(),
        marriage_status: formData.marriage_status,
        partner_name: formData.partner_name.trim(),
        childrens_name: formData.childrens_name,
      }
      
      await apiService.updateUser(currentUser.id, updateData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.errors.updateFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addChild = () => {
    if (childName.trim() && !formData.childrens_name.includes(childName.trim())) {
      setFormData((prev) => ({
        ...prev,
        childrens_name: [...prev.childrens_name, childName.trim()],
      }))
      setChildName("")
    } else if (formData.childrens_name.includes(childName.trim())) {
      setError(t("profile.children.alreadyExists"))
      setTimeout(() => setError(""), 2000)
    }
  }

  const removeChild = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      childrens_name: prev.childrens_name.filter((_, i) => i !== index),
    }))
  }

  if (!currentUser) return null

  // Ensure form data has been initialized
  const isFormInitialized = currentUser && (
    formData.name === currentUser.name &&
    formData.lastname === currentUser.lastname &&
    formData.phone_number === currentUser.phone_number
  )

  return (
    <Card className="w-full max-w-4xl mx-auto border-gray-200 shadow-lg bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-gray-900 text-xl">{t("profile.card.title")}</CardTitle>
            <CardDescription className="text-gray-600">
              {t("profile.card.desc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <form key={currentUser?.id} onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">{t("profile.toasts.updateSuccess")}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCircle className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t("profile.sections.basicInfo")}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-800 font-semibold text-sm">{t("profile.form.firstName")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={currentUser?.name || t("profile.placeholders.firstName")}
                  className="bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname" className="text-gray-800 font-semibold text-sm">{t("profile.form.lastName")}</Label>
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => handleChange("lastname", e.target.value)}
                  placeholder={currentUser?.lastname || t("profile.placeholders.lastName")}
                  className="bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-800 font-semibold text-sm">{t("profile.form.phone")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                  placeholder={currentUser?.phone_number || t("profile.placeholders.phone")}
                  className="pl-10 bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t("profile.sections.professionalInfo")}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title" className="text-gray-800 font-semibold text-sm">{t("profile.form.jobTitle")}</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange("job_title", e.target.value)}
                  placeholder={currentUser?.job_title || t("profile.placeholders.jobTitle")}
                  className="pl-10 bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education" className="text-gray-800 font-semibold text-sm">{t("profile.form.education")}</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => handleChange("education", e.target.value)}
                  placeholder={currentUser?.education || t("profile.placeholders.education")}
                  className="pl-10 bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="h-4 w-4 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t("profile.sections.personalInfo")}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marriage_status" className="text-gray-800 font-semibold text-sm">{t("profile.form.marriageStatus")}</Label>
              <Select
                value={formData.marriage_status}
                onValueChange={(value) => handleChange("marriage_status", value)}
              >
                <SelectTrigger className="!bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder={currentUser?.marriage_status ? t("profile.placeholders.currentStatus", { status: currentUser.marriage_status }) : t("profile.placeholders.selectMarriageStatus")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t("profile.marriage.single")}</SelectItem>
                  <SelectItem value="married">{t("profile.marriage.married")}</SelectItem>
                  <SelectItem value="divorced">{t("profile.marriage.divorced")}</SelectItem>
                  <SelectItem value="engaged">{t("profile.marriage.engaged")}</SelectItem>
                  <SelectItem value="widowed">{t("profile.marriage.widowed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner_name" className="text-gray-800 font-semibold text-sm">{t("profile.form.partnerName")}</Label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="partner_name"
                  value={formData.partner_name}
                  onChange={(e) => handleChange("partner_name", e.target.value)}
                  placeholder={currentUser?.partner_name || t("profile.placeholders.partnerName")}
                  className="pl-10 bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800 font-semibold text-sm">{t("profile.form.childrenNames")}</Label>
              <div className="flex space-x-2">
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder={formData.childrens_name.length > 0 ? t("profile.placeholders.addAnotherChild") : t("profile.placeholders.childName")}
                  className="bg-white border-2 border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addChild())}
                />
                <Button 
                  type="button" 
                  onClick={addChild} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg"
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  {t("profile.actions.add")}
                </Button>
              </div>
              {formData.childrens_name.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("profile.children.current", { count: formData.childrens_name.length })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.childrens_name.map((name, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-500 hover:text-white transition-colors bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1"
                        onClick={() => removeChild(index)}
                        title={t("profile.children.clickToRemove")}
                      >
                        {name}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 shadow-lg" 
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? t("profile.actions.updating") : t("profile.actions.updateProfile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
