import { apiService } from "./api"

// Types based on the backend DTOs
export interface Communion {
  id: string
  user_id: string
  user?: {
    id: string
    name: string
    lastname?: string
    phone_number: string
    email?: string
    role: string
  }
  communion_date: string // ISO date string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string // ISO date string
  approved_at?: string // ISO date string
  approved_by_user_id?: string
  approved_by?: {
    id: string
    name: string
    lastname?: string
    phone_number: string
    email?: string
    role: string
  }
  created_at: string // ISO date string
  updated_at: string // ISO date string
  deleted_at?: string // ISO date string
}

export interface CreateCommunionRequest {
  communion_date: string // YYYY-MM-DD format, must be in the past
}

export interface UpdateCommunionStatusRequest {
  status: 'approved' | 'rejected'
}

export interface CommunionListResponse {
  communions: Communion[]
  total: number
  page: number
  page_size: number
}

class CommunionService {
  async createCommunion(request: CreateCommunionRequest): Promise<Communion> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request),
    })
    return this.handleResponse(response)
  }

  async getCommunion(id: string): Promise<Communion> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/${id}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getUserCommunions(page = 1, pageSize = 20): Promise<CommunionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/user?${params}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getAllCommunions(page = 1, pageSize = 20): Promise<CommunionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/all?${params}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getPendingCommunions(page = 1, pageSize = 20): Promise<CommunionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/pending?${params}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateCommunion(id: string, request: CreateCommunionRequest): Promise<Communion> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/${id}`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request),
    })
    return this.handleResponse(response)
  }

  async updateCommunionStatus(id: string, request: UpdateCommunionStatusRequest): Promise<Communion> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/${id}/status`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request),
    })
    return this.handleResponse(response)
  }

  async deleteCommunion(id: string): Promise<{ message: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"}/communion/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  private async getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Try to refresh token using the auth service
      try {
        const { authService } = await import("./auth")
        await authService.refreshToken()
        // Retry the original request would require more complex logic
        return response
      } catch {
        const { authService } = await import("./auth")
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
}

export const communionService = new CommunionService()
