import { Router } from 'express';
import { prisma } from "store/client";
import jwt from 'jsonwebtoken';
import { AuthInputSchema } from './types';
import { authMiddleware } from './middleware';

const router = Router();

// User signup
router.post("/signup", async (req, res) => {
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
                email: data.data.email,
            }
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
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
router.post("/signin", async (req, res) => {
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
                username: user.username,
                email: user.email,
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
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
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
            email: user.email,
            createdAt: user.createdAt,
            websiteCount: user._count.websites
        });
    } catch (error) {
        console.error('Error fetching profile:', {
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
            error: "Failed to fetch profile",
            code: "FETCH_PROFILE_ERROR"
        });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const data = AuthInputSchema.partial().safeParse(req.body);
        if (!data.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: data.error
            });
        }

        const updateData: any = {};
        if (data.data.email !== undefined) updateData.email = data.data.email;
        if (data.data.password !== undefined) updateData.password = data.data.password;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
            }
        });

        res.json({
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error instanceof Error && error.message.includes('Prisma')) {
             if (error.message.includes('Unique constraint')) {
                 return res.status(409).json({
                     error: "Email already in use",
                     code: "EMAIL_EXISTS"
                 });
             }
        }
        res.status(500).json({ error: "Failed to update profile" });
    }
});

export default router;
