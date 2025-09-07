import express from 'express';
import cors from 'cors';
import { prisma } from "store/client";
import { AuthInputSchema, WebsiteInputSchema, PaginationSchema } from './types';
import type { DashboardResponse, WebsiteWithStatus, ActivityItem } from './types';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware';
import type { NextFunction, Request, Response } from 'express';



const app = express();

// Enable CORS for all origins in development
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Replace with your production domain
        : ['http://localhost:3000', 'http://localhost:3001'], // Allow local development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error('API Error:', err);
    res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR"
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
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
                    take: 1
                }
            },
            orderBy: { timeAdded: 'desc' }
        });
        
        // Transform to match frontend expectations
        const transformedWebsites = websites.map(website => ({
            id: website.id,
            url: website.url,
            isActive: website.isActive,
            createdAt: website.timeAdded.toISOString(),
            updatedAt: website.timeAdded.toISOString(),
            userId: website.user_id,
            currentStatus: website.ticks[0] ? {
                id: website.ticks[0].id,
                websiteId: website.id,
                status: website.ticks[0].status as 'UP' | 'DOWN',
                responseTime: website.ticks[0].response_time_ms,
                checkedAt: website.ticks[0].createdAt.toISOString(),
                region: 'default'
            } : undefined
        }));
        
        res.json({ websites: transformedWebsites });
    } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).json({ error: "Failed to fetch websites" });
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
        res.status(201).json({
            id: website.id,
            url: website.url,
            isActive: website.isActive,
            createdAt: website.timeAdded.toISOString(),
            updatedAt: website.timeAdded.toISOString(),
            userId: website.user_id
        });
    } catch (error) {
        console.error('Error creating website:', error);
        res.status(500).json({ error: "Failed to create website" });
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
        console.error('Error fetching website:', error);
        res.status(500).json({ error: "Failed to fetch website" });
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
        console.error('Error updating website:', error);
        res.status(500).json({ error: "Failed to update website" });
    }
});

// Delete website
app.delete('/website/:websiteId', authMiddleware, async (req, res) => {
    try {
        const { websiteId } = req.params;

        const website = await prisma.website.findFirst({
            where: {
                id: websiteId,
                user_id: (req as any).userId
            }
        });

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        await prisma.website.delete({
            where: { id: websiteId }
        });

        res.json({
            success: true,
            message: "Website deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).json({ error: "Failed to delete website" });
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
        console.error('Error fetching status:', error);
        res.status(500).json({ error: "Failed to fetch status" });
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
        console.error('Error fetching history:', error);
        res.status(500).json({ error: "Failed to fetch history" });
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
                    take: 1
                }
            },
            orderBy: { timeAdded: 'desc' }
        });

        // Transform websites to match frontend expectations
        const transformedWebsites: WebsiteWithStatus[] = websites.map(website => ({
            id: website.id,
            url: website.url,
            isActive: website.isActive,
            createdAt: website.timeAdded.toISOString(),
            updatedAt: website.timeAdded.toISOString(),
            userId: website.user_id,
            currentStatus: website.ticks[0] ? {
                id: website.ticks[0].id,
                websiteId: website.id,
                status: website.ticks[0].status as 'UP' | 'DOWN',
                responseTime: website.ticks[0].response_time_ms,
                checkedAt: website.ticks[0].createdAt.toISOString(),
                region: 'default'
            } : undefined
        }));

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
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
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
        console.error('Signup error:', error);
        res.status(500).json({ error: "User creation failed" });
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
        console.error('Signin error:', error);
        res.status(500).json({ error: "Sign-in failed" });
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
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Apply error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server is running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});