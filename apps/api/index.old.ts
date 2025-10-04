import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { prisma } from "store/client";
import { AuthInputSchema, WebsiteInputSchema, PaginationSchema } from './types';
import type { DashboardResponse, WebsiteWithStatus, ActivityItem } from './types';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware';
import type { NextFunction, Request, Response } from 'express';
import { setupWebSocket, emitWebsiteAdded, emitWebsiteDeleted } from './websocket';


const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const io = setupWebSocket(httpServer);

// Enable CORS for all origins in development
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Replace with your production domain
        : ['http://localhost:3000', 'http://localhost:3003'], // Allow local development
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
    
    // Log error with context
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
    
    // Determine error type and appropriate response
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

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    const timestamp = new Date().toISOString();
    let dbStatus = 'unknown';
    let dbError: string | null = null;
    
    // Test database connection
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


// Get all user websites
app.get('/websites', authMiddleware, async (req, res) => {
    try {
        const websites = await prisma.website.findMany({
            where: {
                user_id: (req as any).userId,
                isActive: true
            },
            include: {
                ticks: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        region: true
                    }
                }
            },
            orderBy: { timeAdded: 'desc' }
        });
        
        // Calculate uptime and avg response time for each website
        const transformedWebsites: WebsiteWithStatus[] = await Promise.all(
            websites.map(async (website) => {
                // Get last 100 ticks for uptime calculation
                const recentTicks = await prisma.websiteTick.findMany({
                    where: { website_id: website.id },
                    orderBy: { createdAt: 'desc' },
                    take: 100
                });

                let uptime = 100;
                let avgResponseTime = 0;

                if (recentTicks.length > 0) {
                    const upTicks = recentTicks.filter(tick => tick.status === 'UP').length;
                    uptime = (upTicks / recentTicks.length) * 100;
                    
                    const totalResponseTime = recentTicks.reduce((sum, tick) => sum + tick.response_time_ms, 0);
                    avgResponseTime = Math.round(totalResponseTime / recentTicks.length);
                }

                return {
                    id: website.id,
                    url: website.url,
                    isActive: website.isActive,
                    createdAt: website.timeAdded.toISOString(),
                    updatedAt: website.timeAdded.toISOString(),
                    userId: website.user_id,
                    uptime,
                    avgResponseTime,
                    currentStatus: website.ticks[0] ? {
                        id: website.ticks[0].id,
                        websiteId: website.id,
                        status: website.ticks[0].status as 'UP' | 'DOWN',
                        responseTime: website.ticks[0].response_time_ms,
                        
                        checkedAt: website.ticks[0].createdAt.toISOString(),
                        region: website.ticks[0].region.name
                    } : undefined
                };
            })
        );
        
        res.json({ websites: transformedWebsites });
    } catch (error) {
        console.error('Error fetching websites:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch websites",
            code: "FETCH_WEBSITES_ERROR"
        });
    }
});

// Add website
app.post('/website', authMiddleware, async (req, res) => {
    try {
        console.log('Raw request body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Request method:', req.method);
        console.log('All headers:', JSON.stringify(req.headers, null, 2));
        
        // Check if body is empty or undefined
        if (!req.body || typeof req.body !== 'object') {
            console.log('Request body is invalid:', req.body);
            return res.status(400).json({
                error: "Request body is missing or invalid",
                details: "Expected JSON object with url and isActive properties"
            });
        }
        
        const data = WebsiteInputSchema.safeParse(req.body);
        console.log('Validation result:', data);
        
        if (!data.success) {
            console.log('Validation failed:', data.error);
            return res.status(400).json({
                error: "Invalid input",
                details: data.error.format()
            });
        }

        const website = await prisma.website.create({
            data: {
                url: data.data.url,
                timeAdded: new Date(),
                user_id: (req as any).userId,
                isActive: data.data.isActive
            }
        });
        
        // Return in the format expected by frontend
        const responseData = {
            id: website.id,
            url: website.url,
            isActive: website.isActive,
            createdAt: website.timeAdded.toISOString(),
            updatedAt: website.timeAdded.toISOString(),
            userId: website.user_id
        };
        
        // Emit WebSocket event for real-time update
        emitWebsiteAdded(io, website.user_id, responseData);
        
        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error creating website:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            requestBody: req.body,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return res.status(409).json({ 
                    error: "A website with this URL already exists",
                    code: "WEBSITE_EXISTS"
                });
            } else if (error.message.includes('Prisma')) {
                return res.status(503).json({ 
                    error: "Database service is currently unavailable",
                    code: "DATABASE_UNAVAILABLE"
                });
            }
        }
        
        res.status(500).json({ 
            error: "Failed to create website",
            code: "CREATE_WEBSITE_ERROR"
        });
    }
});

