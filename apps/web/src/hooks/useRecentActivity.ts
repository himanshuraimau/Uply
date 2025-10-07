'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityItem } from '@/types/website';

interface UseRecentActivityReturn {
  activities: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: ActivityItem) => void;
  removeActivity: (websiteId: string) => void;
  setActivities: (activities: ActivityItem[]) => void;
}

export function useRecentActivity(
  initialActivities: ActivityItem[] = [],
): UseRecentActivityReturn {
  const [activities, setActivitiesState] =
    useState<ActivityItem[]>(initialActivities);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const lastActivityByWebsiteRef = useRef<
    Map<
      string,
      {
        type: ActivityItem['type'];
        status?: ActivityItem['status'];
        timestamp: number;
      }
    >
  >(new Map());

  // Update activities when initial data changes
  useEffect(() => {
    setActivitiesState(initialActivities);
    lastActivityByWebsiteRef.current.clear();
    initialActivities.forEach((activity) => {
      const activityTimestamp = Date.parse(activity.timestamp) || Date.now();
      lastActivityByWebsiteRef.current.set(activity.websiteId, {
        type: activity.type,
        status: activity.status,
        timestamp: activityTimestamp,
      });
    });
  }, [initialActivities]);

  // Add a new activity item to the beginning of the list
  const addActivity = useCallback((newActivity: ActivityItem) => {
    const activityTimestamp = Date.parse(newActivity.timestamp) || Date.now();

    if (newActivity.type === 'STATUS_CHANGE') {
      const lastActivity = lastActivityByWebsiteRef.current.get(
        newActivity.websiteId,
      );
      if (
        lastActivity &&
        lastActivity.type === 'STATUS_CHANGE' &&
        lastActivity.status === newActivity.status &&
        activityTimestamp - lastActivity.timestamp < 15000
      ) {
        return;
      }

      lastActivityByWebsiteRef.current.set(newActivity.websiteId, {
        type: 'STATUS_CHANGE',
        status: newActivity.status,
        timestamp: activityTimestamp,
      });
    } else {
      lastActivityByWebsiteRef.current.set(newActivity.websiteId, {
        type: newActivity.type,
        status: newActivity.status,
        timestamp: activityTimestamp,
      });
    }

    setActivitiesState((prev) => {
      // Avoid duplicates by checking if activity with same ID already exists
      const exists = prev.find((activity) => activity.id === newActivity.id);
      if (exists) {
        return prev;
      }

      // Add to beginning and limit to 20 items to prevent memory bloat
      const updated = [newActivity, ...prev].slice(0, 20);
      return updated;
    });
  }, []);

  // Remove activities related to a specific website
  const removeActivity = useCallback((websiteId: string) => {
    lastActivityByWebsiteRef.current.delete(websiteId);
    setActivitiesState((prev) =>
      prev.filter((activity) => activity.websiteId !== websiteId),
    );
  }, []);

  // Set activities (used for initial load or full refresh)
  const setActivities = useCallback((newActivities: ActivityItem[]) => {
    lastActivityByWebsiteRef.current.clear();
    newActivities.forEach((activity) => {
      const activityTimestamp = Date.parse(activity.timestamp) || Date.now();
      lastActivityByWebsiteRef.current.set(activity.websiteId, {
        type: activity.type,
        status: activity.status,
        timestamp: activityTimestamp,
      });
    });
    setActivitiesState(newActivities);
  }, []);

  // Listen for WebSocket events and convert them to activity items
  useEffect(() => {
    // Handle direct activity events (preferred method for immediate updates)
    const handleActivityNew = (event: CustomEvent) => {
      const activityData = event.detail;
      console.log('🎯 Received direct activity event:', activityData);

      // Add the activity directly as it's already in the correct format
      addActivity(activityData);
    };

    // Fallback: Handle website status events and convert to activity
    const handleWebsiteStatus = (event: CustomEvent) => {
      const statusData = event.detail;

      // Create activity item from status update
      const activityItem: ActivityItem = {
        id: `status-${statusData.websiteId}-${Date.now()}`,
        type: 'STATUS_CHANGE',
        websiteId: statusData.websiteId,
        websiteUrl: statusData.websiteUrl || `Website ${statusData.websiteId}`,
        message: `Website status changed to ${statusData.status.toLowerCase()}`,
        timestamp: statusData.checkedAt || new Date().toISOString(),
        status: statusData.status,
      };

      addActivity(activityItem);
    };

    const handleWebsiteAdded = (event: CustomEvent) => {
      const { website } = event.detail;

      const activityItem: ActivityItem = {
        id: `added-${website.id}-${Date.now()}`,
        type: 'WEBSITE_ADDED',
        websiteId: website.id,
        websiteUrl: website.url,
        message: `Website ${website.url} was added for monitoring`,
        timestamp: website.createdAt || new Date().toISOString(),
      };

      addActivity(activityItem);
    };

    const handleWebsiteDeleted = (event: CustomEvent) => {
      const { websiteId, websiteUrl } = event.detail;

      // First remove all activities for this website
      removeActivity(websiteId);

      // Then add a deletion activity if we have the URL
      if (websiteUrl) {
        const activityItem: ActivityItem = {
          id: `deleted-${websiteId}-${Date.now()}`,
          type: 'WEBSITE_REMOVED',
          websiteId: websiteId,
          websiteUrl: websiteUrl,
          message: `Website ${websiteUrl} was removed from monitoring`,
          timestamp: new Date().toISOString(),
        };

        addActivity(activityItem);
      }
    };

    // Add event listeners (prioritize direct activity events)
    window.addEventListener('activity:new', handleActivityNew as EventListener);
    window.addEventListener(
      'website:status',
      handleWebsiteStatus as EventListener,
    );
    window.addEventListener(
      'website:added',
      handleWebsiteAdded as EventListener,
    );
    window.addEventListener(
      'website:deleted',
      handleWebsiteDeleted as EventListener,
    );

    // Cleanup event listeners
    return () => {
      window.removeEventListener(
        'activity:new',
        handleActivityNew as EventListener,
      );
      window.removeEventListener(
        'website:status',
        handleWebsiteStatus as EventListener,
      );
      window.removeEventListener(
        'website:added',
        handleWebsiteAdded as EventListener,
      );
      window.removeEventListener(
        'website:deleted',
        handleWebsiteDeleted as EventListener,
      );
    };
  }, [addActivity, removeActivity]);

  return {
    activities,
    isLoading,
    error,
    addActivity,
    removeActivity,
    setActivities,
  };
}
