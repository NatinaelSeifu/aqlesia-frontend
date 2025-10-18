"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { PermissionService } from "@/lib/permissions"
import type { UserRole, Permission } from "@/lib/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: Permission
  requiredRole?: UserRole[]
  fallbackPath?: string
  customMessage?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = "/dashboard",
  customMessage,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{"You must be logged in to access this page."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && !requiredRole.includes(user.role as UserRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{customMessage || "You don't have permission to access this page."}</AlertDescription>
          </Alert>
          <Link href={fallbackPath}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {"Go Back"}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check permission-based access
  if (requiredPermission && !PermissionService.hasPermission(user.role as UserRole, requiredPermission)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{customMessage || "You don't have permission to perform this action."}</AlertDescription>
          </Alert>
          <Link href={fallbackPath}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {"Go Back"}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
