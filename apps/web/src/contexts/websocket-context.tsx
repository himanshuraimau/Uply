'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
}

interface ServerToClientEvents {
  connected: (data: {
    message: string;
    userId: string;
    timestamp: string;
  }) => void;
  subscribed: (data: { userId: string; timestamp: string }) => void;
  'website:status': (data: {
    websiteId: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    checkedAt: string;
    region: string;
    websiteUrl?: string;
  }) => void;
  'website:added': (data: { website: unknown }) => void;
  'website:deleted': (data: { websiteId: string; websiteUrl?: string }) => void;
  'activity:new': (data: {
    id: string;
    type: 'STATUS_CHANGE' | 'WEBSITE_ADDED' | 'WEBSITE_REMOVED';
    websiteId: string;
    websiteUrl: string;
    message: string;
    timestamp: string;
    status?: 'UP' | 'DOWN';
  }) => void;
}

interface ClientToServerEvents {
  subscribe: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastError: null,
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const { token, isAuthenticated, user } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastStatusEventRef = useRef<Map<string, string>>(new Map());
  const recentActivityIdsRef = useRef<{ ids: Set<string>; order: string[] }>({
    ids: new Set(),
    order: [],
  });

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      // Disconnect when not authenticated
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      setConnectionStatus('disconnected');
      clearReconnectTimeout();
      lastStatusEventRef.current.clear();
      recentActivityIdsRef.current = { ids: new Set(), order: [] };
      return;
    }

    // Disconnect existing socket before creating new one
    setSocket((prevSocket) => {
      if (prevSocket) {
        prevSocket.disconnect();
      }
      return null;
    });

    lastStatusEventRef.current.clear();
    recentActivityIdsRef.current = { ids: new Set(), order: [] };

    setConnectionStatus('connecting');
    setLastError(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastError(null);
      reconnectAttemptsRef.current = 0;
      clearReconnectTimeout();
    });

    newSocket.on('connected', (data) => {
      console.log('🎉 WebSocket authentication successful:', data);
      toast.success('Connected to real-time updates');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      setLastError(error.message || 'Connection failed');
    });

    // Handle website status updates
    newSocket.on('website:status', (data) => {
      const eventKey = `${data.status}:${data.checkedAt}:${data.responseTime}:${data.region}`;
      const lastKey = lastStatusEventRef.current.get(data.websiteId);

      if (lastKey === eventKey) {
        return;
      }

      lastStatusEventRef.current.set(data.websiteId, eventKey);

      window.dispatchEvent(
        new CustomEvent('website:status', {
          detail: {
            ...data,
            websiteUrl: data.websiteUrl || `Website ${data.websiteId}`,
          },
        }),
      );
    });

    // Handle direct activity events for immediate UI updates
    newSocket.on('activity:new', (data) => {
      const activityState = recentActivityIdsRef.current;
      if (activityState.ids.has(data.id)) {
        return;
      }

      activityState.ids.add(data.id);
      activityState.order.push(data.id);

      if (activityState.order.length > 200) {
        const oldestId = activityState.order.shift();
        if (oldestId) {
          activityState.ids.delete(oldestId);
        }
      }

      window.dispatchEvent(new CustomEvent('activity:new', { detail: data }));
    });

    // Handle website added events
    newSocket.on('website:added', (data) => {
      console.log('➕ Website added:', data);
      window.dispatchEvent(new CustomEvent('website:added', { detail: data }));
      toast.success('New website added');
    });

    // Handle website deleted events
    newSocket.on('website:deleted', (data) => {
      console.log('🗑️ Website deleted:', data);

      // Enhanced event with more context for activity tracking
      window.dispatchEvent(
        new CustomEvent('website:deleted', {
          detail: {
            ...data,
            // The backend should provide websiteUrl, but we'll add fallback
            websiteUrl: data.websiteUrl || `Website ${data.websiteId}`,
          },
        }),
      );
      toast.success('Website removed');
    });

    setSocket(newSocket);

    // Cleanup on unmount or dependency change
    return () => {
      clearReconnectTimeout();
      newSocket.disconnect();
    };
  }, [isAuthenticated, token, user, clearReconnectTimeout]); // Removed 'socket' from dependencies

  const value = {
    socket,
    isConnected,
    connectionStatus,
    lastError,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
