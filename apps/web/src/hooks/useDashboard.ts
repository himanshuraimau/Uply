'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { DashboardData } from '@/types/website';
import toast from 'react-hot-toast';

export function useDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
            const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch dashboard data';
            setError(errorMessage);
            // Don't show toast for dashboard errors as they're not critical
            console.error('Dashboard fetch error:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Auto-refresh dashboard every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(fetchDashboard, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchDashboard]);

    return {
        dashboardData,
        isLoading,
        error,
        refetch: fetchDashboard,
    };
}