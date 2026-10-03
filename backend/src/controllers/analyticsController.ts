// Analytics Controller - Dashboard statistics and insights via AnalyticsDomainService
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
    getCategorySpendingBreakdown,
    getMonthlySpendingHistory,
    getSpendingSummary,
    getStoreSpendingBreakdown,
} from '../services/analyticsDomainService.js';

const getCanonicalUserId = (req: Request): string => {
    return req.user?.supabaseId || req.user?.id || '';
};

// Get spending summary (total, this month, last month)
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const summary = await getSpendingSummary(userId);

    res.json({
        success: true,
        data: summary,
    });
});

// Get monthly spending for the last N months
export const getMonthlySpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const months = parseInt(req.query.months as string, 10) || 12;

    const data = await getMonthlySpendingHistory(userId, months);

    res.json({
        success: true,
        data,
    });
});

// Get spending by category
export const getCategorySpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const data = await getCategorySpendingBreakdown(userId, startDate, endDate);

    res.json({
        success: true,
        data,
    });
});

// Get spending by store
export const getStoreSpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const data = await getStoreSpendingBreakdown(userId, limit);

    res.json({
        success: true,
        data,
    });
});
