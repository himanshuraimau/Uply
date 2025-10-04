import { Router } from 'express';
import { prisma } from "store/client";
import type { DashboardResponse, WebsiteWithStatus, ActivityItem } from './types';
import { authMiddleware } from './middleware';

const router = Router();

// Get website status (latest tick)
router.get("/:websiteId", authMiddleware, async (req, res) => {
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

// Get dashboard overview
router.get('/', authMiddleware, async (req, res) => {
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

export default router;
