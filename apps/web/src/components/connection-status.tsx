'use client';

import { useWebSocket } from '@/contexts/websocket-context';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { connectionStatus, lastError } = useWebSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return `Connection error${lastError ? `: ${lastError}` : ''}`;
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
      <span className="text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}
