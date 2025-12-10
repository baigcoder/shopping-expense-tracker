// Gen-Z Toast with Sound Effects
import { toast, ToastOptions } from 'react-toastify';
import { notificationSound } from './notificationSoundService';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cash' | 'achievement';

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
        const opts = { ...defaultOptions, autoClose: 2000, ...options };
        if (opts.playSound !== false) {
            notificationSound.playPop();
        }
        return toast.success('Extension synced! 🔗', opts);
    },
};

export default genZToast;
