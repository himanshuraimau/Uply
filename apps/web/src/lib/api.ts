import type { AuthResponse, SignupData, LoginData, User } from '@/types/auth';

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
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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

  // Website endpoints (to be used later)
  async getWebsites(token?: string) {
    return this.request('/websites', {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async addWebsite(data: { url: string; isActive?: boolean }, token?: string) {
    return this.request('/website', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async getDashboard(token?: string) {
    return this.request('/dashboard', {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }
}

export const apiClient = new ApiClient();
