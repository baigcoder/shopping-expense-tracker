// API Service - Axios instance with Supabase Auth
import axios from 'axios';
import { supabase } from '../config/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error getting auth token:', error);
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only sign out on 401 if we're NOT on auth-related endpoints
        // This prevents logout loops during registration/profile creation
        const isAuthEndpoint = error.config?.url?.includes('/auth/');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            console.warn('Unauthorized request, but not signing out automatically');
            // Don't auto sign out - let the useAuth hook handle session state
        }
        return Promise.reject(error);
    }
);

export default api;
