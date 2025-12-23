// Email Notification Service - Manage email notification preferences
import { supabase } from '../config/supabase';

export interface EmailNotificationPreferences {
    userId: string;
    // Transaction alerts
    transactionAlerts: boolean;
    transactionThreshold: number; // Alert for transactions above this amount

    // Bill reminders
    billReminders: boolean;
    billReminderDays: number; // Days before due date to send reminder

    // Budget alerts  
    budgetAlerts: boolean;
    budgetThreshold: number; // Percentage used to trigger alert (e.g., 80%)

    // Goal notifications
    goalMilestones: boolean; // Alert at 25%, 50%, 75%, 100%
    goalAchieved: boolean;

    // Subscription alerts
    subscriptionRenewal: boolean;
    subscriptionRenewalDays: number; // Days before renewal to alert
    trialExpiring: boolean;
    trialExpiringDays: number;

    // Summary emails
    weeklyDigest: boolean;
    monthlyReport: boolean;

    // Updated timestamp
    updatedAt: string;
}

const DEFAULT_PREFERENCES: Omit<EmailNotificationPreferences, 'userId' | 'updatedAt'> = {
    transactionAlerts: true,
    transactionThreshold: 100,
    billReminders: true,
    billReminderDays: 3,
    budgetAlerts: true,
    budgetThreshold: 80,
    goalMilestones: true,
    goalAchieved: true,
    subscriptionRenewal: true,
    subscriptionRenewalDays: 3,
    trialExpiring: true,
    trialExpiringDays: 2,
    weeklyDigest: true,
    monthlyReport: true
};

// Local storage key for preferences (fallback)
const PREFS_KEY = 'email_notification_prefs';

class EmailNotificationService {
    private cache: EmailNotificationPreferences | null = null;

    // Get user's email notification preferences
    async getPreferences(userId: string): Promise<EmailNotificationPreferences> {
        // Check cache first
        if (this.cache && this.cache.userId === userId) {
            return this.cache;
        }

        try {
            // Try to get from Supabase
            const { data, error } = await supabase
                .from('email_notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data && !error) {
                const prefs: EmailNotificationPreferences = {
                    userId: data.user_id,
                    transactionAlerts: data.transaction_alerts ?? DEFAULT_PREFERENCES.transactionAlerts,
                    transactionThreshold: data.transaction_threshold ?? DEFAULT_PREFERENCES.transactionThreshold,
                    billReminders: data.bill_reminders ?? DEFAULT_PREFERENCES.billReminders,
                    billReminderDays: data.bill_reminder_days ?? DEFAULT_PREFERENCES.billReminderDays,
                    budgetAlerts: data.budget_alerts ?? DEFAULT_PREFERENCES.budgetAlerts,
                    budgetThreshold: data.budget_threshold ?? DEFAULT_PREFERENCES.budgetThreshold,
                    goalMilestones: data.goal_milestones ?? DEFAULT_PREFERENCES.goalMilestones,
                    goalAchieved: data.goal_achieved ?? DEFAULT_PREFERENCES.goalAchieved,
                    subscriptionRenewal: data.subscription_renewal ?? DEFAULT_PREFERENCES.subscriptionRenewal,
                    subscriptionRenewalDays: data.subscription_renewal_days ?? DEFAULT_PREFERENCES.subscriptionRenewalDays,
                    trialExpiring: data.trial_expiring ?? DEFAULT_PREFERENCES.trialExpiring,
                    trialExpiringDays: data.trial_expiring_days ?? DEFAULT_PREFERENCES.trialExpiringDays,
                    weeklyDigest: data.weekly_digest ?? DEFAULT_PREFERENCES.weeklyDigest,
                    monthlyReport: data.monthly_report ?? DEFAULT_PREFERENCES.monthlyReport,
                    updatedAt: data.updated_at
                };
                this.cache = prefs;
                return prefs;
            }
        } catch (e) {
            console.log('Email prefs table may not exist, using localStorage fallback');
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(PREFS_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.userId === userId) {
                    this.cache = parsed;
                    return parsed;
                }
            } catch (e) {
                // Invalid JSON
            }
        }

        // Return defaults
        return {
            userId,
            ...DEFAULT_PREFERENCES,
            updatedAt: new Date().toISOString()
        };
    }

    // Save user's email notification preferences
    async savePreferences(prefs: EmailNotificationPreferences): Promise<boolean> {
        try {
            // Try to save to Supabase
            const { error } = await supabase
                .from('email_notification_preferences')
                .upsert({
                    user_id: prefs.userId,
                    transaction_alerts: prefs.transactionAlerts,
                    transaction_threshold: prefs.transactionThreshold,
                    bill_reminders: prefs.billReminders,
                    bill_reminder_days: prefs.billReminderDays,
                    budget_alerts: prefs.budgetAlerts,
                    budget_threshold: prefs.budgetThreshold,
                    goal_milestones: prefs.goalMilestones,
                    goal_achieved: prefs.goalAchieved,
                    subscription_renewal: prefs.subscriptionRenewal,
                    subscription_renewal_days: prefs.subscriptionRenewalDays,
                    trial_expiring: prefs.trialExpiring,
                    trial_expiring_days: prefs.trialExpiringDays,
                    weekly_digest: prefs.weeklyDigest,
                    monthly_report: prefs.monthlyReport,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            this.cache = { ...prefs, updatedAt: new Date().toISOString() };
            return true;
        } catch (e) {
            console.log('Could not save to Supabase, using localStorage');
        }

        // Fallback to localStorage
        try {
            const updated = { ...prefs, updatedAt: new Date().toISOString() };
            localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
            this.cache = updated;
            return true;
        } catch (e) {
            console.error('Failed to save email preferences:', e);
            return false;
        }
    }

    // Update a single preference
    async updatePreference<K extends keyof Omit<EmailNotificationPreferences, 'userId' | 'updatedAt'>>(
        userId: string,
        key: K,
        value: EmailNotificationPreferences[K]
    ): Promise<boolean> {
        const current = await this.getPreferences(userId);
        const updated = { ...current, [key]: value };
        return this.savePreferences(updated);
    }

    // Reset to defaults
    async resetToDefaults(userId: string): Promise<EmailNotificationPreferences> {
        const prefs: EmailNotificationPreferences = {
            userId,
            ...DEFAULT_PREFERENCES,
            updatedAt: new Date().toISOString()
        };
        await this.savePreferences(prefs);
        return prefs;
    }

    // Clear cache
    clearCache() {
        this.cache = null;
    }
}

export const emailNotificationService = new EmailNotificationService();

// Helper to check if a specific notification type is enabled
export const isNotificationEnabled = async (
    userId: string,
    type: keyof Omit<EmailNotificationPreferences, 'userId' | 'updatedAt' | keyof typeof DEFAULT_PREFERENCES>
): Promise<boolean> => {
    const prefs = await emailNotificationService.getPreferences(userId);
    return prefs[type as keyof EmailNotificationPreferences] === true;
};
