import React, { useRef, useEffect, useCallback, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Receipt, BarChart3, Settings, LogOut,
    Target, CreditCard, Landmark, Repeat, Brain, PiggyBank,
    Plus, FileText, Bell, Inbox, CalendarDays, Activity,
    ShoppingBag, Sparkles, WalletCards, ChevronDown, HelpCircle,
    User, Moon, Sun,
} from 'lucide-react';
import { useUIStore, useModalStore, useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import genZToast from '../services/genZToast';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import styles from './Sidebar.module.css';

// ─── Navigation structure ───
const navGroups = [
    {
        label: 'Overview',
        items: [
            { path: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/insights',         icon: Brain,           label: 'AI Assistant' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { path: '/transactions',     icon: Receipt,         label: 'Transactions' },
            { path: '/transaction-inbox', icon: Inbox,          label: 'Inbox' },
            { path: '/accounts',         icon: Landmark,        label: 'Accounts' },
            { path: '/cashflow-calendar', icon: CalendarDays,   label: 'Calendar' },
        ],
    },
    {
        label: 'Planning',
        items: [
            { path: '/budgets',          icon: Target,          label: 'Budgets' },
            { path: '/goals',            icon: PiggyBank,       label: 'Goals' },
            { path: '/bills',            icon: WalletCards,     label: 'Bills' },
            { path: '/subscriptions',    icon: Repeat,          label: 'Subscriptions' },
        ],
    },
    {
        label: 'Insights',
        items: [
            { path: '/analytics',        icon: BarChart3,       label: 'Analytics' },
            { path: '/money-twin',       icon: Sparkles,        label: 'Money Twin' },
            { path: '/reports',          icon: FileText,        label: 'Reports' },
            { path: '/shopping-activity', icon: ShoppingBag,    label: 'Shopping' },
        ],
    },
    {
        label: 'System',
        items: [
            { path: '/cards',            icon: CreditCard,      label: 'Cards' },
            { path: '/extension-health', icon: Activity,        label: 'Extension' },
            { path: '/reminders',        icon: Bell,            label: 'Reminders' },
        ],
    },
];

const SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.75 } as const;
const FADE   = { duration: 0.2, ease: [0.32, 0.72, 0, 1] } as const;

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar, sidebarHovered, setSidebarHovered, setSidebarOpen } = useUIStore();
    const { openAddTransaction } = useModalStore();
    const { user, logout: storeLogout } = useAuthStore();
    const navigate  = useNavigate();
    const location  = useLocation();

    const isExpanded = sidebarOpen || sidebarHovered;
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const hasInteracted    = useRef(false);
    const moveCount        = useRef(0);
    const isInside         = useRef(false);
    const hoverTimer       = useRef<NodeJS.Timeout | null>(null);
    const collapseTimer    = useRef<NodeJS.Timeout | null>(null);

    const toggleGroup = (label: string) => {
        setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
    };

    useEffect(() => {
        setSidebarHovered(false);
        hoverTimer.current   && clearTimeout(hoverTimer.current);
        collapseTimer.current && clearTimeout(collapseTimer.current);
    }, [location.pathname, setSidebarHovered]);

    useEffect(() => () => {
        hoverTimer.current   && clearTimeout(hoverTimer.current);
        collapseTimer.current && clearTimeout(collapseTimer.current);
    }, []);

    const handleMouseMove = useCallback(() => {
        if (!hasInteracted.current) {
            if (++moveCount.current >= 3) hasInteracted.current = true;
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isInside.current = true;
        collapseTimer.current && clearTimeout(collapseTimer.current);
        if (!hasInteracted.current) return;
        hoverTimer.current && clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => { if (isInside.current) setSidebarHovered(true); }, 140);
    }, [setSidebarHovered]);

    const handleMouseLeave = useCallback(() => {
        isInside.current = false;
        hoverTimer.current && clearTimeout(hoverTimer.current);
        collapseTimer.current = setTimeout(() => setSidebarHovered(false), 90);
    }, [setSidebarHovered]);

    const handleNavClick = () => {
        soundManager.play('click');
        if (window.innerWidth >= 1024) { setSidebarOpen(true); setSidebarHovered(false); return; }
        setSidebarOpen(false); setSidebarHovered(false);
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
            storeLogout(); localStorage.clear(); navigate('/login');
        }
    };

    const firstName = user?.name?.split(' ')[0] || 'User';
    const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 lg:hidden"
                        style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)' }}
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
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    boxShadow: isExpanded ? '10px 0 40px -10px rgba(0,0,0,0.06)' : 'none',
                    willChange: 'width',
                }}
                initial={false}
                animate={{ width: isExpanded ? 272 : 76 }}
                transition={SPRING}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* ── Brand ── */}
                <div className="flex h-[72px] shrink-0 items-center px-5 gap-3"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <motion.div
                        className={cn(styles.logoIcon, styles.liveIcon)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                    >
                        C
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }} transition={FADE}
                                className="min-w-0 flex-1 overflow-hidden"
                            >
                                <p className="text-[17px] font-black tracking-tight truncate"
                                   style={{ color: 'var(--text-primary)' }}>
                                    Cashly
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] truncate"
                                   style={{ color: 'var(--brand)' }}>
                                    AI Finance
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Quick Add ── */}
                <div className="shrink-0 px-3 py-6">
                    <motion.button
                        onClick={() => { soundManager.play('click'); openAddTransaction(); }}
                        className={styles.addButton}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={22} strokeWidth={3} />
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    Quick Add
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* ── Navigation ── */}
                <nav
                    className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 scrollbar-none"
                    style={{ overscrollBehavior: 'contain' }}
                    onWheel={e => e.stopPropagation()}
                >
                    {navGroups.map((group) => {
                        const isCollapsed = collapsedGroups[group.label];
                        return (
                            <div key={group.label} className="mb-1">
                                {/* Group Header */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.button
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            onClick={() => toggleGroup(group.label)}
                                            className="flex items-center justify-between w-full px-3 pt-4 pb-2 group"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]"
                                                  style={{ color: 'var(--text-muted)' }}>
                                                {group.label}
                                            </span>
                                            <ChevronDown
                                                size={12}
                                                className={cn(
                                                    'transition-transform duration-200',
                                                    isCollapsed && '-rotate-90'
                                                )}
                                                style={{ color: 'var(--text-muted)' }}
                                            />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {/* Group Items */}
                                <AnimatePresence initial={false}>
                                    {(!isCollapsed || !isExpanded) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-1"
                                        >
                                            {group.items.map((item) => (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={handleNavClick}
                                                    className={({ isActive }) => cn(
                                                        styles.navItem,
                                                        isActive && styles.active
                                                    )}
                                                >
                                                    <motion.span 
                                                        className={styles.navIcon}
                                                        whileHover={{ scale: 1.2, rotate: 5, color: '#3b82f6' }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                    >
                                                        <item.icon size={20} strokeWidth={2.5} />
                                                    </motion.span>

                                                    <AnimatePresence mode="wait">
                                                        {isExpanded && (
                                                            <motion.span
                                                                initial={{ opacity: 0, x: -6 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -6 }}
                                                                transition={FADE}
                                                                className={styles.navLabel}
                                                            >
                                                                {item.label}
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>
                                                </NavLink>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>

                <div className={styles.bottom} style={{ borderBottom: '1px solid #F1F5F9', borderTop: 'none', paddingBottom: '0.5rem' }}>
                    <NavLink
                        to="/settings"
                        onClick={handleNavClick}
                        className={({ isActive }) => cn(
                            styles.navItem,
                            isActive && styles.active
                        )}
                    >
                        <span className={styles.navIcon}>
                            <Settings size={20} strokeWidth={2.5} />
                        </span>
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={FADE}
                                    className={styles.navLabel}
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                </div>

                {/* ── User Profile ── */}
                <div className={styles.bottom}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            {initials}
                        </div>

                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }} transition={FADE}
                                    className={styles.userInfo}
                                >
                                    <span className={styles.userName}>
                                        {firstName}
                                    </span>
                                    <span className={styles.userEmail}>
                                        {user?.email || 'Premium'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.button
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    onClick={() => { handleNavClick(); handleLogout(); }}
                                    className={styles.logoutBtn}
                                    title="Sign out"
                                >
                                    <LogOut size={18} strokeWidth={3} />
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
