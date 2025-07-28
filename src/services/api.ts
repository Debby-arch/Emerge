// API service for real backend calls
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`,
      );
    }
    return response.json();
  }

  // Authentication
  async login(
    email: string,
    password: string,
    userType: "patient" | "doctor",
  ): Promise<{
    user_id: string;
    user_type: string;
    tokens: {
      access: string;
      refresh: string;
    };
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        user_type: userType,
      }),
    });

    const data = await this.handleResponse<{
      user_id: string;
      user_type: string;
      tokens: { access: string; refresh: string };
      message: string;
    }>(response);

    // Store tokens
    localStorage.setItem("access_token", data.tokens.access);
    localStorage.setItem("refresh_token", data.tokens.refresh);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_type", data.user_type);

    return data;
  }

  async register(userData: any): Promise<{
    user_id: string;
    user_type: string;
    tokens: {
      access: string;
      refresh: string;
    };
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse<{
      user_id: string;
      user_type: string;
      tokens: { access: string; refresh: string };
      message: string;
    }>(response);

    // Store tokens
    localStorage.setItem("access_token", data.tokens.access);
    localStorage.setItem("refresh_token", data.tokens.refresh);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_type", data.user_type);

    return data;
  }

  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    const response = await fetch(`${API_BASE_URL}/doctors/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Doctor[]>(response);
  }

  async getDoctorAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/doctors/appointments/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Appointment[]>(response);
  }

  async getDoctorPatients(): Promise<Patient[]> {
    const response = await fetch(`${API_BASE_URL}/doctors/patients/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Patient[]>(response);
  }

  // Appointments
  async createAppointment(appointmentData: {
    doctor: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
  }): Promise<{
    appointment_id: string;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/appointments/create/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });

    return this.handleResponse<{
      appointment_id: string;
      message: string;
    }>(response);
  }

  async getPatientAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Appointment[]>(response);
  }

  async cancelAppointment(
    appointmentId: string,
    reason?: string,
  ): Promise<{
    message: string;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/cancel/`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason: reason || "" }),
      },
    );

    return this.handleResponse<{ message: string }>(response);
  }

  async confirmAppointment(appointmentId: string): Promise<{
    message: string;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/confirm/`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      },
    );

    return this.handleResponse<{ message: string }>(response);
  }

  async completeAppointment(
    appointmentId: string,
    notes?: string,
  ): Promise<{
    message: string;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${appointmentId}/complete/`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes: notes || "" }),
      },
    );

    return this.handleResponse<{ message: string }>(response);
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<User[]>(response);
  }

  async toggleUserStatus(userId: string): Promise<{
    message: string;
    is_active: boolean;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/toggle-status/`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      },
    );

    return this.handleResponse<{
      message: string;
      is_active: boolean;
    }>(response);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/admin/appointments/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Appointment[]>(response);
  }

  async getSystemStats(): Promise<{
    total_users: number;
    total_patients: number;
    total_doctors: number;
    active_users: number;
    total_appointments: number;
    pending_appointments: number;
    confirmed_appointments: number;
    completed_appointments: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/stats/`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{
      total_users: number;
      total_patients: number;
      total_doctors: number;
      active_users: number;
      total_appointments: number;
      pending_appointments: number;
      confirmed_appointments: number;
      completed_appointments: number;
    }>(response);
  }

  // Logout
  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_type");
  }

  // Availability
  async createAvailability(availabilityData: {
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }): Promise<{ message: string; id: string }> {
    const response = await fetch(`${API_BASE_URL}/availability/create/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(availabilityData),
    });
    return this.handleResponse<{ message: string; id: string }>(response);
  }

  async createMultipleAvailability(
    availabilityData: {
      date: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }[],
  ): Promise<{ message: string; ids: string[] }> {
    const response = await fetch(`${API_BASE_URL}/availability/create_bulk/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(availabilityData),
    });
    return this.handleResponse<{ message: string; ids: string[] }>(response);
  }

  // Modified to correctly handle specific doctor availability vs. current doctor's availability
  async getDoctorAvailability(
    doctorId?: string,
  ): Promise<DoctorAvailability[]> {
    let url = `${API_BASE_URL}/availability/`; // Default for current doctor (doctor's own dashboard)

    if (doctorId && doctorId !== "current") {
      // If a specific doctorId is provided (e.g., from patient dashboard)
      url = `${API_BASE_URL}/doctors/${doctorId}/availability/`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DoctorAvailability[]>(response);
  }

  async updateAvailability(
    availabilityId: string,
    updateData: {
      date?: string;
      start_time?: string;
      end_time?: string;
      is_available?: boolean;
    },
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/availability/${availabilityId}/update/`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      },
    );
    return this.handleResponse<{ message: string }>(response);
  }

  async deleteAvailability(
    availabilityId: string,
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/availability/${availabilityId}/delete/`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );
    return this.handleResponse<{ message: string }>(response);
  }
}

export const api = new ApiService();

// Types matching backend structure
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  is_active: boolean;
  date_joined: string;
  user_type: "patient" | "doctor";
}

export interface Doctor {
  id: string;
  user: User;
  specialization: string;
  license_number: string;
  years_of_experience: number;
  consultation_fee: string;
  bio: string;
  is_accepting_patients: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user: User;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reason_for_visit: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}
