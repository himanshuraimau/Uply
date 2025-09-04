import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
        (req as any).userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}