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

type VerifiedAuthUser = Awaited<ReturnType<typeof verifyToken>>;

const toRequestUser = (user: { id: string; email: string; supabaseId: string }) => ({
    id: user.id,
    email: user.email,
    supabaseId: user.supabaseId,
});

const toFallbackRequestUser = (authUser: VerifiedAuthUser) => ({
    id: authUser.id,
    email: authUser.email || '',
    supabaseId: authUser.id,
});

const DB_OPTIONAL_PREFIXES = [
    '/api/ai',
    '/api/voice',
    '/api/dashboard',
    '/api/onboarding',
    '/api/money-twin',
    '/api/settings',
    '/api/transaction-inbox',
    '/api/merchant-rules',
    '/api/imports',
    '/api/cashflow-calendar',
    '/api/subscription-command-center',
    '/api/extension-health',
    '/api/reports',
    '/api/coach',
];

const shouldSyncAuthDatabase = (req: Request) => {
    if (process.env.AUTH_DB_SYNC_ENABLED === 'false') return false;

    const path = req.originalUrl || req.url || '';
    if (DB_OPTIONAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
        return false;
    }

    return true;
};

const logAuthDatabaseError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Auth database lookup failed; continuing with verified UID fallback: ${message}`);
};

const findOrCreateAppUser = async (authUser: VerifiedAuthUser, createIfMissing: boolean) => {
    let user = await prisma.user.findUnique({
        where: { supabaseId: authUser.id },
    });

    if (!user && authUser.email) {
        const existingUser = await prisma.user.findUnique({
            where: { email: authUser.email },
        });

        if (existingUser) {
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    supabaseId: authUser.id,
                    name: existingUser.name || authUser.user_metadata?.name || null,
                    avatarUrl: existingUser.avatarUrl || authUser.user_metadata?.avatar_url || null,
                },
            });
        }
    }

    if (!user && createIfMissing) {
        if (!authUser.email) {
            throw new Error('Verified token does not include an email address');
        }

        user = await prisma.user.create({
            data: {
                supabaseId: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || null,
                avatarUrl: authUser.user_metadata?.avatar_url || null,
            },
        });
    }

    return user;
};

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

        req.user = toFallbackRequestUser(supabaseUser);

        // AI and voice routes key all user data by the verified UID, so they
        // should not fail or spam logs when the legacy Prisma database is down.
        if (shouldSyncAuthDatabase(req)) {
            try {
                const user = await findOrCreateAppUser(supabaseUser, true);
                req.user = user ? toRequestUser(user) : req.user;
            } catch (dbError) {
                logAuthDatabaseError(dbError);
            }
        }

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

            req.user = toFallbackRequestUser(supabaseUser);

            if (shouldSyncAuthDatabase(req)) {
                try {
                    const user = await findOrCreateAppUser(supabaseUser, false);
                    req.user = user ? toRequestUser(user) : req.user;
                } catch (dbError) {
                    logAuthDatabaseError(dbError);
                }
            }
        }
    } catch {
        // Silent fail for optional auth
    }

    next();
};
