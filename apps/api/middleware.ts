import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                error: "No authorization header provided",
                code: "NO_AUTH_HEADER"
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                error: "No token provided",
                code: "NO_TOKEN"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return res.status(500).json({ 
                error: "Server configuration error",
                code: "CONFIG_ERROR"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        (req as any).userId = decoded.userId;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ 
                error: "Invalid token",
                code: "INVALID_TOKEN"
            });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ 
                error: "Token expired",
                code: "TOKEN_EXPIRED"
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: "Authentication failed",
            code: "AUTH_ERROR"
        });
    }
}