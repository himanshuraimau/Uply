'use client';

import { useCallback, useEffect, useState } from 'react';
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

interface WebsiteHistoryProps {
  websiteId: string;
}

export function WebsiteHistory({ websiteId }: WebsiteHistoryProps) {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      if (!token || !websiteId) return;

      try {
        if (!append) {
          setIsLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const response = await apiClient.getWebsiteHistory(
          websiteId,
          20,
          offset,
          token,
        );

        const isHistoryItem = (item: unknown): item is HistoryItem => {
          if (typeof item !== 'object' || item === null) return false;
          if (!('status' in item)) return false;
          const status = (item as { status: unknown }).status;
          return status === 'UP' || status === 'DOWN';
        };

        const filteredData = (response.data as unknown[]).filter(isHistoryItem);
        if (append) {
          setHistory((prev) => [...prev, ...filteredData]);
        } else {
          setHistory(filteredData);
        }


        setHasMore(response.pagination.hasMore);
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : 'Failed to fetch history';
        setError(errorMessage);
        if (!append) {
          toast.error(errorMessage);
        }
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [websiteId, token],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadMore = () => {
    fetchHistory(history.length, true);
  };

  if (isLoading) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader className="border-b-4 border-border">
          <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            MONITORING HISTORY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Loading size="md" text="Loading history..." />
        </CardContent>
      </Card>
    );
  }

  if (error && history.length === 0) {
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
              <h3 className="text-xl font-bold text-destructive mb-2 font-sans tracking-tight">
                ERROR LOADING HISTORY
              </h3>
              <p className="text-muted-foreground font-sans">{error}</p>
            </div>
            <Button
              onClick={() => fetchHistory()}
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
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border-2 border-border bg-muted/50 hover:bg-muted transition-colors"
            >
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
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
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
}
