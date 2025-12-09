// Error Handler Middleware
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', err);

    // Zod Validation Error
    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
        return;
    }

    // Prisma Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    message: 'A record with this value already exists'
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    message: 'Record not found'
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
                return;
        }
    }

    // Custom App Error
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
        return;
    }

    // Unknown Error
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
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
export const createError = (message: string, statusCode: number): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
