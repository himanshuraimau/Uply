'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, ApiError } from '@/lib/api';
import type {
  AuthContextType,
  User,
  LoginData,
  SignupData,
} from '@/types/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);

          // Verify token is still valid by fetching profile
          try {
            const profile = await apiClient.getProfile(storedToken);
            setUser(profile);
          } catch {
            // Token is invalid, clear auth state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (credentials: LoginData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.signin(credentials);

      // Store auth data
      localStorage.setItem('auth_token', response.jwt);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      setToken(response.jwt);
      setUser(response.user);

      toast.success(`Welcome back, ${response.user.username}!`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setIsLoading(true);
      await apiClient.signup(data);

      toast.success('Account created successfully! Please log in.');

      // Automatically log in after successful signup
      await login({ username: data.username, password: data.password });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'USER_EXISTS') {
          toast.error(
            'Username already exists. Please choose a different username.',
          );
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Signup failed. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
