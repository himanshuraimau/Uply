'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { AddWebsiteData, WebsiteWithStatus } from '@/types/website';

export function useWebsites() {
  const [websites, setWebsites] = useState<WebsiteWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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
      // API returns { websites: WebsiteWithStatus[] }
      setWebsites(data.websites || []);
    } catch (error) {
      let errorMessage = 'Failed to fetch websites';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Log error details for debugging
        console.error('Websites fetch error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Websites fetch error:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Websites fetch error:', {
          error: String(error),
          timestamp: new Date().toISOString()
        });
      }
      
      setError(errorMessage);
      setWebsites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const addWebsite = async (data: AddWebsiteData): Promise<WebsiteWithStatus> => {
    if (!token) throw new Error('Not authenticated');

    setIsAdding(true);
    setError(null);

    try {
      const response = await apiClient.addWebsite(data, token);
      
      // Add the new website to the list
      setWebsites(prev => [response, ...prev]);
      
      toast.success(`Website ${data.url} added successfully!`);
      return response;
    } catch (error) {
      let errorMessage = 'Failed to add website';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Log error details for debugging
        console.error('Add website error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          websiteData: data,
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Add website error:', {
          message: error.message,
          stack: error.stack,
          websiteData: data,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Add website error:', {
          error: String(error),
          websiteData: data,
          timestamp: new Date().toISOString()
        });
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const deleteWebsite = async (websiteId: string, url: string): Promise<void> => {
    if (!token) throw new Error('Not authenticated');

    setIsDeleting(websiteId);
    setError(null);

    try {
      await apiClient.deleteWebsite(websiteId, token);
      
      // Remove the website from the list
      setWebsites(prev => prev.filter(website => website.id !== websiteId));
      
      toast.success(`Website ${url} removed successfully!`);
    } catch (error) {
      let errorMessage = 'Failed to delete website';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Log error details for debugging
        console.error('Delete website error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          websiteId,
          websiteUrl: url,
          timestamp: new Date().toISOString()
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Delete website error:', {
          message: error.message,
          stack: error.stack,
          websiteId,
          websiteUrl: url,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Delete website error:', {
          error: String(error),
          websiteId,
          websiteUrl: url,
          timestamp: new Date().toISOString()
        });
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const retry = useCallback(() => {
    if (!isLoading) {
      fetchWebsites();
    }
  }, [fetchWebsites, isLoading]);

  return {
    websites,
    isLoading,
    error,
    isAdding,
    isDeleting,
    addWebsite,
    deleteWebsite,
    refetch: fetchWebsites,
    retry,
  };
}