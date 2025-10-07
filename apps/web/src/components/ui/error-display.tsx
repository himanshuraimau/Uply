'use client';

import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showRetryButton?: boolean;
  variant?: 'card' | 'inline' | 'banner';
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  isRetrying = false,
  showRetryButton = true,
  variant = 'card',
  className = '',
}: ErrorDisplayProps) {
  const isNetworkError =
    error.toLowerCase().includes('network') ||
    error.toLowerCase().includes('connection') ||
    error.toLowerCase().includes('connect');

  const isServiceUnavailable =
    error.toLowerCase().includes('unavailable') ||
    error.toLowerCase().includes('service') ||
    error.toLowerCase().includes('database');

  const getIcon = () => {
    if (isNetworkError) {
      return <WifiOff className="h-6 w-6 text-destructive" />;
    }
    if (isServiceUnavailable) {
      return <Wifi className="h-6 w-6 text-amber-500" />;
    }
    return <AlertTriangle className="h-6 w-6 text-destructive" />;
  };

  const getTitle = () => {
    if (isNetworkError) {
      return 'CONNECTION ISSUE';
    }
    if (isServiceUnavailable) {
      return 'SERVICE UNAVAILABLE';
    }
    return 'ERROR';
  };

  const content = (
    <div className="flex items-start gap-3">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-card-foreground font-sans tracking-tight mb-1">
          {getTitle()}
        </h3>
        <p className="text-sm text-muted-foreground font-sans break-words">
          {error}
        </p>
        {showRetryButton && onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            variant="outline"
            size="sm"
            className="mt-3 border-2 border-border font-bold"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
            />
            {isRetrying ? 'RETRYING...' : 'TRY AGAIN'}
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div
        className={`p-4 bg-destructive/10 border-2 border-destructive/20 rounded ${className}`}
      >
        {content}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`p-3 bg-destructive/10 border-l-4 border-destructive ${className}`}
      >
        {content}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`border-4 border-destructive bg-card ${className}`}>
      <CardContent className="p-6">{content}</CardContent>
    </Card>
  );
}
