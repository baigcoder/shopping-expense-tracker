// Type definitions for Shopping Expense Tracker

export interface UserPayload {
    id: string;
    email: string;
    supabaseId: string;
}

export interface CreateUserDto {
    supabaseId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
}

export interface UserUpdateInput {
    name?: string;
    avatarUrl?: string;
    currency?: string;
}

export interface CreateTransactionDto {
    amount: number;
    currency?: string;
    storeName: string;
    storeUrl?: string;
    productName?: string;
    categoryId?: string;
    purchaseDate?: Date;
    notes?: string;
}

export interface UpdateTransactionDto {
    amount?: number;
    currency?: string;
    storeName?: string;
    storeUrl?: string;
    productName?: string;
    categoryId?: string;
    purchaseDate?: Date;
    notes?: string;
}

export interface CreateCategoryDto {
    name: string;
    icon?: string;
    color?: string;
}

export interface CreateBudgetDto {
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    categoryId?: string;
}

export interface AnalyticsSummary {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    thisMonthSpent: number;
    lastMonthSpent: number;
    percentageChange: number;
}

export interface MonthlySpending {
    month: string;
    year: number;
    total: number;
    transactionCount: number;
}

export interface CategorySpending {
    categoryId: string | null;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    percentage: number;
}

export interface StoreSpending {
    storeName: string;
    total: number;
    transactionCount: number;
}

// Express Request with User
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}
