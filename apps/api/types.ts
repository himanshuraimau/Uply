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


