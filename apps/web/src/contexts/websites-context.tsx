'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebsites as useWebsitesHook } from '@/hooks/useWebsites';
import type { WebsiteWithStatus, AddWebsiteData } from '@/types/website';

interface WebsitesContextType {
  websites: WebsiteWithStatus[];
  isLoading: boolean;
  error: string | null;
  addWebsite: (data: AddWebsiteData) => Promise<any>;
  deleteWebsite: (websiteId: string, url: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const WebsitesContext = createContext<WebsitesContextType | undefined>(undefined);

interface WebsitesProviderProps {
  children: ReactNode;
}

export function WebsitesProvider({ children }: WebsitesProviderProps) {
  const websitesData = useWebsitesHook();

  return (
    <WebsitesContext.Provider value={websitesData}>
      {children}
    </WebsitesContext.Provider>
  );
}

export function useWebsites() {
  const context = useContext(WebsitesContext);
  if (context === undefined) {
    throw new Error('useWebsites must be used within a WebsitesProvider');
  }
  return context;
}