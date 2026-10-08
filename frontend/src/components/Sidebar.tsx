import { useRef, useEffect, useCallback, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    Target,
    CreditCard,
    Sparkles,
    Plus,
    Activity,
    Inbox,
    CalendarDays,
    FileText,
    Repeat,
    PiggyBank,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUIStore, useModalStore, useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import genZToast from '../services/genZToast';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import { transactionInboxApi } from '../services/featureExpansionApi';
import { CashlyMark } from './brand/CashlyLogo';
import styles from './Sidebar.module.css';

interface NavItemDef {
    path: string;
    icon: LucideIcon;
    label: string;
    badge?: number;
    subItems?: { path: string; label: string; icon?: LucideIcon }[];
}

interface NavGroupDef {
    label: string;
    items: NavItemDef[];
}

const SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.75 } as const;
const FADE = { duration: 0.2, ease: [0.32, 0.72, 0, 1] } as const;

export const Sidebar = () => {
    const { sidebarOpen, toggleSidebar, sidebarHovered, setSidebarHovered, setSidebarOpen } = useUIStore();
    const { openAddTransaction } = useModalStore();
    const { user, logout: storeLogout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const isExpanded = sidebarOpen || sidebarHovered;
    const [inboxPendingCount, setInboxPendingCount] = useState(0);

    const hasInteracted = useRef(false);
    const moveCount = useRef(0);
    const isInside = useRef(false);
    const hoverTimer = useRef<NodeJS.Timeout | null>(null);
    const collapseTimer = useRef<NodeJS.Timeout | null>(null);

    // Fetch live pending count for Inbox
    useEffect(() => {
        let mounted = true;
        const fetchInboxCount = async () => {
            try {
                const res = await transactionInboxApi.list({ status: 'pending', limit: 1 });
                if (mounted && res?.pagination?.total) {
                    setInboxPendingCount(res.pagination.total);
                }
            } catch {
                // Silently ignore if offline or unauthenticated
            }
        };
        fetchInboxCount();
        const interval = setInterval(fetchInboxCount, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        setSidebarHovered(false);
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (collapseTimer.current) clearTimeout(collapseTimer.current);
    }, [location.pathname, setSidebarHovered]);

    useEffect(() => {
        return () => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            if (collapseTimer.current) clearTimeout(collapseTimer.current);
        };
    }, []);

    const handleMouseMove = useCallback(() => {
        if (!hasInteracted.current) {
            moveCount.current += 1;
            if (moveCount.current >= 3) hasInteracted.current = true;
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isInside.current = true;
        if (collapseTimer.current) clearTimeout(collapseTimer.current);
        if (!hasInteracted.current) return;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => {
            if (isInside.current) setSidebarHovered(true);
        }, 140);
    }, [setSidebarHovered]);

    const handleMouseLeave = useCallback(() => {
        isInside.current = false;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        collapseTimer.current = setTimeout(() => setSidebarHovered(false), 90);
    }, [setSidebarHovered]);

    const handleNavClick = () => {
        soundManager.play('click');
        if (window.innerWidth >= 1024) {
            setSidebarOpen(true);
            setSidebarHovered(false);
            return;
        }
        setSidebarOpen(false);
        setSidebarHovered(false);
    };

    const handleLogout = async () => {
        try {
            await supabaseLogout();
            storeLogout();
            localStorage.clear();
            genZToast.success('Signed out successfully.');
            soundManager.play('whoosh');
            navigate('/login');
        } catch {
            storeLogout();
            localStorage.clear();
            navigate('/login');
        }
    };

    const navGroups: NavGroupDef[] = [
        {
            label: 'Core Pillars',
            items: [
                {
                    path: '/dashboard',
                    icon: LayoutDashboard,
                    label: 'Home',
                },
                {
                    path: '/transactions',
                    icon: Receipt,
                    label: 'Activity',
                    badge: inboxPendingCount,
                    subItems: [
                        { path: '/transaction-inbox', label: 'Needs Review', icon: Inbox },
                        { path: '/transactions', label: 'Ledger', icon: Receipt },
                        { path: '/transactions?tab=imports', label: 'Statement Imports', icon: FileText },
                    ],
                },
                {
                    path: '/budgets',
                    icon: Target,
                    label: 'Plan',
                    subItems: [
                        { path: '/budgets', label: 'Budgets & Limits', icon: Target },
                        { path: '/subscriptions', label: 'Commitments', icon: Repeat },
                        { path: '/goals', label: 'Savings Goals', icon: PiggyBank },
                        { path: '/cashflow-calendar', label: 'Cashflow Calendar', icon: CalendarDays },
                    ],
                },
                {
                    path: '/analytics',
                    icon: BarChart3,
                    label: 'Analyze',
                    subItems: [
                        { path: '/analytics', label: 'Spending Patterns', icon: BarChart3 },
                        { path: '/money-twin', label: 'Money Twin', icon: Sparkles },
                        { path: '/reports', label: 'Reports', icon: FileText },
                    ],
                },
                {
                    path: '/insights',
                    icon: Sparkles,
                    label: 'Assist',
                },
            ],
        },
        {
            label: 'System & Utilities',
            items: [
                {
                    path: '/cards',
                    icon: CreditCard,
                    label: 'Cards & Accounts',
                },
                {
                    path: '/extension-health',
                    icon: Activity,
                    label: 'Extension',
                },
                {
                    path: '/settings',
                    icon: Settings,
                    label: 'Settings',
                },
            ],
        },
    ];

    const firstName = user?.name?.split(' ')[0] || 'User';
    const initials = (user?.name || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 lg:hidden"
                        style={{ background: 'var(--cashly-bg-overlay)', backdropFilter: 'blur(4px)' }}
                        onClick={() => toggleSidebar()}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Shell */}
            <motion.aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col',
                    'max-lg:translate-x-[-100%]',
                    sidebarOpen && 'max-lg:translate-x-0',
                    isExpanded && 'sidebar-expanded'
                )}
                style={{
                    background: 'var(--bg-sidebar)',
                    borderRight: '1px solid var(--border)',
                    boxShadow: isExpanded ? '10px 0 40px -10px rgba(0,0,0,0.06)' : 'none',
                    willChange: 'width',
                }}
                initial={false}
                animate={{ width: isExpanded ? 248 : 68 }}
                transition={SPRING}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* ── Brand ── */}
                <div
                    className="flex h-16 shrink-0 items-center px-4 gap-3 cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => {
                        navigate('/dashboard');
                        handleNavClick();
                    }}
                >
                    <motion.div
                        className="shrink-0 flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <CashlyMark size={34} variant="orange" />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={FADE}
                                className="min-w-0 flex-1 overflow-hidden"
                            >
                                <p className="font-display text-base font-bold tracking-tight text-[var(--text-primary)]">
                                    Cashly
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] truncate">
                                    Financial Operating System
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Quick Add ── */}
                <div className="shrink-0 px-3 py-4">
                    <motion.button
                        onClick={() => {
                            soundManager.play('click');
                            openAddTransaction();
                        }}
                        className={styles.addButton}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Add Transaction"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="overflow-hidden whitespace-nowrap text-sm font-semibold"
                                >
                                    Quick Add
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* ── Navigation Groups ── */}
                <nav
                    className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 scrollbar-none"
                    style={{ overscrollBehavior: 'contain' }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {navGroups.map((group, groupIdx) => (
                        <div key={group.label} className={groupIdx > 0 ? 'mt-4 pt-3 border-t border-[var(--border)]/60' : ''}>
                            {isExpanded && (
                                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    {group.label}
                                </div>
                            )}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive =
                                        location.pathname === item.path ||
                                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                                    return (
                                        <div key={item.path} className="relative">
                                            <NavLink
                                                to={item.path}
                                                onClick={handleNavClick}
                                                className={cn(
                                                    styles.navItem,
                                                    isActive && styles.active,
                                                    'relative'
                                                )}
                                            >
                                                <motion.span className={styles.navIcon}>
                                                    <item.icon size={20} strokeWidth={2.2} />
                                                </motion.span>

                                                <AnimatePresence mode="wait">
                                                    {isExpanded && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -6 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -6 }}
                                                            transition={FADE}
                                                            className={cn(styles.navLabel, 'flex items-center justify-between flex-1')}
                                                        >
                                                            <span>{item.label}</span>
                                                            {item.badge && item.badge > 0 ? (
                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                    {item.badge > 99 ? '99+' : item.badge}
                                                                </span>
                                                            ) : null}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </NavLink>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── User Profile & Sign Out ── */}
                <div className={styles.bottom} style={{ borderTop: '1px solid var(--border)' }}>
                    <div className={styles.userProfile}>
                        <div
                            className={styles.avatar}
                            onClick={() => {
                                navigate('/profile');
                                handleNavClick();
                            }}
                            title="View Profile"
                        >
                            {initials}
                        </div>

                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={FADE}
                                    className={cn(styles.userInfo, 'cursor-pointer')}
                                    onClick={() => {
                                        navigate('/profile');
                                        handleNavClick();
                                    }}
                                >
                                    <span className={styles.userName}>{firstName}</span>
                                    <span className={styles.userEmail}>{user?.email || 'Account'}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {
                                        handleNavClick();
                                        handleLogout();
                                    }}
                                    className={styles.logoutBtn}
                                    title="Sign out"
                                >
                                    <LogOut size={16} strokeWidth={2.2} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
