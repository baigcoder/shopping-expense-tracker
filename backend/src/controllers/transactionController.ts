// Transaction Controller - CRUD operations for transactions
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { CreateTransactionInput, UpdateTransactionInput } from '../validators/schemas.js';
import { Decimal } from '@prisma/client/runtime/library';

// Get all transactions with pagination
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string || 'purchaseDate';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    const where = {
        userId,
        ...(categoryId && { categoryId }),
        ...(search && {
            OR: [
                { storeName: { contains: search, mode: 'insensitive' as const } },
                { productName: { contains: search, mode: 'insensitive' as const } },
            ]
        })
    };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, icon: true, color: true }
                }
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit
        }),
        prisma.transaction.count({ where })
    ]);

    res.json({
        success: true,
        data: transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// Get single transaction
export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
        where: { id, userId },
        include: {
            category: {
                select: { id: true, name: true, icon: true, color: true }
            }
        }
    });

    if (!transaction) {
        throw createError('Transaction not found', 404);
    }

    res.json({
        success: true,
        data: transaction
    });
});

// Create new transaction
export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = req.body as CreateTransactionInput;

    const transaction = await prisma.transaction.create({
        data: {
            userId,
            amount: new Decimal(data.amount),
            currency: data.currency || 'USD',
            storeName: data.storeName,
            storeUrl: data.storeUrl,
            productName: data.productName,
            categoryId: data.categoryId,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
            notes: data.notes
        },
        include: {
            category: {
                select: { id: true, name: true, icon: true, color: true }
            }
        }
    });

    res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
    });
});

// Update transaction
export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = req.body as UpdateTransactionInput;

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw createError('Transaction not found', 404);
    }

    const transaction = await prisma.transaction.update({
        where: { id },
        data: {
            ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
            ...(data.currency && { currency: data.currency }),
            ...(data.storeName && { storeName: data.storeName }),
            ...(data.storeUrl !== undefined && { storeUrl: data.storeUrl }),
            ...(data.productName !== undefined && { productName: data.productName }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
            ...(data.purchaseDate && { purchaseDate: new Date(data.purchaseDate) }),
            ...(data.notes !== undefined && { notes: data.notes })
        },
        include: {
            category: {
                select: { id: true, name: true, icon: true, color: true }
            }
        }
    });

    res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
    });
});

// Delete transaction
export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw createError('Transaction not found', 404);
    }

    await prisma.transaction.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Transaction deleted successfully'
    });
});

// Get recent transactions (for dashboard)
export const getRecentTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const transactions = await prisma.transaction.findMany({
        where: { userId },
        include: {
            category: {
                select: { id: true, name: true, icon: true, color: true }
            }
        },
        orderBy: { purchaseDate: 'desc' },
        take: limit
    });

    res.json({
        success: true,
        data: transactions
    });
});
