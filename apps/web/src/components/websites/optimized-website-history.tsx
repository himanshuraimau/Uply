'use client';

import { useCallback, useEffect, useState, memo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

import { apiClient, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from './status-indicator';
import { Loading } from '@/components/ui/loading';
import toast from 'react-hot-toast';

interface HistoryItem {
  id: string;
  status: 'UP' | 'DOWN';
  response_time_ms: number;
  createdAt: string;
  region: {
    name: string;
  };
}

interface OptimizedWebsiteHistoryProps {
  websiteId: string;
}

// Memoized history item component to prevent unnecessary re-renders
const HistoryItemComponent = memo(function HistoryItemComponent({
  item,
}: {
  item: HistoryItem;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-2 border-border bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center space-x-4">
        <StatusIndicator
          status={item.status}
          responseTime={item.response_time_ms}
          className="text-sm"
        />
        <div>
          <p className="text-sm font-bold text-card-foreground font-sans">
            {item.region.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground font-sans">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
});

export const OptimizedWebsiteHistory = memo(function OptimizedWebsiteHistory({
  websiteId,
}: OptimizedWebsiteHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const { token } = useAuth();

  const fetchHistory = useCallback(
    async (reset: boolean = false) => {
      if (!token) return;

      try {
        const currentOffset = reset ? 0 : offset;
        setIsLoading(reset);
        setError(null);

        const data = await apiClient.getWebsiteHistory(
          websiteId,
          50,
          currentOffset,
          token,
        );
        // Map raw API history items to HistoryItem type
        const newHistory = (data.history || []).map(item => ({
          ...item,
          status: item.status as 'UP' | 'DOWN',
        }));

        if (reset) {
          setHistory(newHistory);
          setOffset(newHistory.length);
        } else {
          setHistory((prev) => [...prev, ...newHistory]);
          setOffset((prev) => prev + newHistory.length);
        }

        setHasMore(newHistory.length === 50);
      } catch (error) {
        let errorMessage = 'Failed to fetch website history';

        if (error instanceof ApiError) {
          errorMessage = error.message;
          console.error('Website history fetch error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            websiteId,
            timestamp: new Date().toISOString(),
          });
        } else if (error instanceof Error) {
          errorMessage = error.message;
          console.error('Website history fetch error:', {
            message: error.message,
            stack: error.stack,
            websiteId,
            timestamp: new Date().toISOString(),
          });
        }

        setError(errorMessage);

        if (!reset) {
          toast.error(errorMessage);
        }
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [websiteId, token, offset],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    await fetchHistory(false);
  }, [fetchHistory, loadingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await apiClient.getWebsiteHistory(websiteId, 50, 0, token);
        // Map raw API history items to HistoryItem type
        const newHistory = (data.history || []).map(item => ({
          ...item,
          status: item.status as 'UP' | 'DOWN',
        }));

        setHistory(newHistory);
        setOffset(newHistory.length);
        setHasMore(newHistory.length === 50);
      } catch (error) {
        let errorMessage = 'Failed to fetch website history';

        if (error instanceof ApiError) {
          errorMessage = error.message;
          console.error('Website history fetch error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            websiteId,
            timestamp: new Date().toISOString(),
          });
        } else if (error instanceof Error) {
          errorMessage = error.message;
          console.error('Website history fetch error:', {
            message: error.message,
            stack: error.stack,
            websiteId,
            timestamp: new Date().toISOString(),
          });
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [websiteId, token]);

  // Listen for real-time status updates to prepend new history items
  useEffect(() => {
    const handleWebsiteStatus = (event: CustomEvent) => {
      const statusData = event.detail;

      // Only update if this event is for our website
      if (statusData.websiteId !== websiteId) return;

      // Create a new history item from the status update
      const newHistoryItem: HistoryItem = {
        id: `realtime-${statusData.websiteId}-${Date.now()}`,
        status: statusData.status as 'UP' | 'DOWN',
        response_time_ms: statusData.responseTime,
        createdAt: statusData.checkedAt,
        region: {
          name: statusData.region,
        },
      };

      // Add to the beginning of the history
      setHistory((prev) => {
        // Avoid duplicates - remove any existing items with similar timestamp
        const filtered = prev.filter(
          (item) =>
            Math.abs(
              new Date(item.createdAt).getTime() -
                new Date(newHistoryItem.createdAt).getTime(),
            ) > 5000,
        );
        return [newHistoryItem, ...filtered];
      });
    };

    // Add event listener for real-time updates
    window.addEventListener(
      'website:status',
      handleWebsiteStatus as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        'website:status',
        handleWebsiteStatus as EventListener,
      );
    };
  }, [websiteId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            MONITORING HISTORY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/20 border-4 border-destructive mx-auto flex items-center justify-center">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-destructive mb-2 font-sans tracking-tight">
                FAILED TO LOAD
              </h3>
              <p className="text-muted-foreground font-sans mb-4">{error}</p>
            </div>
            <Button
              onClick={() => fetchHistory(true)}
              className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold"
            >
              RETRY
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            MONITORING HISTORY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted border-4 border-border mx-auto flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
                NO HISTORY YET
              </h3>
              <p className="text-muted-foreground font-sans">
                Monitoring data will appear here once checks begin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedHistory = isExpanded ? history : history.slice(0, 5);

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            MONITORING HISTORY ({history.length})
          </CardTitle>
          {history.length > 5 && (
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-4 border-border font-semibold"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  SHOW LESS
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  SHOW ALL
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {displayedHistory.map((item) => (
            <HistoryItemComponent key={item.id} item={item} />
          ))}

          {isExpanded && hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                variant="outline"
                className="border-4 border-border hover:bg-muted font-semibold"
              >
                {loadingMore ? 'LOADING...' : 'LOAD MORE'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
