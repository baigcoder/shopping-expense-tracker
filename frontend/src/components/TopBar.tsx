import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    Plus,
    Bell,
    Moon,
    Sun,
    User,
    Settings,
    LogOut,
    Menu,
    ChevronDown,
} from 'lucide-react';
import { useAuthStore, useUIStore, useModalStore } from '../store/useStore';
import { useNotificationStore } from '../services/notificationService';
import { logout as supabaseLogout } from '../config/supabase';
import { ExtensionStatusPill } from './ExtensionStatusPill';
import NotificationsPanel from './NotificationsPanel';
import genZToast from '../services/genZToast';
import { soundManager } from '@/lib/sounds';

interface TopBarProps {
    onOpenCommandPalette: () => void;
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout: storeLogout } = useAuthStore();
    const { toggleSidebar, theme, setTheme } = useUIStore();
    const { openAddTransaction } = useModalStore();
    const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const getPageTitle = (path: string) => {
        if (path === '/dashboard' || path === '/') return 'Home';
        if (path.startsWith('/transactions')) return 'Activity';
        if (path === '/transaction-inbox') return 'Review Inbox';
        if (path === '/budgets') return 'Plan: Budgets';
        if (path === '/subscriptions') return 'Plan: Commitments';
        if (path === '/goals') return 'Plan: Goals';
        if (path === '/cashflow-calendar') return 'Plan: Calendar';
        if (path === '/analytics') return 'Analyze: Patterns';
        if (path === '/money-twin') return 'Analyze: Money Twin';
        if (path === '/reports') return 'Analyze: Reports';
        if (path === '/insights') return 'Assist: AI Co-Pilot';
        if (path === '/cards' || path === '/accounts') return 'Cards & Accounts';
        if (path === '/extension-health') return 'Extension Companion';
        if (path === '/settings') return 'Settings';
        if (path === '/profile') return 'Profile';
        return 'Cashly';
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

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        localStorage.setItem('theme', nextTheme);
    };

    const initials = (user?.name || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="sticky top-0 z-30 h-16 w-full bg-[var(--color-canvas)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
            {/* Left section: Mobile menu + Page context */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={() => toggleSidebar()}
                    aria-label="Toggle Navigation"
                    className="p-2 -ml-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display font-bold text-base sm:text-lg text-[var(--color-ink)] tracking-tight truncate">
                        {getPageTitle(location.pathname)}
                    </span>
                    <span className="hidden xl:inline text-xs text-[var(--color-muted)] font-normal">
                        — {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Center section: Command Search Trigger */}
            <div className="flex-1 max-w-md hidden md:block">
                <button
                    type="button"
                    onClick={onOpenCommandPalette}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)] shadow-sm transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-[var(--color-muted)]" />
                        <span className="text-xs">Search ledger, actions, or jump to...</span>
                    </div>
                    <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)]">
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* Right section: Extension Pill + Quick Add + Notifications + User Avatar */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Search trigger on small screens */}
                <button
                    type="button"
                    onClick={onOpenCommandPalette}
                    aria-label="Search"
                    className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] md:hidden"
                >
                    <Search className="w-5 h-5" />
                </button>

                {/* Companion Extension Status */}
                <ExtensionStatusPill />

                {/* Quick Add Button */}
                <button
                    type="button"
                    onClick={() => {
                        soundManager.play('click');
                        openAddTransaction();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-sm transition-all active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Add</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setNotifOpen(!notifOpen)}
                        aria-label="Notifications"
                        className="relative p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-brand)]" />
                        )}
                    </button>

                    <NotificationsPanel
                        isOpen={notifOpen}
                        onClose={() => setNotifOpen(false)}
                    />
                </div>

                {/* User Avatar & Menu */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
                        aria-expanded={userMenuOpen}
                        aria-label="User Account Menu"
                    >
                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] text-white font-display font-semibold text-xs flex items-center justify-center shadow-sm">
                            {initials}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)] hidden sm:block" />
                    </button>

                    {userMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-50 animate-fade-in text-left">
                                <div className="px-3 py-2 border-b border-[var(--color-border)]">
                                    <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                                        {user?.name || 'Cashly User'}
                                    </p>
                                    <p className="text-[11px] text-[var(--color-muted)] truncate">
                                        {user?.email || 'Logged In'}
                                    </p>
                                </div>

                                <div className="py-1 space-y-0.5">
                                    <Link
                                        to="/profile"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                                    >
                                        <User className="w-4 h-4 text-[var(--color-muted)]" />
                                        Profile Details
                                    </Link>
                                    <Link
                                        to="/settings"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                                        Settings & Preferences
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={toggleTheme}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {theme === 'dark' ? (
                                                <Sun className="w-4 h-4 text-[var(--color-muted)]" />
                                            ) : (
                                                <Moon className="w-4 h-4 text-[var(--color-muted)]" />
                                            )}
                                            <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase">
                                            Toggle
                                        </span>
                                    </button>
                                </div>

                                <div className="pt-1 border-t border-[var(--color-border)]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default TopBar;
