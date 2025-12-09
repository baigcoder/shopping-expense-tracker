// Analytics Controller - Dashboard statistics and insights
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get spending summary (total, this month, last month)
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all-time stats
    const allTimeStats = await prisma.transaction.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true }
    });

    // This month spending
    const thisMonthStats = await prisma.transaction.aggregate({
        where: {
            userId,
            purchaseDate: { gte: startOfThisMonth }
        },
        _sum: { amount: true },
        _count: true
    });

    // Last month spending
    const lastMonthStats = await prisma.transaction.aggregate({
        where: {
            userId,
            purchaseDate: {
                gte: startOfLastMonth,
                lte: endOfLastMonth
            }
        },
        _sum: { amount: true }
    });

    const thisMonthTotal = Number(thisMonthStats._sum.amount || 0);
    const lastMonthTotal = Number(lastMonthStats._sum.amount || 0);

    // Calculate percentage change
    let percentageChange = 0;
    if (lastMonthTotal > 0) {
        percentageChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    res.json({
        success: true,
        data: {
            totalSpent: Number(allTimeStats._sum.amount || 0),
            transactionCount: allTimeStats._count,
            averageTransaction: Number(allTimeStats._avg.amount || 0),
            thisMonthSpent: thisMonthTotal,
            thisMonthCount: thisMonthStats._count,
            lastMonthSpent: lastMonthTotal,
            percentageChange: Math.round(percentageChange * 100) / 100
        }
    });
});

// Get monthly spending for the last 12 months
export const getMonthlySpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const months = parseInt(req.query.months as string) || 12;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            purchaseDate: { gte: startDate }
        },
        select: {
            amount: true,
            purchaseDate: true
        },
        orderBy: { purchaseDate: 'asc' }
    });

    // Group by month
    const monthlyData = new Map<string, { total: number; count: number }>();

    // Initialize all months
    for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(key, { total: 0, count: 0 });
    }

    // Aggregate transactions
    transactions.forEach(tx => {
        const date = new Date(tx.purchaseDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(key);
        if (existing) {
            existing.total += Number(tx.amount);
            existing.count += 1;
        }
    });

    // Convert to array
    const result = Array.from(monthlyData.entries())
        .map(([key, value]) => ({
            month: key,
            total: Math.round(value.total * 100) / 100,
            transactionCount: value.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
        success: true,
        data: result
    });
});

// Get spending by category
export const getCategorySpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where = {
        userId,
        ...(startDate && endDate && {
            purchaseDate: {
                gte: startDate,
                lte: endDate
            }
        })
    };

    const categorySpending = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: true
    });

    // Get category details
    const categories = await prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, icon: true, color: true }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const totalSpent = categorySpending.reduce(
        (sum, c) => sum + Number(c._sum.amount || 0),
        0
    );

    const result = categorySpending.map(cs => {
        const category = cs.categoryId ? categoryMap.get(cs.categoryId) : null;
        const total = Number(cs._sum.amount || 0);

        return {
            categoryId: cs.categoryId,
            categoryName: category?.name || 'Uncategorized',
            categoryIcon: category?.icon || '📦',
            categoryColor: category?.color || '#6b7280',
            total: Math.round(total * 100) / 100,
            transactionCount: cs._count,
            percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 10000) / 100 : 0
        };
    }).sort((a, b) => b.total - a.total);

    res.json({
        success: true,
        data: result
    });
});

// Get spending by store
export const getStoreSpending = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const storeSpending = await prisma.transaction.groupBy({
        by: ['storeName'],
        where: { userId },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: limit
    });

    const result = storeSpending.map(ss => ({
        storeName: ss.storeName,
        total: Math.round(Number(ss._sum.amount || 0) * 100) / 100,
        transactionCount: ss._count
    }));

    res.json({
        success: true,
        data: result
    });
});
