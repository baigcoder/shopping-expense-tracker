// Auth Middleware - Supabase Token Verification
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/supabase';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        supabaseId: string;
    };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify Supabase token
        const supabaseUser = await verifyToken(token);

        // Find or create user in our database
        let user = await prisma.user.findUnique({
            where: { supabaseId: supabaseUser.id },
        });

        if (!user) {
            // Auto-create user if not exists
            user = await prisma.user.create({
                data: {
                    supabaseId: supabaseUser.id,
                    email: supabaseUser.email!,
                    name: supabaseUser.user_metadata?.name || null,
                    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
                },
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            supabaseId: user.supabaseId,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const supabaseUser = await verifyToken(token);

            const user = await prisma.user.findUnique({
                where: { supabaseId: supabaseUser.id },
            });

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    supabaseId: user.supabaseId,
                };
            }
        }
    } catch {
        // Silent fail for optional auth
    }

    next();
};
