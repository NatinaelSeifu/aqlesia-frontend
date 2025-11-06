export interface User {
  id: string
  name: string
  lastname: string
  phone_number: string
  role: "admin" | "manager" | "user"
  status: "PENDING" | "ACTIVE" | "INACTIVE"
  job_title?: string
  education?: string
  marriage_status?: string
  partner_name?: string
  childrens_name?: string[]
  telegram_id?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginRequest {
  phone_number: string
  password: string
}

export interface RegisterRequest {
  name: string
  lastname: string
  phone_number: string
  password: string
  telegram_id?: string
  role?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ForgotPasswordRequest {
  phone_number: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface VerifyOTPRequest {
  phone_number: string
  otp: string
}

export interface VerifyOTPResponse {
  valid: boolean
  message: string
  reset_token?: string
}

export interface ResetPasswordRequest {
  reset_token: string
  new_password: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface TelegramLinkRequest {
  phone_number: string
}

export interface TelegramLinkResponse {
  link_code: string
  telegram_url: string
  message: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"

class AuthService {
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Login failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: AuthResponse = body?.data ?? body

    // Validate that we have proper user data
    if (!data || !data.user || !data.user.id) {
      throw new Error("Invalid user data received from server")
    }

    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    localStorage.setItem("user", JSON.stringify(data.user))
    return data
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Registration failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data = body?.data ?? body
    return data as User
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) throw new Error("No refresh token available")

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      this.logout()
      const message = body?.error?.message || body?.message || "Token refresh failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: AuthResponse = body?.data ?? body
    localStorage.setItem("access_token", data.access_token)
    return data
  }

  logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
  }

  // Clean up any invalid data in localStorage
  cleanupInvalidData() {
    const userStr = localStorage.getItem("user")
    if (userStr === "undefined" || userStr === "null") {
      localStorage.removeItem("user")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user")
    if (!userStr || userStr === "undefined" || userStr === "null") {
      return null
    }
    
    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      // Clean up invalid data
      localStorage.removeItem("user")
      return null
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token")
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Password change failed"
      throw new Error(message)
    }

    return
  }

  async forgotPassword(requestData: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Forgot password request failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: ForgotPasswordResponse = body?.data ?? body
    return data
  }

  async verifyOTP(requestData: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "OTP verification failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: VerifyOTPResponse = body?.data ?? body
    return data
  }

  async resetPassword(requestData: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Password reset failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: ResetPasswordResponse = body?.data ?? body
    return data
  }

  async linkTelegram(requestData: TelegramLinkRequest): Promise<TelegramLinkResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/link-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Telegram linking failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: TelegramLinkResponse = body?.data ?? body
    return data
  }

  async checkTelegramVerification(requestData: TelegramLinkRequest): Promise<{verified: boolean, message: string}> {
    const response = await fetch(`${API_BASE_URL}/auth/check-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Telegram verification check failed"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data = body?.data ?? body
    return data
  }

  async getCurrentUserProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = body?.error?.message || body?.message || "Failed to get user profile"
      throw new Error(message)
    }

    // The Go backend returns { ok: true, data: {...} }
    const data: User = body?.data ?? body
    return data
  }
}

export const authService = new AuthService()
