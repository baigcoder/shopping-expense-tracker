// React Query Hooks for Transactions
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { TransactionFormData } from '../types';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

export const useTransactions = (filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
} = {}) => {
    const { user } = useAuthStore();

    // Disabled: Using Supabase directly in TransactionsPage
    // Enable this if you have a running backend at localhost:5000
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => transactionService.getAll(filters),
        enabled: false, // Disabled - no backend running
        retry: false,
    });
};

export const useRecentTransactions = (limit = 5) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['transactions', 'recent', limit],
        queryFn: () => transactionService.getRecent(limit),
        enabled: false, // Disabled - no backend running
        retry: false,
    });
};

export const useTransaction = (id: string) => {
    return useQuery({
        queryKey: ['transactions', id],
        queryFn: () => transactionService.getById(id),
        enabled: false, // Disabled - no backend running
        retry: false,
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: TransactionFormData) => {
            // Backend not connected - using Supabase directly
            throw new Error('Backend not connected');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            toast.success('Transaction added successfully!');
        },
        onError: (error: Error) => {
            // toast.error(error.message);
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: TransactionFormData }) => {
            // Backend not connected - using Supabase directly
            throw new Error('Backend not connected');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            toast.success('Transaction updated successfully!');
        },
        onError: (error: Error) => {
            // toast.error(error.message);
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Backend not connected - using Supabase directly
            throw new Error('Backend not connected');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            toast.success('Transaction deleted successfully!');
        },
        onError: (error: Error) => {
            // toast.error(error.message);
        },
    });
};
