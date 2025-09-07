'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { WebsiteWithStatus, AddWebsiteData } from '@/types/website';
import toast from 'react-hot-toast';

export function useWebsites() {
  const [websites, setWebsites] = useState<WebsiteWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const fetchWebsites = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setWebsites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getWebsites(token);
      setWebsites(data.websites || []);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch websites';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const addWebsite = async (data: AddWebsiteData) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await apiClient.addWebsite(data, token);
      await fetchWebsites(); // Refresh the list
      toast.success(`Website ${data.url} added successfully!`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to add website';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteWebsite = async (websiteId: string, url: string) => {
    if (!token) throw new Error('Not authenticated');

    try {
      await apiClient.deleteWebsite(websiteId, token);
      await fetchWebsites(); // Refresh the list
      toast.success(`Website ${url} removed successfully!`);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete website';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  return {
    websites,
    isLoading,
    error,
    addWebsite,
    deleteWebsite,
    refetch: fetchWebsites,
  };
}