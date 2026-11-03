import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    Activity, BarChart3, CalendarDays, CreditCard, FileText, Home, Inbox, LogOut, Menu,
    MessageCircle, PiggyBank, Plug, Repeat, Settings, Sparkles, Target, X,
} from 'lucide-react';
import { CashlyMark } from '../brand/CashlyLogo';
import { cn } from '@/lib/utils';

interface NavItem { to: string; label: string; icon: LucideIcon; count?: number; tour?: string }
interface NavGroup { label?: string; items: NavItem[] }

export const appNav = (inboxCount: number): NavGroup[] => [
    {
        items: [
            { to: '/dashboard', label: 'Home', icon: Home, tour: 'nav-home' },
            { to: '/transaction-inbox', label: 'Review inbox', icon: Inbox, count: inboxCount, tour: 'nav-inbox' },
            { to: '/transactions', label: 'Activity', icon: Activity, tour: 'nav-activity' },
        ],
    },
    {
        label: 'Plan',
        items: [
            { to: '/budgets', label: 'Budgets', icon: Target, tour: 'nav-budgets' },
            { to: '/subscriptions', label: 'Bills and subscriptions', icon: Repeat, tour: 'nav-subscriptions' },
            { to: '/goals', label: 'Goals', icon: PiggyBank, tour: 'nav-goals' },
            { to: '/cashflow-calendar', label: 'Calendar', icon: CalendarDays, tour: 'nav-calendar' },
        ],
    },
    {
        label: 'Understand',
        items: [
            { to: '/analytics', label: 'Spending', icon: BarChart3, tour: 'nav-analytics' },
            { to: '/money-twin', label: 'Money Twin', icon: Sparkles, tour: 'nav-twin' },
            { to: '/insights', label: 'Ask Cashly', icon: MessageCircle, tour: 'nav-assist' },
            { to: '/reports', label: 'Reports', icon: FileText, tour: 'nav-reports' },
        ],
    },
    {
        label: 'Account',
        items: [
            { to: '/cards', label: 'Cards and accounts', icon: CreditCard, tour: 'nav-cards' },
            { to: '/extension-health', label: 'Browser extension', icon: Plug, tour: 'nav-extension' },
            { to: '/settings', label: 'Settings', icon: Settings, tour: 'nav-settings' },
        ],
    },
];

interface AppShellProps {
    /** '' for the signed-in app, '/demo' for the demo. Prefixed onto every nav link. */
    basePath?: string;
    userName: string;
    userDetail: string;
    inboxCount: number;
    onSignOut?: () => void;
    signOutLabel?: string;
    /** Shown above the page on every screen (the demo guide bar). */
    banner?: ReactNode;
    children: ReactNode;
}

const titleFor = (path: string, groups: NavGroup[], basePath: string) => {
    const rel = path.slice(basePath.length) || '/dashboard';
    for (const g of groups) for (const i of g.items) if (rel.startsWith(i.to)) return i.label;
    return 'Cashly';
};

export function AppShell({ basePath = '', userName, userDetail, inboxCount, onSignOut, signOutLabel = 'Sign out', banner, children }: AppShellProps) {
    const groups = appNav(inboxCount);
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => setMenuOpen(false), [location.pathname]);

    const initials = userName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'C';

    const nav = (
        <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
            {groups.map((group, gi) => (
                <div key={gi}>
                    {group.label && <p className="mb-1 px-3 text-[13px] text-[var(--color-muted)]">{group.label}</p>}
                    <ul className="flex flex-col gap-0.5">
                        {group.items.map(({ to, label, icon: Icon, count, tour }) => (
                            <li key={to}>
                                <NavLink
                                    to={`${basePath}${to}`}
                                    data-tour={tour}
                                    className={({ isActive }) => cn(
                                        'flex h-9 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors',
                                        isActive
                                            ? 'bg-[var(--color-surface-2)] font-semibold text-[var(--color-ink)]'
                                            : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-ink)]'
                                    )}
                                >
                                    <Icon size={16} strokeWidth={1.75} aria-hidden />
                                    <span className="flex-1 truncate">{label}</span>
                                    {!!count && (
                                        <span className="min-w-[22px] rounded-full bg-[var(--color-brand)] px-1.5 text-center text-[12px] font-semibold leading-[20px] text-white tabular-nums">
                                            {count}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );

    const userRow = (
        <div className="flex items-center gap-3 px-6 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cat-entertainment-soft)] text-[13px] font-semibold text-[var(--cat-entertainment)]">
                {initials}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--color-ink)]">{userName}</p>
                <p className="truncate text-[13px] text-[var(--color-muted)]">{userDetail}</p>
            </div>
            {onSignOut && (
                <button type="button" onClick={onSignOut} aria-label={signOutLabel} title={signOutLabel}
                    className="rounded-[8px] p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]">
                    <LogOut size={16} />
                </button>
            )}
        </div>
    );

    const brand = (
        <NavLink to={`${basePath}/dashboard`} className="flex items-center gap-2.5 px-6 py-6">
            <CashlyMark size={28} variant="orange" />
            <span className="font-display text-[17px] font-bold tracking-tight text-[var(--color-ink)]">Cashly</span>
        </NavLink>
    );

    return (
        <div className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)]">
            {/* Desktop: open-plane sidebar on the page ground */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col lg:flex" aria-label="Sidebar">
                {brand}
                {nav}
                {userRow}
            </aside>

            {/* Phone and tablet: one slim bar, full-screen menu */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[var(--color-canvas)] px-4 lg:hidden">
                <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}
                    className="-ml-2 rounded-[10px] p-2 text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]">
                    <Menu size={20} />
                </button>
                <p className="flex-1 truncate font-display text-[16px] font-semibold">{titleFor(location.pathname, groups, basePath)}</p>
                <CashlyMark size={26} variant="orange" />
            </header>

            {menuOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-canvas)] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
                    <div className="flex items-center justify-between pr-4">
                        {brand}
                        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"
                            className="rounded-[10px] p-2 hover:bg-[var(--color-surface-2)]">
                            <X size={20} />
                        </button>
                    </div>
                    {nav}
                    {userRow}
                </div>
            )}

            <div className="lg:pl-[248px]">
                {banner}
                <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-4 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
            </div>
        </div>
    );
}
