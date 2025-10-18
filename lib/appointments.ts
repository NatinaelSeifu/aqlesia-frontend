export interface Appointment {
	id: string;
	user_id: string;
	appointment_date: string;
	notes?: string;
	status: "pending" | "completed" | "cancelled";
	created_at: string;
	updated_at: string;
	deleted_at?: string;
	user?: {
		id: string;
		name: string;
		lastname: string;
		phone_number: string;
	};
}

export interface CreateAppointmentRequest {
	appointment_date: string;
	notes?: string;
}

export interface UpdateAppointmentRequest {
	appointment_date?: string;
	notes?: string;
}

export interface AppointmentListResponse {
	appointments: Appointment[];
	page: number;
	page_size: number;
	total: number;
}

export interface AppointmentStatsResponse {
	total_appointments: number;
	pending_appointments: number;
	completed_appointments: number;
	cancelled_appointments: number;
}

class AppointmentService {
	private async getAuthHeaders() {
		const token = localStorage.getItem("access_token");
		return {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
		};
	}

	private async handleResponse(response: Response) {
		if (response.status === 401) {
			// Handle token refresh logic here if needed
			throw new Error("Authentication failed");
		}

		const body = await response.json().catch(() => ({}));

		if (!response.ok) {
			// Handle Go backend error format: { ok: false, error: { message: "..." } }
			const message = body?.error?.message || body?.message || "Request failed";
			console.error("API Error:", { status: response.status, body, message });
			throw new Error(message);
		}

		// Handle Go backend success format: { ok: true, data: {...} }
		console.log("API Success:", { status: response.status, body });
		return body?.data ?? body;
	}

	async getMyAppointments(
		page = 1,
		pageSize = 20
	): Promise<AppointmentListResponse> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/my?page=${page}&page_size=${pageSize}`,
			{
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async getAllAppointments(
		page = 1,
		pageSize = 20
	): Promise<AppointmentListResponse> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments?page=${page}&page_size=${pageSize}`,
			{
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async getAppointmentById(id: string): Promise<Appointment> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/${id}`,
			{
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async createAppointment(
		data: CreateAppointmentRequest
	): Promise<Appointment> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments`,
			{
				method: "POST",
				headers: await this.getAuthHeaders(),
				body: JSON.stringify(data),
			}
		);
		return this.handleResponse(response);
	}

	async updateAppointment(
		id: string,
		data: UpdateAppointmentRequest
	): Promise<Appointment> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/${id}`,
			{
				method: "PATCH",
				headers: await this.getAuthHeaders(),
				body: JSON.stringify(data),
			}
		);
		return this.handleResponse(response);
	}

	async cancelAppointment(id: string): Promise<void> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/${id}/cancel`,
			{
				method: "POST",
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async completeAppointment(id: string, notes?: string): Promise<Appointment> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/${id}/complete`,
			{
				method: "POST",
				headers: await this.getAuthHeaders(),
				body: JSON.stringify({ notes }),
			}
		);
		return this.handleResponse(response);
	}

	async deleteAppointment(id: string): Promise<void> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/${id}`,
			{
				method: "DELETE",
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async getAvailableDates(
		startDate?: string,
		endDate?: string
	): Promise<string[]> {
		const params = new URLSearchParams();
		if (startDate) params.append("start_date", startDate);
		if (endDate) params.append("end_date", endDate);

		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/available-dates?${params}`,
			{
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}

	async getAppointmentStats(): Promise<AppointmentStatsResponse> {
		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1"
			}/appointments/stats`,
			{
				headers: await this.getAuthHeaders(),
			}
		);
		return this.handleResponse(response);
	}
}

export const appointmentService = new AppointmentService();
