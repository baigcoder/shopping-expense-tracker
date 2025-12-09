// TypeScript Types for Frontend
export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    currency: string;
    createdAt: string;
    _count?: {
        transactions: number;
        categories: number;
    };
}

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    storeName: string;
    storeUrl?: string;
    productName?: string;
    categoryId?: string;
    category?: Category;
    purchaseDate: string;
    createdAt: string;
    notes?: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    _count?: {
        transactions: number;
    };
}

export interface Budget {
    id: string;
    userId: string;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    categoryId?: string;
}

export interface AnalyticsSummary {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    thisMonthSpent: number;
    thisMonthCount: number;
    lastMonthSpent: number;
    percentageChange: number;
}

export interface MonthlySpending {
    month: string;
    total: number;
    transactionCount: number;
}

export interface CategorySpending {
    categoryId: string | null;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    transactionCount: number;
    percentage: number;
}

export interface StoreSpending {
    storeName: string;
    total: number;
    transactionCount: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Form Types
export interface TransactionFormData {
    amount: string;
    storeName: string;
    storeUrl?: string;
    productName?: string;
    categoryId?: string;
    purchaseDate: string;
    notes?: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface SignupFormData extends LoginFormData {
    name: string;
    confirmPassword: string;
}
