import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Target,
    BarChart3,
    Sparkles,
    Plus,
    CreditCard,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import { useModalStore } from '../store/useStore';
import { transactionInboxApi } from '../services/featureExpansionApi';

interface TabItem {
    path: string;
    icon: LucideIcon;
    label: string;
    badgeCount?: number;
}

export function MobileBottomNav() {
    const location = useLocation();
    const { openAddTransaction, openAddCard } = useModalStore();
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [inboxPending, setInboxPending] = useState(0);

    useEffect(() => {
        let mounted = true;
        const fetchPending = async () => {
            try {
                const res = await transactionInboxApi.list({ status: 'pending', limit: 1 });
                if (mounted && res?.pagination?.total) {
                    setInboxPending(res.pagination.total);
                }
            } catch {
                // Ignore silent network errors
            }
        };
        fetchPending();
        const timer = setInterval(fetchPending, 60000);
        return () => {
            mounted = false;
            clearInterval(timer);
        };
    }, []);

    // Close action sheet on route change
    useEffect(() => {
        setActionSheetOpen(false);
    }, [location.pathname]);

    const tabs: TabItem[] = [
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Home',
        },
        {
            path: '/transactions',
            icon: Receipt,
            label: 'Activity',
            badgeCount: inboxPending,
        },
        {
            path: '/budgets',
            icon: Target,
            label: 'Plan',
        },
        {
            path: '/analytics',
            icon: BarChart3,
            label: 'Analyze',
        },
        {
            path: '/insights',
            icon: Sparkles,
            label: 'Assist',
        },
    ];

    const isTabActive = (tabPath: string) => {
        if (tabPath === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
        if (tabPath === '/transactions') return location.pathname.startsWith('/transactions') || location.pathname === '/transaction-inbox';
        if (tabPath === '/budgets') return location.pathname === '/budgets' || location.pathname === '/subscriptions' || location.pathname === '/goals' || location.pathname === '/cashflow-calendar';
        if (tabPath === '/analytics') return location.pathname === '/analytics' || location.pathname === '/money-twin' || location.pathname === '/reports';
        if (tabPath === '/insights') return location.pathname === '/insights';
        return false;
    };

    return (
        <>
            {/* Quick Action Bottom Sheet */}
            <AnimatePresence>
                {actionSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-[var(--cashly-bg-overlay)] backdrop-blur-[2px] lg:hidden"
                            onClick={() => setActionSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-[var(--color-surface)] border-t border-[var(--color-border)] p-6 shadow-2xl safe-area-pb lg:hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                                <div>
                                    <h3 className="font-display font-bold text-lg text-[var(--color-ink)] tracking-tight">
                                        Quick Actions
                                    </h3>
                                    <p className="text-xs text-[var(--color-muted)]">
                                        Capture, link, or record in Cashly
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActionSheetOpen(false)}
                                    className="p-2 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-muted)]"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="py-4 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActionSheetOpen(false);
                                        soundManager.play('click');
                                        openAddTransaction();
                                    }}
                                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-left transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)] text-white flex items-center justify-center shrink-0">
                                        <Plus className="w-5 h-5 stroke-[2.5]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                                            Add Transaction
                                        </p>
                                        <p className="text-xs text-[var(--color-muted)]">
                                            Manually log a purchase or expense
                                        </p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActionSheetOpen(false);
                                        soundManager.play('click');
                                        openAddCard();
                                    }}
                                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-left transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                                            Link Card or Account
                                        </p>
                                        <p className="text-xs text-[var(--color-muted)]">
                                            Connect bank via Plaid or manual card
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom 5-Pillar Tab Bar */}
            <nav
                className="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden shadow-lg"
                aria-label="Mobile Navigation"
            >
                <div className="flex items-center justify-around max-w-lg mx-auto relative">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isTabActive(tab.path);
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                onClick={() => soundManager.play('click')}
                                className={cn(
                                    'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl transition-all relative',
                                    active
                                        ? 'text-[var(--color-brand)] font-semibold'
                                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className={cn('w-5 h-5 transition-transform', active ? 'scale-110' : '')}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    {tab.badgeCount && tab.badgeCount > 0 ? (
                                        <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[var(--color-warning)] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                                            {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                                        </span>
                                    ) : null}
                                </div>
                                <span className="text-[11px] tracking-tight mt-1 leading-tight">
                                    {tab.label}
                                </span>
                                {active && (
                                    <motion.div
                                        layoutId="mobileTabIndicator"
                                        className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]"
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                            </NavLink>
                        );
                    })}

                    {/* Quick Action FAB on Mobile */}
                    <button
                        type="button"
                        onClick={() => {
                            soundManager.play('click');
                            setActionSheetOpen(true);
                        }}
                        aria-label="Quick Action"
                        className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-[var(--color-brand)] text-white shadow-md hover:bg-[var(--color-brand-hover)] active:scale-95 transition-all -translate-y-2 shrink-0"
                    >
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                    </button>
                </div>
            </nav>
        </>
    );
}

export default MobileBottomNav;
