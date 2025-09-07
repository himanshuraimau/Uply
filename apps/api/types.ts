import {z} from 'zod';

export const AuthInputSchema = z.object({
    username: z.string(),
    password: z.string().min(6),
});

export const WebsiteInputSchema = z.object({
    url: z.string().url("Invalid URL format"),
    isActive: z.boolean().optional().default(true)
});

export const PaginationSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
});

export interface ApiError {
    error: string;
    code?: string;
    details?: any;
}

export interface DashboardStats {
    totalWebsites: number;
    uptime: number;
    avgResponseTime: number;
    incidents: number;
}

export interface WebsiteStatus {
    id: string;
    websiteId: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    checkedAt: string;
    region: string;
}

export interface WebsiteWithStatus {
    id: string;
    url: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    currentStatus?: WebsiteStatus;
}

export interface ActivityItem {
    id: string;
    type: 'STATUS_CHANGE' | 'WEBSITE_ADDED' | 'WEBSITE_REMOVED';
    websiteId: string;
    websiteUrl: string;
    message: string;
    timestamp: string;
    status?: 'UP' | 'DOWN';
}

export interface DashboardResponse {
    stats: DashboardStats;
    websites: WebsiteWithStatus[];
    recentActivity: ActivityItem[];
}


