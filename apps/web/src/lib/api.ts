import type { AuthResponse, SignupData, LoginData, User } from '@/types/auth';
import type { WebsiteWithStatus, DashboardData, AddWebsiteData } from '@/types/website';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', data.code, data.details);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error occurred', 'NETWORK_ERROR');
    }
  }

  private getAuthHeaders(token?: string): Record<string, string> {
    const authToken = token || this.getStoredToken();
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Auth endpoints
  async signup(data: SignupData): Promise<{ id: string; username: string; message: string }> {
    return this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signin(data: LoginData): Promise<AuthResponse> {
    return this.request('/user/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(token?: string): Promise<User> {
    return this.request('/user/profile', {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  // Website endpoints
  async getWebsites(token?: string): Promise<{ websites: WebsiteWithStatus[] }> {
    try {
      return await this.request('/websites', {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });
    } catch (error) {
      // For development, return mock data if the API is not available
      if (process.env.NODE_ENV === 'development' && error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        console.warn('API not available, returning mock data');
        return {
          websites: [],
        };
      }
      throw error;
    }
  }

  async addWebsite(data: AddWebsiteData, token?: string): Promise<WebsiteWithStatus> {
    return this.request('/website', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async deleteWebsite(websiteId: string, token?: string): Promise<{ message: string }> {
    return this.request(`/website/${websiteId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
  }

  async getWebsiteStatus(websiteId: string, token?: string): Promise<any> {
    return this.request(`/status/${websiteId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async getDashboard(token?: string): Promise<DashboardData> {
    try {
      return await this.request('/dashboard', {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });
    } catch (error) {
      // For development, return mock data if the API is not available
      if (process.env.NODE_ENV === 'development' && error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        console.warn('API not available, returning mock dashboard data');
        return {
          stats: {
            totalWebsites: 0,
            uptime: 100,
            avgResponseTime: 0,
            incidents: 0,
          },
          websites: [],
          recentActivity: [],
        };
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
