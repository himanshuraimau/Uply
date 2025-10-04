'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  responseTime?: number;
  className?: string;
  showResponseTime?: boolean;
}

export function StatusIndicator({ 
  status, 
  responseTime, 
  className,
  showResponseTime = true 
}: StatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'UP':
        return {
          label: 'UP',
          className: 'bg-transparent text-foreground border-2 border-border font-bold',
          dotColor: 'bg-primary',
        };
      case 'DOWN':
        return {
          label: 'DOWN',
          className: 'bg-transparent text-foreground border-2 border-border font-bold',
          dotColor: 'bg-destructive',
        };
      default:
        return {
          label: 'UNKNOWN',
          className: 'bg-transparent text-foreground border-2 border-border font-bold',
          dotColor: 'bg-muted-foreground',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center space-x-2">
        <div className={cn('w-3 h-3 border border-border', config.dotColor)} />
        <Badge className={cn('font-bold text-sm px-3 py-1', config.className)}>
          {config.label}
        </Badge>
      </div>
      {showResponseTime && responseTime !== undefined && (
        <span className="text-sm text-muted-foreground font-mono">
          {responseTime}ms
        </span>
      )}
    </div>
  );
}