// Get single website details
app.get('/website/:websiteId', authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;
        const website = await prisma.website.findFirst({
            where: {
                id: websiteId,
                user_id: (req as any).userId
            },
            include: {
                ticks: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        res.json(website);
    } catch (error) {
        console.error('Error fetching website:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            websiteId: req.params.websiteId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch website",
            code: "FETCH_WEBSITE_ERROR"
        });
    }
});

// Update website
app.put('/website/:websiteId', authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;
        const data = WebsiteInputSchema.partial().safeParse(req.body);

        if (!data.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: data.error
            });
        }

        const website = await prisma.website.updateMany({
            where: {
                id: websiteId,
                user_id: (req as any).userId
            },
            data: data.data
        });

        if (website.count === 0) {
            return res.status(404).json({ error: "Website not found" });
        }

        const updatedWebsite = await prisma.website.findUnique({
            where: { id: websiteId }
        });

        res.json(updatedWebsite);
    } catch (error) {
        console.error('Error updating website:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            websiteId: req.params.websiteId,
            requestBody: req.body,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to update website",
            code: "UPDATE_WEBSITE_ERROR"
        });
    }
});

// Delete website
app.delete('/website/:websiteId', authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;
        const userId = (req as any).userId;

        const website = await prisma.website.findFirst({
            where: {
                id: websiteId,
                user_id: userId
            }
        });

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        await prisma.website.delete({
            where: { id: websiteId }
        });

        // Emit WebSocket event for real-time update
        emitWebsiteDeleted(io, userId, websiteId);

        res.json({
            success: true,
            message: "Website deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting website:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            websiteId: req.params.websiteId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to delete website",
            code: "DELETE_WEBSITE_ERROR"
        });
    }
});


// Get website status (latest tick)
app.get("/status/:websiteId", authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;
        const website = await prisma.website.findFirst({
            where: {
                user_id: (req as any).userId,
                id: websiteId,
            },
            include: {
                ticks: {
                    orderBy: [{
                        createdAt: 'desc'
                    }],
                    take: 1
                }
            }
        });

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        const lastTick = website.ticks[0];
        if (!lastTick) {
            return res.status(404).json({ error: "No status available" });
        }

        res.json(lastTick);
    } catch (error) {
        console.error('Error fetching status:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            websiteId: req.params.websiteId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch status",
            code: "FETCH_STATUS_ERROR"
        });
    }
});

// Get website status history
app.get('/website/:websiteId/history', authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;
        const query = PaginationSchema.safeParse(req.query);

        if (!query.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                details: query.error
            });
        }

        const { limit, offset } = query.data;

        // Verify website belongs to user
        const website = await prisma.website.findFirst({
            where: {
                id: websiteId,
                user_id: (req as any).userId
            }
        });

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        const ticks = await prisma.websiteTick.findMany({
            where: { website_id: websiteId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                region: true
            }
        });

        const total = await prisma.websiteTick.count({
            where: { website_id: websiteId }
        });

        res.json({
            data: ticks,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        console.error('Error fetching history:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            websiteId: req.params.websiteId,
            query: req.query,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch history",
            code: "FETCH_HISTORY_ERROR"
        });
    }
});

