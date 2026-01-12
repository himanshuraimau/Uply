export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  websiteCount?: number;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface SignupData {
  username: string;
  password: string;
  email?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
