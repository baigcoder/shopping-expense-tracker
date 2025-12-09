// Transaction Service - API calls for transactions
import api from './api';
import { Transaction, ApiResponse, PaginatedResponse, TransactionFormData } from '../types';

interface TransactionFilters {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const transactionService = {
    // Get all transactions with pagination
    getAll: async (filters: TransactionFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, String(value));
            }
        });

        const response = await api.get<PaginatedResponse<Transaction[]>>(
            `/transactions?${params.toString()}`
        );
        return response.data;
    },

    // Get recent transactions
    getRecent: async (limit = 5) => {
        const response = await api.get<ApiResponse<Transaction[]>>(
            `/transactions/recent?limit=${limit}`
        );
        return response.data;
    },

    // Get single transaction
    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
        return response.data;
    },

    // Create transaction
    create: async (data: TransactionFormData) => {
        const payload = {
            amount: parseFloat(data.amount),
            storeName: data.storeName,
            storeUrl: data.storeUrl || null,
            productName: data.productName || null,
            categoryId: data.categoryId || null,
            purchaseDate: data.purchaseDate || new Date().toISOString(),
            notes: data.notes || null,
        };

        const response = await api.post<ApiResponse<Transaction>>('/transactions', payload);
        return response.data;
    },

    // Update transaction
    update: async (id: string, data: Partial<TransactionFormData>) => {
        const payload: Record<string, unknown> = {};

        if (data.amount) payload.amount = parseFloat(data.amount);
        if (data.storeName) payload.storeName = data.storeName;
        if (data.storeUrl !== undefined) payload.storeUrl = data.storeUrl || null;
        if (data.productName !== undefined) payload.productName = data.productName || null;
        if (data.categoryId !== undefined) payload.categoryId = data.categoryId || null;
        if (data.purchaseDate) payload.purchaseDate = data.purchaseDate;
        if (data.notes !== undefined) payload.notes = data.notes || null;

        const response = await api.patch<ApiResponse<Transaction>>(`/transactions/${id}`, payload);
        return response.data;
    },

    // Delete transaction
    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
        return response.data;
    },
};