// Get dashboard overview
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).userId;

        // Get websites with their latest status
        const websites = await prisma.website.findMany({
            where: {
                user_id: userId,
                isActive: true
            },
            include: {
                ticks: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        region: true
                    }
                }
            },
            orderBy: { timeAdded: 'desc' }
        });

        // Transform websites to match frontend expectations with calculated metrics
        const transformedWebsites: WebsiteWithStatus[] = await Promise.all(
            websites.map(async (website) => {
                // Get last 100 ticks for uptime calculation
                const recentTicks = await prisma.websiteTick.findMany({
                    where: { website_id: website.id },
                    orderBy: { createdAt: 'desc' },
                    take: 100
                });

                let uptime = 100;
                let avgResponseTime = 0;

                if (recentTicks.length > 0) {
                    const upTicks = recentTicks.filter(tick => tick.status === 'UP').length;
                    uptime = (upTicks / recentTicks.length) * 100;
                    
                    const totalResponseTime = recentTicks.reduce((sum, tick) => sum + tick.response_time_ms, 0);
                    avgResponseTime = Math.round(totalResponseTime / recentTicks.length);
                }

                return {
                    id: website.id,
                    url: website.url,
                    isActive: website.isActive,
                    createdAt: website.timeAdded.toISOString(),
                    updatedAt: website.timeAdded.toISOString(),
                    userId: website.user_id,
                    uptime,
                    avgResponseTime,
                    currentStatus: website.ticks[0] ? {
                        id: website.ticks[0].id,
                        websiteId: website.id,
                        status: website.ticks[0].status as 'UP' | 'DOWN',
                        responseTime: website.ticks[0].response_time_ms,
                        
                        checkedAt: website.ticks[0].createdAt.toISOString(),
                        region: website.ticks[0].region.name
                    } : undefined
                };
            })
        );

        // Calculate stats
        let upCount = 0;
        let downCount = 0;
        let totalResponseTime = 0;
        let sitesWithData = 0;

        transformedWebsites.forEach(website => {
            if (website.currentStatus) {
                if (website.currentStatus.status === 'UP') {
                    upCount++;
                } else {
                    downCount++;
                }
                totalResponseTime += website.currentStatus.responseTime;
                sitesWithData++;
            }
        });

        const totalWebsites = transformedWebsites.length;
        const avgResponseTime = sitesWithData > 0 ? Math.round(totalResponseTime / sitesWithData) : 0;
        const uptime = totalWebsites > 0 ? Math.round((upCount / totalWebsites) * 100) : 100;
        const incidents = downCount;

        // Generate recent activity from recent website ticks
        const recentTicks = await prisma.websiteTick.findMany({
            where: {
                website: {
                    user_id: userId,
                    isActive: true
                }
            },
            include: {
                website: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const recentActivity: ActivityItem[] = recentTicks.map(tick => ({
            id: tick.id,
            type: 'STATUS_CHANGE' as const,
            websiteId: tick.website_id,
            websiteUrl: tick.website.url,
            message: `Website ${tick.website.url} is ${tick.status.toLowerCase()}`,
            timestamp: tick.createdAt.toISOString(),
            status: tick.status as 'UP' | 'DOWN'
        }));

        const dashboardResponse: DashboardResponse = {
            stats: {
                totalWebsites,
                uptime,
                avgResponseTime,
                incidents
            },
            websites: transformedWebsites,
            recentActivity
        };

        res.json(dashboardResponse);
    } catch (error) {
        console.error('Error fetching dashboard:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch dashboard data",
            code: "FETCH_DASHBOARD_ERROR"
        });
    }
});

// User signup
app.post("/user/signup", async (req, res) => {
    try {
        const data = AuthInputSchema.safeParse(req.body);
        if (!data.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: data.error
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username: data.data.username }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Username already exists",
                code: "USER_EXISTS"
            });
        }

        const user = await prisma.user.create({
            data: {
                username: data.data.username,
                password: data.data.password,
            }
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            message: "User created successfully"
        });
    } catch (error) {
        console.error('Signup error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            username: req.body?.username,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "User creation failed",
            code: "SIGNUP_ERROR"
        });
    }
});

// User signin
app.post("/user/signin", async (req, res) => {
    try {
        const data = AuthInputSchema.safeParse(req.body);
        if (!data.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: data.error
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                username: data.data.username,
            }
        });

        if (!user || user.password !== data.data.password) {
            return res.status(401).json({
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS"
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string);
        if (!token) {
            return res.status(500).json({ error: "Token generation failed" });
        }

        res.status(200).json({
            jwt: token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Signin error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            username: req.body?.username,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Sign-in failed",
            code: "SIGNIN_ERROR"
        });
    }
});

// Get user profile
app.get('/user/profile', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                createdAt: true,
                _count: {
                    select: {
                        websites: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            websiteCount: user._count.websites
        });
    } catch (error) {
        console.error('Error fetching profile:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: (req as any).userId,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof Error && error.message.includes('Prisma')) {
            return res.status(503).json({ 
                error: "Database service is currently unavailable",
                code: "DATABASE_UNAVAILABLE"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to fetch profile",
            code: "FETCH_PROFILE_ERROR"
        });
    }
});

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