// API Service - Axios instance with Supabase Auth
import axios from 'axios';
import { supabase } from '../config/supabase';

// Ensure API URL ends with /api (only add if not already present)
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = rawApiUrl
    ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
    : '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authRequiredPrefixes = [
    '/ai',
    '/voice',
    '/plaid',
    '/reset',
    '/transaction-inbox',
    '/merchant-rules',
    '/imports',
    '/dashboard',
    '/onboarding',
    '/money-twin',
    '/cashflow-calendar',
    '/subscription-command-center',
    '/extension-health',
    '/reports',
    '/coach',
    '/settings',
];

const requiresAuth = (url = '') => {
    const path = url.startsWith('http') ? new URL(url).pathname.replace(/^\/api/, '') : url;
    return authRequiredPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        } else if (requiresAuth(config.url)) {
            throw new axios.CanceledError('Auth token is not ready yet');
        }
    } catch (error) {
        if (axios.isCancel(error)) {
            throw error;
        }
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
