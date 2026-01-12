import type { AuthResponse, SignupData, LoginData, User } from '@/types/auth';
import type {
  WebsiteWithStatus,
  DashboardData,
  AddWebsiteData,
  WebsiteStatusTick,
  WebsiteHistoryResponse,
  WebsiteHistoryApiResponse,
} from '@/types/website';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiErrorResponse {
  error?: string;
  code?: string;
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
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
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };

    try {
      const response = await fetch(url, config);

      // Handle different response types
      let data: unknown;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = {
          error: text || 'Invalid response format',
          code: 'INVALID_RESPONSE',
        };
      }

      if (!response.ok) {
        // Enhanced error handling based on status codes
        const errorData = (data ?? {}) as ApiErrorResponse;
        let userFriendlyMessage = errorData.error || 'Request failed';

        switch (response.status) {
          case 400:
            userFriendlyMessage =
              errorData.error ||
              'Invalid request. Please check your input and try again.';
            break;
          case 401:
            userFriendlyMessage =
              errorData.error || 'Invalid credentials. Please check your username and password.';
            break;
          case 403:
            userFriendlyMessage =
              'You do not have permission to perform this action.';
            break;
          case 404:
            userFriendlyMessage = 'The requested resource was not found.';
            break;
          case 409:
            userFriendlyMessage =
              errorData.error || 'This resource already exists.';
            break;
          case 429:
            userFriendlyMessage =
              'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            userFriendlyMessage =
              'A server error occurred. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            userFriendlyMessage =
              'The monitoring service is temporarily unavailable. Please try again in a few minutes.';
            break;
          default:
            userFriendlyMessage =
              errorData.error ||
              `Request failed with status ${response.status}`;
        }

        throw new ApiError(userFriendlyMessage, errorData.code, {
          status: response.status,
          statusText: response.statusText,
          originalError: errorData.error,
          requestId: errorData.requestId,
          timestamp: errorData.timestamp,
        });
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle different types of network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Check if it's a connection refused error (server not running)
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        ) {
          throw new ApiError(
            'Unable to connect to the monitoring service. Please ensure the API server is running on port 3001 and try again.',
            'CONNECTION_REFUSED',
            { originalError: error.message, apiUrl: this.baseUrl },
          );
        }
        throw new ApiError(
          'Unable to connect to the monitoring service. Please check your internet connection and try again.',
          'NETWORK_ERROR',
          { originalError: error.message },
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          'Request timed out. The monitoring service may be experiencing high load. Please try again.',
          'TIMEOUT_ERROR',
          { originalError: error.message },
        );
      }

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ApiError(
          'Request timed out. Please try again.',
          'TIMEOUT_ERROR',
          { originalError: error.message },
        );
      }

      // Generic network error
      throw new ApiError(
        'A network error occurred. Please check your connection and try again.',
        'NETWORK_ERROR',
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
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
  async signup(
    data: SignupData,
  ): Promise<{ id: string; username: string; message: string }> {
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

  async put(endpoint: string, body: any, token?: string): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(body),
    });
  }

  // Website endpoints
  async getWebsites(
    token?: string,
  ): Promise<{ websites: WebsiteWithStatus[] }> {
    return this.request('/websites', {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async addWebsite(
    data: AddWebsiteData,
    token?: string,
  ): Promise<WebsiteWithStatus> {
    return this.request('/website', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async deleteWebsite(
    websiteId: string,
    token?: string,
  ): Promise<{ message: string }> {
    return this.request(`/website/${websiteId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
  }

  async getWebsiteStatus(
    websiteId: string,
    token?: string,
  ): Promise<WebsiteStatusTick> {
    return this.request(`/status/${websiteId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  async getWebsiteHistory(
    websiteId: string,
    limit: number = 50,
    offset: number = 0,
    token?: string,
  ): Promise<WebsiteHistoryResponse> {
    const response = await this.request<WebsiteHistoryApiResponse>(
      `/website/${websiteId}/history?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      },
    );

    return {
      data: response.data,
      history: response.history ?? response.data,
      pagination: response.pagination,
    };
  }

  async getDashboard(token?: string): Promise<DashboardData> {
    return this.request('/dashboard', {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
  }

  // Test API connection
  async testConnection(): Promise<{ status: string; healthy: boolean }> {
    try {
      const response = await this.request<{ status: string }>('/health');
      return { status: 'connected', healthy: response.status === 'healthy' };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONNECTION_REFUSED') {
        return { status: 'server_not_running', healthy: false };
      }
      return { status: 'error', healthy: false };
    }
  }
}

export const apiClient = new ApiClient();
