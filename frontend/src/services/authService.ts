// Auth Service - For syncing with backend
import api from './api';
import { User, ApiResponse } from '../types';

export const authService = {
    // Register or get user in backend (called after Supabase auth)
    register: async (supabaseId: string, email: string, name?: string): Promise<ApiResponse<User>> => {
        const response = await api.post<ApiResponse<User>>('/auth/register', {
            supabaseId,
            email,
            name,
        });
        return response.data;
    },

    // Get current user profile
    getProfile: async (): Promise<ApiResponse<User>> => {
        const response = await api.get<ApiResponse<User>>('/auth/me');
        return response.data;
    },

    // Update user profile
    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await api.patch<ApiResponse<User>>('/auth/me', data);
        return response.data;
    },
};
