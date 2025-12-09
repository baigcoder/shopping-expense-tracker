// Zod Validation Schemas
import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
    firebaseUid: z.string().min(1, 'Firebase UID is required'),
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

// Transaction Schemas
export const createTransactionSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).default('USD'),
    storeName: z.string().min(1, 'Store name is required').max(100),
    storeUrl: z.string().url().optional().nullable(),
    productName: z.string().max(200).optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    purchaseDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Category Schemas
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(50),
    icon: z.string().max(10).default('🏷️'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#6366f1'),
});

// Budget Schemas
export const createBudgetSchema = z.object({
    amount: z.number().positive('Budget amount must be positive'),
    period: z.enum(['weekly', 'monthly', 'yearly']),
    categoryId: z.string().uuid().optional().nullable(),
});

// Query Schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
