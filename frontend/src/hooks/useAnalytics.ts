// React Query Hooks for Analytics
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '../store/useStore';

export const useAnalyticsSummary = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['analytics', 'summary'],
        queryFn: () => analyticsService.getSummary(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!user, // Only fetch when authenticated
    });
};

export const useMonthlySpending = (months = 12) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['analytics', 'monthly', months],
        queryFn: () => analyticsService.getMonthlySpending(months),
        staleTime: 1000 * 60 * 5,
        enabled: !!user,
    });
};

export const useCategorySpending = (startDate?: string, endDate?: string) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['analytics', 'category', startDate, endDate],
        queryFn: () => analyticsService.getCategorySpending(startDate, endDate),
        staleTime: 1000 * 60 * 5,
        enabled: !!user,
    });
};

export const useStoreSpending = (limit = 10) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['analytics', 'store', limit],
        queryFn: () => analyticsService.getStoreSpending(limit),
        staleTime: 1000 * 60 * 5,
        enabled: !!user,
    });
};
