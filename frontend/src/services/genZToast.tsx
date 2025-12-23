// Gen-Z Toast with Sound Effects - Enhanced v2.0
import { toast, ToastOptions } from 'react-toastify';
import { notificationSound } from './notificationSoundService';

interface GenZToastOptions extends ToastOptions {
    playSound?: boolean;
}

const defaultOptions: GenZToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    playSound: true,
};

export const genZToast = {
    // Success toast with pop sound 🎉
    success: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }
        return toast.success(message, opts);
    },

    // Error toast with alert sound ⚠️
    error: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playAlert();
        }
        return toast.error(message, opts);
    },

    // Warning toast with ding sound 🔔
    warning: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        return toast.warning(message, opts);
    },

    // Info toast with ding sound 💡
    info: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }
        return toast.info(message, opts);
    },

    // Money/cash toast with coin sound 💰
    cash: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playCash();
        }
        return toast.success(`💰 ${message}`, opts);
    },

    // Achievement toast with sparkle + level up sounds ✨
    achievement: (message: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playSparkle();
            setTimeout(() => notificationSound.playLevelUp(), 300);
        }
        return toast.success(`🏆 ${message}`, opts);
    },

    // Goal completed toast 🎯
    goalComplete: (goalName: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playLevelUp();
        }
        return toast.success(`🎯🎉 Congrats! You crushed your "${goalName}" goal!`, opts);
    },

    // Budget alert toast 📊
    budgetAlert: (category: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, ...options };
        if (opts.playSound !== false) {
            notificationSound.playAlert();
        }
        return toast.warning(`📊⚠️ Budget alert: ${category} is over limit!`, opts);
    },

    // Extension synced toast 🔗
    extensionSynced: (options?: GenZToastOptions) => {
        // Prevent showing toast if already shown this session
        const TOAST_SESSION_KEY = 'cashly_extension_sync_toast_shown';
        if (sessionStorage.getItem(TOAST_SESSION_KEY)) {
            console.log('Extension sync toast already shown this session, skipping');
            return;
        }
        sessionStorage.setItem(TOAST_SESSION_KEY, 'true');

        const opts = {
            ...defaultOptions,
            autoClose: 5000,
            toastId: 'extension-synced-notification',
            hideProgressBar: false,
            closeButton: true,
            ...options
        };

        if (opts.playSound !== false) {
            notificationSound.playPop();
        }

        const content = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>🔗</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#FFFFFF',
                        lineHeight: '1.2'
                    }}>
                        Extension Synced!
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#CBD5E1',
                        fontWeight: 400,
                        lineHeight: '1.4'
                    }}>
                        Now auto-tracking your purchases
                    </div>
                </div>
            </div>
        );

        return toast.success(content, {
            ...opts,
            className: 'cashly-toast-extension',
        });
    },

    // NEW: Transaction detected toast 🛒
    transactionDetected: (storeName: string, amount: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 4000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playCash();
        }

        const content = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>🛒</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#FFFFFF',
                        lineHeight: '1.2'
                    }}>
                        Purchase Tracked!
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#CBD5E1',
                        fontWeight: 400,
                        lineHeight: '1.4'
                    }}>
                        {storeName} • Rs {amount.toLocaleString()}
                    </div>
                </div>
            </div>
        );

        return toast.success(content, {
            ...opts,
            toastId: `transaction-${Date.now()}`,
            className: 'cashly-toast-transaction',
        });
    },

    // NEW: Savings milestone toast 🎊
    savingsMilestone: (amount: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 6000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playSparkle();
            setTimeout(() => notificationSound.playLevelUp(), 400);
        }

        const content = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>🎊</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: '#FFFFFF',
                        lineHeight: '1.2'
                    }}>
                        Savings Milestone! 🚀
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: '#A7F3D0',
                        fontWeight: 600,
                        lineHeight: '1.4'
                    }}>
                        You've saved Rs {amount.toLocaleString()}!
                    </div>
                </div>
            </div>
        );

        return toast.success(content, {
            ...opts,
            toastId: 'savings-milestone',
            className: 'cashly-toast-milestone',
        });
    },

    // NEW: AI insight toast 🧠
    aiInsight: (insight: string, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }

        const content = (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '22px', lineHeight: 1.2 }}>🧠</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#FFFFFF',
                        lineHeight: '1.2',
                        marginBottom: '4px'
                    }}>
                        AI Insight
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#E2E8F0',
                        fontWeight: 400,
                        lineHeight: '1.4'
                    }}>
                        {insight}
                    </div>
                </div>
            </div>
        );

        return toast.info(content, {
            ...opts,
            toastId: `ai-insight-${Date.now()}`,
            className: 'cashly-toast-ai',
        });
    },

    // NEW: Streak notification 🔥
    streak: (days: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 4000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }

        const message = days >= 7
            ? `🔥 ${days} day streak! You're on fire!`
            : `🔥 ${days} day streak! Keep it up!`;

        return toast.success(message, {
            ...opts,
            toastId: 'streak-notification',
        });
    },

    // NEW: Bill reminder toast 📅
    billReminder: (billName: string, daysUntil: number, amount?: number, options?: GenZToastOptions) => {
        const opts = { ...defaultOptions, autoClose: 5000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playDing();
        }

        const urgency = daysUntil <= 1 ? '⚠️' : daysUntil <= 3 ? '📅' : '🗓️';
        const timeText = daysUntil === 0 ? 'Due today!' : daysUntil === 1 ? 'Due tomorrow!' : `Due in ${daysUntil} days`;
        const amountText = amount ? ` • Rs ${amount.toLocaleString()}` : '';

        return toast.warning(`${urgency} ${billName}: ${timeText}${amountText}`, {
            ...opts,
            toastId: `bill-${billName}`,
        });
    },
};

export default genZToast;
