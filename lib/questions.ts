import { authService } from './auth'

export enum QuestionStatus {
  PENDING = 'pending',
  ANSWERED = 'answered',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export interface Question {
  id: string
  user_id: string
  question: string
  status: QuestionStatus
  admin_response?: string
  responded_by?: string
  created_at: string
  updated_at: string
  user_name?: string
  responder_name?: string
}

export interface CreateQuestion {
  question: string
}

export interface UpdateQuestion {
  question?: string
  status?: QuestionStatus
  admin_response?: string
}

export interface QuestionQuery {
  user_id?: string
  status?: QuestionStatus
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
  include_user_names?: boolean
}

export interface QuestionsListResponse {
  questions: Question[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface QuestionStats {
  total: number
  pending: number
  answered: number
  closed: number
  cancelled: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'

class QuestionsService {
  private async getAuthHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Try to refresh token
      try {
        await authService.refreshToken()
        // Retry would require restructuring, for now just logout
        authService.logout()
        window.location.href = '/'
        throw new Error('Authentication failed')
      } catch {
        authService.logout()
        window.location.href = '/'
        throw new Error('Authentication failed')
      }
    }

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      // Handle Go backend error format: { ok: false, error: { message: "..." } }
      const message = body?.error?.message || body?.message || 'Request failed'
      throw new Error(message)
    }

    // Handle Go backend success format: { ok: true, data: {...} }
    return body?.data ?? body
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      ...await this.getAuthHeaders(),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    return this.handleResponse(response)
  }

  // User endpoints
  async createQuestion(question: CreateQuestion): Promise<Question> {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    })
  }

  async getMyQuestions(): Promise<Question[]> {
    return this.request<Question[]>('/questions/my')
  }

  async getMyQuestionsPaginated(page: number = 1, page_size: number = 3): Promise<QuestionsListResponse> {
    // Get all questions first
    const allQuestions = await this.getMyQuestions()
    
    // Manually implement pagination on frontend
    const startIndex = (page - 1) * page_size
    const endIndex = startIndex + page_size
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex)
    
    return {
      questions: paginatedQuestions,
      total: allQuestions.length,
      page: page,
      page_size: page_size,
      has_more: endIndex < allQuestions.length
    }
  }

  async updateMyQuestion(id: string, updates: UpdateQuestion): Promise<Question> {
    return this.request<Question>(`/questions/my/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteMyQuestion(id: string): Promise<void> {
    return this.request<void>(`/questions/my/${id}`, {
      method: 'DELETE',
    })
  }

  async getMyQuestionStats(): Promise<QuestionStats> {
    return this.request<QuestionStats>('/questions/my/stats')
  }

  // Admin endpoints
  async getQuestions(query: QuestionQuery = {}): Promise<QuestionsListResponse> {
    const searchParams = new URLSearchParams()
    
    if (query.user_id) searchParams.append('user_id', query.user_id)
    if (query.status) searchParams.append('status', query.status)
    if (query.start_date) searchParams.append('start_date', query.start_date)
    if (query.end_date) searchParams.append('end_date', query.end_date)
    if (query.page) searchParams.append('page', query.page.toString())
    if (query.page_size) searchParams.append('page_size', query.page_size.toString())
    if (query.include_user_names) searchParams.append('include_user_names', 'true')

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/questions?${queryString}` : '/questions'
    
    return this.request<QuestionsListResponse>(endpoint)
  }

  async getQuestion(id: string): Promise<Question> {
    return this.request<Question>(`/questions/${id}`)
  }

  async getPendingQuestions(): Promise<Question[]> {
    return this.request<Question[]>('/questions/pending')
  }

  async respondToQuestion(id: string, response: UpdateQuestion): Promise<Question> {
    return this.request<Question>(`/questions/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(response),
    })
  }

  async updateQuestionStatus(id: string, status: QuestionStatus): Promise<Question> {
    return this.request<Question>(`/questions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async deleteQuestion(id: string): Promise<void> {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE',
    })
  }

  async getQuestionStats(): Promise<QuestionStats> {
    return this.request<QuestionStats>('/questions/stats')
  }
}

export const questionsService = new QuestionsService()
