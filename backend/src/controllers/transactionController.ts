// Transaction Controller - canonical Supabase-backed transaction operations
import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { CreateTransactionInput, DetectedTransactionInput, UpdateTransactionInput } from '../validators/schemas.js';
import {
    createMoneyTransaction,
    deleteMoneyTransaction,
    getMoneyTransaction,
    listUserTransactions,
    listUserTransactionsPage,
    updateMoneyTransaction,
} from '../services/transactionDomainService.js';
import { createDetectedCandidate } from '../services/transactionInboxService.js';

const getCanonicalUserId = (req: Request) => req.user!.supabaseId || req.user!.id;

const mapCreateInput = (userId: string, data: CreateTransactionInput) => {
    const storeName = data.storeName.trim();
    const productName = data.productName?.trim() || null;

    return {
        user_id: userId,
        date: data.purchaseDate || new Date().toISOString(),
        description: productName ? `${storeName} - ${productName}` : storeName,
        amount: data.amount,
        type: 'expense' as const,
        category: data.category || data.categoryId || 'Shopping',
        source: 'manual-api',
        confidence: 1,
        store_name: storeName,
        product_name: productName,
        store_url: data.storeUrl || null,
        notes: data.notes || null,
    };
};

const mapUpdateInput = (data: UpdateTransactionInput) => {
    const storeName = data.storeName?.trim();
    const productName = data.productName?.trim();
    const description = storeName
        ? productName
            ? `${storeName} - ${productName}`
            : storeName
        : undefined;

    return {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.purchaseDate !== undefined && { date: data.purchaseDate }),
        ...(description !== undefined && { description }),
        ...(data.category !== undefined || data.categoryId !== undefined
            ? { category: data.category || data.categoryId || 'Other' }
            : {}),
        ...(data.storeName !== undefined && { store_name: storeName || null }),
        ...(data.productName !== undefined && { product_name: productName || null }),
        ...(data.storeUrl !== undefined && { store_url: data.storeUrl || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
    };
};

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = (req.query.category || req.query.categoryId) as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string || 'date';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

    const result = await listUserTransactionsPage(userId, {
        page,
        limit,
        category,
        search,
        sortBy,
        sortOrder,
    });

    res.json({
        success: true,
        data: result.transactions,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { id } = req.params;

    const transaction = await getMoneyTransaction(userId, id);

    if (!transaction) {
        throw createError('Transaction not found', 404);
    }

    res.json({
        success: true,
        data: transaction,
    });
});

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const data = req.body as CreateTransactionInput;

    const transaction = await createMoneyTransaction(mapCreateInput(userId, data));

    res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
    });
});

export const createDetectedTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const data = req.body as DetectedTransactionInput;

    const result = await createDetectedCandidate(userId, data);

    res.status(202).json({
        success: true,
        message: result.duplicate ? 'Detected transaction needs review and may be duplicate' : 'Detected transaction queued for review',
        pendingReview: true,
        data: result.candidate,
        candidate: result.candidate,
        transaction: result.candidate,
        duplicate: result.duplicate,
        duplicateTransaction: result.duplicateTransaction,
        transactionHash: result.candidate.transaction_hash,
    });
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { id } = req.params;
    const data = req.body as UpdateTransactionInput;

    const transaction = await updateMoneyTransaction(userId, id, mapUpdateInput(data));

    if (!transaction) {
        throw createError('Transaction not found', 404);
    }

    res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction,
    });
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { id } = req.params;
    const existing = await getMoneyTransaction(userId, id);

    if (!existing) {
        throw createError('Transaction not found', 404);
    }

    await deleteMoneyTransaction(userId, id);

    res.json({
        success: true,
        message: 'Transaction deleted successfully',
    });
});

export const getRecentTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const limit = parseInt(req.query.limit as string) || 5;
    const transactions = await listUserTransactions(userId, { limit });

    res.json({
        success: true,
        data: transactions,
    });
});
