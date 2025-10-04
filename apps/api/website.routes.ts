import { Router } from 'express';
import { prisma } from "store/client";
import { WebsiteInputSchema, PaginationSchema } from './types';
import type { WebsiteWithStatus } from './types';
import { authMiddleware } from './middleware';
import type { Server as SocketIOServer } from 'socket.io';
import { emitWebsiteAdded, emitWebsiteDeleted } from './websocket';

// Import the Socket.IO type interfaces from websocket.ts
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

export function createWebsiteRoutes(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
) {
    const router = Router();

    // Get all user websites
    router.get('/', authMiddleware, async (req, res) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

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
                userId: req.userId,
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
    router.post('/', authMiddleware, async (req, res) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            console.log('Raw request body:', req.body);
            console.log('Content-Type:', req.get('Content-Type'));
            
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
                    user_id: userId,
                    isActive: data.data.isActive
                }
            });
            
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
                userId: req.userId,
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
    router.get('/:websiteId', authMiddleware, async (req, res) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            const { websiteId } = req.params;
            const website = await prisma.website.findFirst({
                where: {
                    id: websiteId,
                    user_id: userId
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
                userId: req.userId,
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
    router.put('/:websiteId', authMiddleware, async (req, res) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

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
                    user_id: userId
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
                userId: req.userId,
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
    router.delete('/:websiteId', authMiddleware, async (req, res) => {
        try {
            // First verify userId exists, then use a type assertion to tell TypeScript it's definitely a string
            if (!req.userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            const userId = req.userId as string;
            const { websiteId } = req.params;

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
                userId: req.userId,
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

    // Get website status history
    router.get('/:websiteId/history', authMiddleware, async (req, res) => {
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

            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            // Verify website belongs to user
            const website = await prisma.website.findFirst({
                where: {
                    id: websiteId,
                    user_id: userId
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
                userId: req.userId,
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

    return router;
}
