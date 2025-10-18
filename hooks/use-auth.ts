"use client"

import { useState, useEffect } from "react"
import { authService, type User, type LoginRequest, type RegisterRequest } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clean up any invalid data first
    authService.cleanupInvalidData()
    
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (credentials: LoginRequest) => {
    setLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      return response
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    setLoading(true)
    try {
      const newUser = await authService.register(userData)
      return newUser
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
}
