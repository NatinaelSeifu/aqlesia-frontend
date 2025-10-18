import { authService } from "./auth"
import { normalizeEthiopianPhone } from "./utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"

class ApiService {
  private async getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Try to refresh token
      try {
        await authService.refreshToken()
        // Retry the original request
        return response
      } catch {
        authService.logout()
        window.location.href = "/"
        throw new Error("Authentication failed")
      }
    }

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      // Handle Go backend error format: { ok: false, error: { message: "..." } }
      const message = body?.error?.message || body?.message || "Request failed"
      throw new Error(message)
    }

    // Handle Go backend success format: { ok: true, data: {...} }
    return body?.data ?? body
  }

  async getUsers(page = 1, pageSize = 20) {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    const response = await fetch(`${API_BASE_URL}/users?${searchParams}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getUserById(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateUser(id: string, userData: any) {
    // Build a PATCH payload that only includes valid, non-empty fields
    const payload: Record<string, any> = {}

    Object.entries(userData ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (key === 'phone_number') {
        // Always send phone number as a string, normalized to E.164 (251xxxxxxxxx)
        const v = String(value)
        const normalized = normalizeEthiopianPhone(v)
        if (normalized && normalized.trim().length > 0) {
          payload[key] = normalized
        }
        return
      }

      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length > 0) {
          payload[key] = trimmed
        }
        return
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          payload[key] = value
        }
        return
      }

      // Fallback include for other primitive types
      payload[key] = value
    })

    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PATCH",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return this.handleResponse(response)
  }

  async deleteUser(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateUserStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: "PATCH",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    return this.handleResponse(response)
  }
}

export const apiService = new ApiService()
