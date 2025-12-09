// Category Service - API calls for categories
import api from './api';
import { Category, ApiResponse } from '../types';

export const categoryService = {
    // Get all categories
    getAll: async () => {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data;
    },

    // Create category
    create: async (data: { name: string; icon?: string; color?: string }) => {
        const response = await api.post<ApiResponse<Category>>('/categories', data);
        return response.data;
    },

    // Update category
    update: async (id: string, data: Partial<{ name: string; icon: string; color: string }>) => {
        const response = await api.patch<ApiResponse<Category>>(`/categories/${id}`, data);
        return response.data;
    },

    // Delete category
    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/categories/${id}`);
        return response.data;
    },
};
