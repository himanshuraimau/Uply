import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { prisma } from "store/client";
import type { NextFunction, Request, Response } from 'express';
import { setupWebSocket } from './websocket';
import authRoutes from './auth.routes';
import { createWebsiteRoutes } from './website.routes';
import monitoringRoutes from './monitoring.routes';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const io = setupWebSocket(httpServer);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`❌ API Error [${requestId}]:`, {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp,
        body: req.method !== 'GET' ? req.body : undefined
    });
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let userMessage = 'An internal server error occurred';
    
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        userMessage = 'Invalid request data';
    } else if (err.message.includes('Prisma')) {
        if (err.message.includes('Record to update not found')) {
            statusCode = 404;
            errorCode = 'RESOURCE_NOT_FOUND';
            userMessage = 'The requested resource was not found';
        } else if (err.message.includes('Unique constraint')) {
            statusCode = 409;
            errorCode = 'RESOURCE_CONFLICT';
            userMessage = 'A resource with this information already exists';
        } else if (err.message.includes('Foreign key constraint')) {
            statusCode = 400;
            errorCode = 'INVALID_REFERENCE';
            userMessage = 'Invalid reference to related resource';
        } else {
            errorCode = 'DATABASE_ERROR';
            userMessage = 'Database operation failed';
        }
    } else if (err.message.includes('timeout')) {
        statusCode = 504;
        errorCode = 'TIMEOUT_ERROR';
        userMessage = 'Request timed out';
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        statusCode = 503;
        errorCode = 'SERVICE_UNAVAILABLE';
        userMessage = 'External service is currently unavailable';
    }
    
    res.status(statusCode).json({
        error: userMessage,
        code: errorCode,
        requestId,
        timestamp,
        ...(process.env.NODE_ENV === 'development' && { 
            details: err.message,
            stack: err.stack 
        })
    });
}

// Health check endpoint
app.get('/health', async (req, res) => {
    const timestamp = new Date().toISOString();
    let dbStatus = 'unknown';
    let dbError: string | null = null;
    
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'error';
        dbError = error instanceof Error ? error.message : String(error);
        console.error('Database health check failed:', error);
    }
    
    const isHealthy = dbStatus === 'connected';
    const statusCode = isHealthy ? 200 : 503;
    
    const healthData = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp,
        uptime: Math.floor(process.uptime()),
        database: {
            status: dbStatus,
            error: dbError
        },
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        memoryUsage: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
    };
    
    res.status(statusCode).json(healthData);
});

// Mount routes
app.use('/user', authRoutes);
app.use('/website', createWebsiteRoutes(io));
app.use('/websites', createWebsiteRoutes(io));
app.use('/status', monitoringRoutes);
app.use('/dashboard', monitoringRoutes);

// Apply error handler middleware
app.use(errorHandler);

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 API Server is running on port ${PORT}`);
    console.log(`🔌 WebSocket server is running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
