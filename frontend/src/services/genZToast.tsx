// Gen-Z Toast with Sound Effects - Using Sonner
import { toast } from 'sonner';
import { notificationSound } from './notificationSoundService';

interface GenZToastOptions {
    playSound?: boolean;
    duration?: number;
}

const defaultOptions: GenZToastOptions = {
    playSound: true,
    duration: 4000, // 4 seconds auto-close
};

export const genZToast = {
    // Success toast with pop sound 🎉
    success: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }
        return toast.success(message, { duration: opts.duration });
    },

    // Error toast with alert sound ⚠️
    error: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playAlert();
        }
        return toast.error(message, { duration: opts.duration });
    },

    // Warning toast with ding sound 🔔
    warning: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        return toast.warning(message, { duration: opts.duration });
    },

    // Info toast with ding sound 💡
    info: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        return toast.info(message, { duration: opts.duration });
    },

    // Money/cash toast with coin sound 💰
    cash: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playCash();
        }
        return toast.success(`💰 ${message}`, { duration: opts.duration });
    },

    // Achievement toast with sparkle + level up sounds ✨
    achievement: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playSparkle();
            setTimeout(() => notificationSound.playLevelUp(), 300);
        }
        return toast.success(`🏆 ${message}`, { duration: opts.duration });
    },

    // Goal completed toast 🎯
    goalComplete: (goalName: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playLevelUp();
        }
        return toast.success(`🎯🎉 Congrats! You crushed your "${goalName}" goal!`, { duration: opts.duration });
    },

    // Budget alert toast 📊
    budgetAlert: (category: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playAlert();
        }
        return toast.warning(`📊⚠️ Budget alert: ${category} is over limit!`, { duration: opts.duration });
    },

    // Extension synced toast 🔗 - Auto closes in 4 seconds
    extensionSynced: (options?: GenZToastOptions) => {
        // Prevent showing toast if already shown this session
        const TOAST_SESSION_KEY = 'cashly_extension_sync_toast_shown';
        if (sessionStorage.getItem(TOAST_SESSION_KEY)) {
            console.log('Extension sync toast already shown this session, skipping');
            return;
        }
        sessionStorage.setItem(TOAST_SESSION_KEY, 'true');

        const opts = { ...defaultOptions, duration: 4000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }

        return toast.success('Extension Synced! ✨', {
            description: 'Now auto-tracking your purchases',
            duration: opts.duration,
        });
    },

    // Transaction detected toast 🛒
    transactionDetected: (storeName: string, amount: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 4000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playCash();
        }
        return toast.success('Purchase Tracked! 🛒', {
            description: `${storeName} • Rs ${amount.toLocaleString()}`,
            duration: opts.duration,
        });
    },

    // Savings milestone toast 🎊
    savingsMilestone: (amount: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 6000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playSparkle();
            setTimeout(() => notificationSound.playLevelUp(), 400);
        }
        return toast.success('Savings Milestone! 🎊🚀', {
            description: `You've saved Rs ${amount.toLocaleString()}!`,
            duration: opts.duration,
        });
    },

    // AI insight toast 🧠
    aiInsight: (insight: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        return toast.info('🧠 AI Insight', {
            description: insight,
            duration: opts.duration,
        });
    },

    // Streak notification 🔥
    streak: (days: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 4000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }
        const message = days >= 7
            ? `🔥 ${days} day streak! You're on fire!`
            : `🔥 ${days} day streak! Keep it up!`;
        return toast.success(message, { duration: opts.duration });
    },

    // Bill reminder toast 📅
    billReminder: (billName: string, daysUntil: number, amount?: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, duration: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        const urgency = daysUntil <= 1 ? '⚠️' : daysUntil <= 3 ? '📅' : '🗓️';
        const timeText = daysUntil === 0 ? 'Due today!' : daysUntil === 1 ? 'Due tomorrow!' : `Due in ${daysUntil} days`;
        const amountText = amount ? ` • Rs ${amount.toLocaleString()}` : '';
        return toast.warning(`${urgency} ${billName}: ${timeText}${amountText}`, { duration: opts.duration });
    },
};

export default genZToast;
