// Subscriptions Service - Enhanced with Trial Tracking
import { supabase } from '../config/supabase';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface Subscription {
    id: string;
    user_id: string;
    name: string;
    logo: string;
    category: string;
    price: number;
    cycle: 'monthly' | 'yearly' | 'weekly';
    renew_date?: string;
    notification_enabled?: boolean;
    color: string;
    is_active: boolean;
    status: SubscriptionStatus;

    // Trial tracking fields
    is_trial: boolean;
    trial_start_date?: string;
    trial_end_date?: string;
    trial_days?: number;

    // Payment tracking
    start_date?: string;
    end_date?: string;
    last_payment_date?: string;
    next_payment_date?: string;

    created_at?: string;
    updated_at?: string;
}

export interface TrialInfo {
    isOnTrial: boolean;
    daysRemaining: number;
    trialEndDate: string | null;
    percentComplete: number;
}

export const subscriptionService = {
    // Get all subscriptions for user
    getAll: async (userId: string): Promise<Subscription[]> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return [];
        }

        // Calculate trial days remaining for each subscription
        return (data || []).map(sub => ({
            ...sub,
            ...calculateTrialInfo(sub)
        }));
    },

    // Get active subscriptions only
    getActive: async (userId: string): Promise<Subscription[]> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching active subscriptions:', error);
            return [];
        }

        return (data || []).map(sub => ({
            ...sub,
            ...calculateTrialInfo(sub)
        }));
    },

    // Get subscriptions on trial
    getTrials: async (userId: string): Promise<Subscription[]> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_trial', true)
            .eq('is_active', true)
            .order('trial_end_date', { ascending: true });

        if (error) {
            console.error('Error fetching trials:', error);
            return [];
        }

        return (data || []).map(sub => ({
            ...sub,
            ...calculateTrialInfo(sub)
        }));
    },

    // Get subscriptions expiring soon (within days)
    getExpiringSoon: async (userId: string, withinDays: number = 7): Promise<Subscription[]> => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + withinDays);

        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .or(`trial_end_date.lte.${futureDate.toISOString()},next_payment_date.lte.${futureDate.toISOString()}`);

        if (error) {
            console.error('Error fetching expiring subscriptions:', error);
            return [];
        }

        return (data || []).map(sub => ({
            ...sub,
            ...calculateTrialInfo(sub)
        }));
    },

    // Create a new subscription
    create: async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> => {
        // Calculate trial end date if trial days are specified
        let trialEndDate = subscription.trial_end_date;
        if (subscription.is_trial && subscription.trial_days && !trialEndDate) {
            const endDate = new Date(subscription.trial_start_date || new Date());
            endDate.setDate(endDate.getDate() + subscription.trial_days);
            trialEndDate = endDate.toISOString().split('T')[0];
        }

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                ...subscription,
                trial_end_date: trialEndDate,
                status: subscription.is_trial ? 'trial' : 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating subscription:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'create', data } }));
        return data;
    },

    // Start a trial for a subscription
    startTrial: async (
        userId: string,
        name: string,
        trialDays: number,
        details: Partial<Subscription> = {}
    ): Promise<Subscription | null> => {
        const today = new Date();
        const trialEndDate = new Date(today);
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        const subscription = {
            user_id: userId,
            name,
            logo: details.logo || '📦',
            category: details.category || 'Other',
            price: details.price || 0,
            cycle: details.cycle || 'monthly' as const,
            color: details.color || '#6366F1',
            is_active: true,
            is_trial: true,
            status: 'trial' as SubscriptionStatus,
            trial_start_date: today.toISOString().split('T')[0],
            trial_end_date: trialEndDate.toISOString().split('T')[0],
            trial_days: trialDays,
            start_date: today.toISOString().split('T')[0]
        };

        const { data, error } = await supabase
            .from('subscriptions')
            .insert(subscription)
            .select()
            .single();

        if (error) {
            console.error('Error starting trial:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'trial-started', data } }));
        return data;
    },

    // Convert trial to paid subscription
    convertToPaid: async (id: string, paymentDetails: {
        price: number;
        cycle: 'monthly' | 'yearly' | 'weekly';
        next_payment_date?: string;
    }): Promise<Subscription | null> => {
        const today = new Date();
        const nextPayment = paymentDetails.next_payment_date || calculateNextPaymentDate(paymentDetails.cycle);

        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                is_trial: false,
                status: 'active',
                price: paymentDetails.price,
                cycle: paymentDetails.cycle,
                last_payment_date: today.toISOString().split('T')[0],
                next_payment_date: nextPayment
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error converting to paid:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'converted', data } }));
        return data;
    },

    // Update a subscription
    update: async (id: string, updates: Partial<Subscription>): Promise<Subscription | null> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating subscription:', error);
            return null;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'update', data } }));
        return data;
    },

    // Cancel a subscription (soft delete)
    cancel: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('subscriptions')
            .update({
                is_active: false,
                status: 'cancelled',
                end_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', id);

        if (error) {
            console.error('Error cancelling subscription:', error);
            return false;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'cancel', id } }));
        return true;
    },

    // Delete a subscription (hard delete)
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting subscription:', error);
            return false;
        }

        // Notify listeners that data changed
        window.dispatchEvent(new CustomEvent('subscription-changed', { detail: { action: 'delete', id } }));
        return true;
    },

    // Check and update expired trials/subscriptions
    checkAndUpdateExpired: async (userId: string): Promise<number> => {
        const today = new Date().toISOString().split('T')[0];

        // Update expired trials
        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                is_active: false,
                status: 'expired',
                end_date: today
            })
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('is_trial', true)
            .lt('trial_end_date', today)
            .select();

        if (error) {
            console.error('Error updating expired trials:', error);
            return 0;
        }

        return data?.length || 0;
    },

    // Get trial status for a specific subscription
    getTrialInfo: (subscription: Subscription): TrialInfo => {
        return calculateTrialInfo(subscription);
    }
};

// Helper: Calculate trial info
function calculateTrialInfo(sub: any): TrialInfo {
    if (!sub.is_trial || !sub.trial_end_date) {
        return {
            isOnTrial: false,
            daysRemaining: 0,
            trialEndDate: null,
            percentComplete: 100
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(sub.trial_end_date);
    endDate.setHours(0, 0, 0, 0);

    const startDate = sub.trial_start_date ? new Date(sub.trial_start_date) : new Date(sub.created_at);
    startDate.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysUsed = totalDays - daysRemaining;
    const percentComplete = totalDays > 0 ? Math.min(100, Math.max(0, (daysUsed / totalDays) * 100)) : 0;

    return {
        isOnTrial: daysRemaining > 0,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndDate: sub.trial_end_date,
        percentComplete
    };
}

// Helper: Calculate next payment date based on cycle
function calculateNextPaymentDate(cycle: 'monthly' | 'yearly' | 'weekly'): string {
    const date = new Date();

    switch (cycle) {
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date.toISOString().split('T')[0];
}

export default subscriptionService;
