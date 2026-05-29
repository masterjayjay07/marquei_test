const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';


export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async get(endpoint: string) {
    return this.request(endpoint);
  },

  async post(endpoint: string, data?: unknown) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put(endpoint: string, data?: unknown) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return api.post('/auth/logout');
  },

  getCurrentUser: () => api.get('/auth/me'),
};

interface ServiceData {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface ProfessionalData {
  userId: string;
  services: string[];
  workSchedule: Record<string, Array<{ start: string; end: string }>>;
}

interface ClientData {
  name: string;
  email: string;
  phone?: string;
}

interface AppointmentData {
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface AppointmentUpdateData {
  status?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  notes?: string;
}

export const servicesApi = {
  getAll: () => api.get('/services'),
  getById: (id: string) => api.get(`/services/${id}`),
  create: (data: ServiceData) => api.post('/services', data),
  update: (id: string, data: Partial<ServiceData>) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const professionalsApi = {
  getAll: () => api.get('/professionals'),
  getById: (id: string) => api.get(`/professionals/${id}`),
  create: (data: ProfessionalData) => api.post('/professionals', data),
  update: (id: string, data: Partial<ProfessionalData>) => api.put(`/professionals/${id}`, data),
  delete: (id: string) => api.delete(`/professionals/${id}`),
};

export const clientsApi = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: ClientData) => api.post('/clients', data),
  update: (id: string, data: Partial<ClientData>) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const appointmentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/appointments${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: AppointmentData) => api.post('/appointments', data),
  update: (id: string, data: AppointmentUpdateData) => api.put(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard'),
  getAppointmentsByDate: (startDate: string, endDate: string) => 
    api.get(`/dashboard/appointments-by-date?startDate=${startDate}&endDate=${endDate}`),
  getProfessionalPerformance: () => api.get('/dashboard/professional-performance'),
};
