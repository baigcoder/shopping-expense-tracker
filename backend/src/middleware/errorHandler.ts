// Error Handler Middleware
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'DEPENDENCY_FAILURE'
    | 'DATABASE_ERROR'
    | 'INTERNAL_ERROR';

export interface AppError extends Error {
    statusCode?: number;
    code?: ErrorCode;
    isOperational?: boolean;
    details?: unknown;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const requestId = (req.headers['x-request-id'] as string) || undefined;

    // Zod Validation Error
    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            errors,
            requestId,
        });
        return;
    }

    // Prisma Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch ((err as Prisma.PrismaClientKnownRequestError).code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    code: 'CONFLICT',
                    message: 'A record with this value already exists',
                    requestId,
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                    requestId,
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    code: 'DATABASE_ERROR',
                    message: 'Database error occurred',
                    requestId,
                });
                return;
        }
    }

    // Custom App Error
    if (err.isOperational) {
        const status = err.statusCode || 500;
        const code: ErrorCode =
            err.code ||
            (status === 400
                ? 'VALIDATION_ERROR'
                : status === 401
                ? 'UNAUTHORIZED'
                : status === 403
                ? 'FORBIDDEN'
                : status === 404
                ? 'NOT_FOUND'
                : status === 409
                ? 'CONFLICT'
                : status === 429
                ? 'RATE_LIMITED'
                : 'INTERNAL_ERROR');

        res.status(status).json({
            success: false,
            code,
            message: err.message,
            details: err.details,
            requestId,
        });
        return;
    }

    // Unknown Error - Never leak internal stack traces or secrets in production
    console.error(`[Unhandled Error] [Request ${requestId || 'unknown'}]:`, err);
    res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error',
        requestId,
    });
};

// Async Handler Wrapper
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Create Custom Error
export const createError = (message: string, statusCode: number, code?: ErrorCode, details?: unknown): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    error.details = details;
    return error;
};
