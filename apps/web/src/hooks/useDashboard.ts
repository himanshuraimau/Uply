'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { DashboardData } from '@/types/website';

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getDashboard(token);
      setDashboardData(data);
    } catch (error) {
      let errorMessage = 'Failed to fetch dashboard data';
      let shouldRetry = true;

      if (error instanceof ApiError) {
        errorMessage = error.message;

        // Determine if error is retryable
        if (
          error.code === 'INVALID_CREDENTIALS' ||
          error.code === 'TOKEN_EXPIRED'
        ) {
          shouldRetry = false;
          // Could trigger logout here if needed
        } else if (
          error.code === 'TIMEOUT_ERROR' ||
          error.code === 'NETWORK_ERROR'
        ) {
          shouldRetry = true;
        } else if (error.code === 'DATABASE_UNAVAILABLE') {
          errorMessage =
            'The monitoring database is temporarily unavailable. Data will be restored shortly.';
          shouldRetry = true;
        }

        // Log error details for debugging
        console.error('Dashboard fetch error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          shouldRetry,
          timestamp: new Date().toISOString(),
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Dashboard fetch error:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error('Dashboard fetch error:', {
          error: String(error),
          timestamp: new Date().toISOString(),
        });
      }

      setError(errorMessage);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh dashboard every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid overlapping requests
      if (!isLoading) {
        fetchDashboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, fetchDashboard, isLoading]);

  const retry = useCallback(() => {
    if (!isLoading) {
      fetchDashboard();
    }
  }, [fetchDashboard, isLoading]);

  return {
    dashboardData,
    isLoading,
    error,
    refetch: fetchDashboard,
    retry,
  };
}
