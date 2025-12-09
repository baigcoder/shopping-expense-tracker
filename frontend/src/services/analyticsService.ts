// Analytics Service - API calls for dashboard statistics
import api from './api';
import { AnalyticsSummary, MonthlySpending, CategorySpending, StoreSpending, ApiResponse } from '../types';

export const analyticsService = {
    // Get spending summary
    getSummary: async () => {
        const response = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary');
        return response.data;
    },

    // Get monthly spending breakdown
    getMonthlySpending: async (months = 12) => {
        const response = await api.get<ApiResponse<MonthlySpending[]>>(
            `/analytics/monthly?months=${months}`
        );
        return response.data;
    },

    // Get spending by category
    getCategorySpending: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get<ApiResponse<CategorySpending[]>>(
            `/analytics/by-category?${params.toString()}`
        );
        return response.data;
    },

    // Get spending by store
    getStoreSpending: async (limit = 10) => {
        const response = await api.get<ApiResponse<StoreSpending[]>>(
            `/analytics/by-store?limit=${limit}`
        );
        return response.data;
    },
};
