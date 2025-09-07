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

    // Create optimistic website object
    const optimisticWebsite: WebsiteWithStatus = {
      id: `temp-${Date.now()}`, // Temporary ID
      url: data.url,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'temp-user', // Will be replaced with real data
      currentStatus: undefined, // No status yet
      uptime: undefined,
      avgResponseTime: undefined,
    };

    // Optimistic update - add immediately to UI
    setWebsites(prev => [...prev, optimisticWebsite]);

    // Clear any previous errors when adding
    setError(null);

    try {
      const response = await apiClient.addWebsite(data, token);

      // Replace optimistic website with real data from server
      setWebsites(prev =>
        prev.map(website =>
          website.id === optimisticWebsite.id
            ? response // API returns WebsiteWithStatus directly
            : website
        )
      );

      toast.success(`Website ${data.url} added successfully!`);
      return response;
    } catch (error) {
      // Remove optimistic website on error
      setWebsites(prev => prev.filter(website => website.id !== optimisticWebsite.id));
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to add website';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteWebsite = async (websiteId: string, url: string) => {
    if (!token) throw new Error('Not authenticated');

    // Store the website to restore if deletion fails
    const websiteToDelete = websites.find(w => w.id === websiteId);

    // Optimistic update - remove immediately from UI
    setWebsites(prev => prev.filter(website => website.id !== websiteId));

    // Clear any previous errors when performing delete
    setError(null);

    try {
      await apiClient.deleteWebsite(websiteId, token);
      toast.success(`Website ${url} removed successfully!`);
    } catch (error) {
      // Restore website on error
      if (websiteToDelete) {
        setWebsites(prev => [...prev, websiteToDelete]);
      }

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