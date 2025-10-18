import { authService } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"

export interface AvailableDate {
  id: string
  slot_date: string
  max_capacity: number
  current_bookings: number
  available_spots: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateAvailableDate {
  slot_date: string
  max_capacity: number
  is_active?: boolean
}

export interface UpdateAvailableDate {
  max_capacity?: number
  is_active?: boolean
}

export interface AvailableDatesListResponse {
  dates: AvailableDate[]
  total: number
  page: number
  page_size: number
}

export interface AvailableDateQuery {
  start_date: string
  end_date: string
  include_inactive?: boolean
  only_available?: boolean
}

class AvailableDatesService {
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

  async getAvailableDates(query: AvailableDateQuery): Promise<AvailableDate[]> {
    const searchParams = new URLSearchParams({
      start_date: query.start_date,
      end_date: query.end_date,
      ...(query.include_inactive !== undefined && { include_inactive: query.include_inactive.toString() }),
      ...(query.only_available !== undefined && { only_available: query.only_available.toString() }),
    })

    const response = await fetch(`${API_BASE_URL}/available-dates?${searchParams}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getAvailableDateByDate(date: string): Promise<AvailableDate> {
    const response = await fetch(`${API_BASE_URL}/available-dates/${date}`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createAvailableDate(data: CreateAvailableDate): Promise<AvailableDate> {
    const response = await fetch(`${API_BASE_URL}/available-dates`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updateAvailableDate(date: string, data: UpdateAvailableDate): Promise<AvailableDate> {
    const response = await fetch(`${API_BASE_URL}/available-dates/${date}`, {
      method: "PUT",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteAvailableDate(date: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/available-dates/${date}`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    await this.handleResponse(response)
  }
}

export const availableDatesService = new AvailableDatesService()
