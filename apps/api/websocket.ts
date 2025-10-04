import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { subscribeToWebsiteTicks, type WebsiteTickEvent } from '@uply/redis/client';

interface JWTPayload {
    userId: string;
}

interface SocketData {
    userId: string;
}

interface ClientToServerEvents {
    subscribe: () => void;
}

interface ServerToClientEvents {
    connected: (data: { message: string; userId: string; timestamp: string }) => void;
    subscribed: (data: { userId: string; timestamp: string }) => void;
    'website:status': (data: {
        websiteId: string;
        status: 'UP' | 'DOWN';
        responseTime: number;
        checkedAt: string;
        region: string;
    }) => void;
    'website:added': (data: { website: unknown }) => void;
    'website:deleted': (data: { websiteId: string }) => void;
}

type AuthenticatedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function setupWebSocket(httpServer: HTTPServer) {
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://your-frontend-domain.com']
                : ['http://localhost:3000', 'http://localhost:3003'],
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            console.log('❌ WebSocket connection rejected: No token provided');
            return next(new Error('Authentication token required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
            socket.data.userId = decoded.userId;
            console.log(`✅ WebSocket authenticated for user: ${decoded.userId}`);
            next();
        } catch {
            console.log('❌ WebSocket connection rejected: Invalid token');
            return next(new Error('Invalid authentication token'));
        }
    });

    // Connection handling
    io.on('connection', (socket) => {
        const authenticatedSocket = socket as AuthenticatedSocket;
        const userId = authenticatedSocket.data.userId;
        const userRoom = `user:${userId}`;

        console.log(`🔌 WebSocket connected: ${authenticatedSocket.id} (User: ${userId})`);

        // Join user's private room
        authenticatedSocket.join(userRoom);
        console.log(`📨 User ${userId} joined room: ${userRoom}`);

        // Send connection confirmation
        authenticatedSocket.emit('connected', {
            message: 'Successfully connected to real-time updates',
            userId: userId,
            timestamp: new Date().toISOString()
        });

        // Handle disconnection
        authenticatedSocket.on('disconnect', (reason) => {
            console.log(`🔌 WebSocket disconnected: ${authenticatedSocket.id} (User: ${userId}) - Reason: ${reason}`);
        });

        // Handle errors
        authenticatedSocket.on('error', (error) => {
            console.error(`❌ WebSocket error for user ${userId}:`, error);
        });

        // Optional: Manual subscribe (though automatic via room)
        authenticatedSocket.on('subscribe', () => {
            console.log(`📡 User ${userId} manually subscribed to updates`);
            authenticatedSocket.emit('subscribed', { userId, timestamp: new Date().toISOString() });
        });
    });

    // Subscribe to Redis pub/sub and broadcast to relevant users
    subscribeToWebsiteTicks((tickData: WebsiteTickEvent) => {
        const userRoom = `user:${tickData.userId}`;
        
        console.log(`📢 Broadcasting tick to room ${userRoom}:`, {
            websiteId: tickData.websiteId,
            status: tickData.status,
            responseTime: tickData.responseTime
        });

        // Emit to user's room
        io.to(userRoom).emit('website:status', {
            websiteId: tickData.websiteId,
            status: tickData.status,
            responseTime: tickData.responseTime,
            checkedAt: tickData.checkedAt,
            region: tickData.region
        });
    });

    console.log('✅ WebSocket server initialized');
    console.log(`🌐 WebSocket CORS origins: ${process.env.NODE_ENV === 'production' ? 'production domain' : 'localhost:3000, localhost:3003'}`);

    return io;
}

// Helper function to emit website added event
export function emitWebsiteAdded(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, userId: string, website: unknown) {
    const userRoom = `user:${userId}`;
    io.to(userRoom).emit('website:added', { website });
    console.log(`📢 Emitted website:added to ${userRoom}`);
}

// Helper function to emit website deleted event
export function emitWebsiteDeleted(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, userId: string, websiteId: string) {
    const userRoom = `user:${userId}`;
    io.to(userRoom).emit('website:deleted', { websiteId });
    console.log(`📢 Emitted website:deleted to ${userRoom}`);
}
