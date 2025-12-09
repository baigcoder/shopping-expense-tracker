// Notification Service - Dynamic notifications with real-time triggers
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'purchase' | 'budget_alert' | 'subscription' | 'goal' | 'info' | 'success' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    data?: any; // Additional data like amounts, categories, etc.
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
    getUnreadCount: () => number;
}

// Helper to generate ID
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to format time ago
export const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
};

// Get icon for notification type
export const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
        case 'purchase': return '🛒';
        case 'budget_alert': return '⚠️';
        case 'subscription': return '📅';
        case 'goal': return '🎯';
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'info':
        default: return '💡';
    }
};

// Get color for notification type
export const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
        case 'purchase': return '#3B82F6'; // Blue
        case 'budget_alert': return '#EF4444'; // Red
        case 'subscription': return '#8B5CF6'; // Purple
        case 'goal': return '#10B981'; // Green
        case 'success': return '#10B981'; // Green
        case 'warning': return '#F59E0B'; // Amber
        case 'info':
        default: return '#6B7280'; // Gray
    }
};

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: generateId(),
                    createdAt: new Date(),
                    read: false,
                };

                set((state) => ({
                    notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
                }));
            },

            markAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map(n =>
                        n.id === id ? { ...n, read: true } : n
                    )
                }));
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map(n => ({ ...n, read: true }))
                }));
            },

            clearNotification: (id) => {
                set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id)
                }));
            },

            clearAll: () => {
                set({ notifications: [] });
            },

            getUnreadCount: () => {
                return get().notifications.filter(n => !n.read).length;
            }
        }),
        {
            name: 'notifications-storage',
            partialize: (state) => ({ notifications: state.notifications })
        }
    )
);

// Notification triggers - call these from different parts of the app
export const notificationTriggers = {
    // When a new transaction is added
    onNewTransaction: (description: string, amount: number) => {
        useNotificationStore.getState().addNotification({
            type: 'purchase',
            title: 'New Transaction Added',
            message: `${description} - $${amount.toFixed(2)}`,
            data: { description, amount }
        });
    },

    // When budget reaches threshold
    onBudgetAlert: (category: string, percentUsed: number) => {
        const message = percentUsed >= 100
            ? `You've exceeded your ${category} budget!`
            : `${category} is at ${percentUsed}% of limit`;

        useNotificationStore.getState().addNotification({
            type: 'budget_alert',
            title: percentUsed >= 100 ? 'Budget Exceeded!' : 'Budget Alert',
            message,
            data: { category, percentUsed }
        });
    },

    // When subscription is about to renew
    onSubscriptionReminder: (name: string, daysUntil: number) => {
        useNotificationStore.getState().addNotification({
            type: 'subscription',
            title: 'Upcoming Renewal',
            message: `${name} renews in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            data: { name, daysUntil }
        });
    },

    // When goal is achieved
    onGoalAchieved: (goalName: string) => {
        useNotificationStore.getState().addNotification({
            type: 'goal',
            title: 'Goal Achieved! 🎉',
            message: `Congratulations! You've reached your "${goalName}" savings goal!`,
            data: { goalName }
        });
    },

    // When goal progress is made
    onGoalProgress: (goalName: string, percentComplete: number) => {
        useNotificationStore.getState().addNotification({
            type: 'goal',
            title: 'Goal Progress',
            message: `You're ${percentComplete}% towards your "${goalName}" goal!`,
            data: { goalName, percentComplete }
        });
    },

    // General info notification
    onInfo: (title: string, message: string) => {
        useNotificationStore.getState().addNotification({
            type: 'info',
            title,
            message
        });
    },

    // Success notification
    onSuccess: (title: string, message: string) => {
        useNotificationStore.getState().addNotification({
            type: 'success',
            title,
            message
        });
    },

    // Warning notification
    onWarning: (title: string, message: string) => {
        useNotificationStore.getState().addNotification({
            type: 'warning',
            title,
            message
        });
    },

    // Trial expiring soon
    onTrialExpiringSoon: (serviceName: string, daysRemaining: number) => {
        useNotificationStore.getState().addNotification({
            type: 'warning',
            title: '⏰ Trial Ending Soon!',
            message: `${serviceName} trial expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Cancel now to avoid charges!`,
            data: { serviceName, daysRemaining }
        });
    },

    // Trial expired
    onTrialExpired: (serviceName: string) => {
        useNotificationStore.getState().addNotification({
            type: 'budget_alert',
            title: '❌ Trial Expired!',
            message: `${serviceName} trial has ended. You may now be charged.`,
            data: { serviceName }
        });
    },

    // Recurring payment due
    onRecurringPaymentDue: (name: string, amount: number, daysUntil: number) => {
        useNotificationStore.getState().addNotification({
            type: 'subscription',
            title: '📅 Payment Coming Up',
            message: `${name} ($${amount}) is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            data: { name, amount, daysUntil }
        });
    },

    // Extension auto-tracked a purchase/trial
    onExtensionTracked: (name: string, type: 'purchase' | 'trial' | 'subscription', amount?: number) => {
        useNotificationStore.getState().addNotification({
            type: type === 'trial' ? 'subscription' : 'purchase',
            title: type === 'trial' ? '🎁 Trial Auto-Tracked!' : type === 'subscription' ? '💳 Subscription Added!' : '🛒 Purchase Tracked!',
            message: amount ? `${name} - $${amount.toFixed(2)}` : name,
            data: { name, type, amount }
        });
    }
};

export default useNotificationStore;
