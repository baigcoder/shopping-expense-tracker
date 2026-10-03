import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Home,
    ArrowLeftRight,
    Target,
    BarChart3,
    Sparkles,
    CreditCard,
    Settings,
    Plus,
    FileSpreadsheet,
    Calendar,
    Sun,
    Moon,
    Chrome,
    CheckCircle2,
    Shield,
} from 'lucide-react';
import { useModalStore, useUIStore } from '../store/useStore';

interface CommandItem {
    id: string;
    title: string;
    subtitle?: string;
    section: 'Navigation' | 'Actions' | 'Tools';
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    keywords?: string[];
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const openAddTransaction = useModalStore((s) => s.openAddTransaction);
    const openAddCard = useModalStore((s) => s.openAddCard);
    const { theme, setTheme } = useUIStore();

    const items: CommandItem[] = [
        // Navigation (5 Pillars)
        {
            id: 'nav-home',
            title: 'Home / Dashboard',
            subtitle: 'Financial pulse, attention rail & upcoming spend',
            section: 'Navigation',
            icon: Home,
            action: () => navigate('/dashboard'),
            keywords: ['overview', 'balance', 'pulse', 'today', 'dashboard'],
        },
        {
            id: 'nav-inbox',
            title: 'Needs Review (Inbox)',
            subtitle: 'Staged transactions requiring approval',
            section: 'Navigation',
            icon: CheckCircle2,
            action: () => navigate('/transactions?tab=inbox'),
            keywords: ['inbox', 'review', 'unposted', 'pending', 'staging'],
        },
        {
            id: 'nav-transactions',
            title: 'Activity & Ledger',
            subtitle: 'Full searchable transaction history',
            section: 'Navigation',
            icon: ArrowLeftRight,
            action: () => navigate('/transactions'),
            keywords: ['expenses', 'ledger', 'purchases', 'history'],
        },
        {
            id: 'nav-imports',
            title: 'Statement Imports',
            subtitle: 'Import PDF statements or CSV spreadsheets',
            section: 'Navigation',
            icon: FileSpreadsheet,
            action: () => navigate('/transactions?tab=imports'),
            keywords: ['pdf', 'csv', 'ocr', 'bank statement', 'upload'],
        },
        {
            id: 'nav-budgets',
            title: 'Plan: Budgets',
            subtitle: 'Category spending caps and burn pace',
            section: 'Navigation',
            icon: Target,
            action: () => navigate('/budgets'),
            keywords: ['spending limit', 'limits', 'envelope', 'pace'],
        },
        {
            id: 'nav-commitments',
            title: 'Plan: Commitments & Subscriptions',
            subtitle: 'Recurring charges, bills & trials',
            section: 'Navigation',
            icon: Calendar,
            action: () => navigate('/subscriptions'),
            keywords: ['bills', 'subscriptions', 'recurring', 'netflix', 'trials', 'due'],
        },
        {
            id: 'nav-goals',
            title: 'Plan: Savings Goals',
            subtitle: 'Target milestones and funding progress',
            section: 'Navigation',
            icon: Target,
            action: () => navigate('/goals'),
            keywords: ['savings', 'targets', 'emergency fund'],
        },
        {
            id: 'nav-calendar',
            title: 'Plan: Cashflow Calendar',
            subtitle: 'Payday inflows and bill obligations',
            section: 'Navigation',
            icon: Calendar,
            action: () => navigate('/cashflow-calendar'),
            keywords: ['calendar', 'cashflow', 'payday'],
        },
        {
            id: 'nav-analytics',
            title: 'Analyze: Spending Patterns',
            subtitle: 'Question-driven charts and category trends',
            section: 'Navigation',
            icon: BarChart3,
            action: () => navigate('/analytics'),
            keywords: ['charts', 'breakdown', 'insights', 'trends'],
        },
        {
            id: 'nav-money-twin',
            title: 'Analyze: Money Twin & Forecast',
            subtitle: 'Burn rate projection and runway modeling',
            section: 'Navigation',
            icon: Sparkles,
            action: () => navigate('/money-twin'),
            keywords: ['forecast', 'burn rate', 'simulation', 'what if', 'future'],
        },
        {
            id: 'nav-assist',
            title: 'Assist: AI Co-Pilot',
            subtitle: 'Context-grounded advice and weekly coach plan',
            section: 'Navigation',
            icon: Sparkles,
            action: () => navigate('/insights'),
            keywords: ['ai', 'advisor', 'assistant', 'coach', 'chat'],
        },
        {
            id: 'nav-cards',
            title: 'Cards & Accounts',
            subtitle: 'Bank accounts, credit cards & Plaid sync',
            section: 'Navigation',
            icon: CreditCard,
            action: () => navigate('/cards'),
            keywords: ['plaid', 'bank', 'visa', 'mastercard', 'accounts'],
        },
        {
            id: 'nav-extension',
            title: 'Extension Companion',
            subtitle: 'Chrome extension connection and telemetry',
            section: 'Navigation',
            icon: Chrome,
            action: () => navigate('/extension-health'),
            keywords: ['chrome', 'extension', 'companion', 'browser'],
        },
        {
            id: 'nav-settings',
            title: 'Settings & Security',
            subtitle: 'Preferences, currency, profile and data controls',
            section: 'Navigation',
            icon: Settings,
            action: () => navigate('/settings'),
            keywords: ['preferences', 'currency', 'dark mode', 'password'],
        },

        // Actions
        {
            id: 'action-add-transaction',
            title: 'Add New Transaction',
            subtitle: 'Log an expense or purchase manually',
            section: 'Actions',
            icon: Plus,
            action: () => openAddTransaction(),
            keywords: ['new', 'record', 'create expense', 'spend'],
        },
        {
            id: 'action-add-card',
            title: 'Link Account or Card',
            subtitle: 'Connect bank or add payment instrument',
            section: 'Actions',
            icon: Plus,
            action: () => openAddCard(),
            keywords: ['new card', 'link bank', 'connect'],
        },
        {
            id: 'action-toggle-theme',
            title: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'}`,
            subtitle: 'Toggle light and dark color schemes',
            section: 'Actions',
            icon: theme === 'dark' ? Sun : Moon,
            action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
            keywords: ['theme', 'dark mode', 'light mode', 'colors'],
        },
    ];

    const filteredItems = items.filter((item) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            item.title.toLowerCase().includes(q) ||
            item.subtitle?.toLowerCase().includes(q) ||
            item.keywords?.some((k) => k.includes(q))
        );
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = (item: CommandItem) => {
        onOpenChange(false);
        item.action();
    };

    const handleKeyDownInList = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onOpenChange(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[var(--cashly-bg-overlay)] backdrop-blur-[2px] animate-fade-in">
            <div
                className="fixed inset-0"
                onClick={() => onOpenChange(false)}
            />

            <div
                className="relative w-full max-w-xl bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden z-10 animate-fade-in-up"
                onKeyDown={handleKeyDownInList}
            >
                <div className="flex items-center px-4 py-3.5 border-b border-[var(--color-border)] gap-3 bg-[var(--color-canvas)]">
                    <Search className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search commands, screens, or actions... (Esc to close)"
                        className="w-full bg-transparent text-sm sm:text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                        ESC
                    </kbd>
                </div>

                <div
                    ref={listRef}
                    className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[var(--color-border)]/50"
                >
                    {filteredItems.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[var(--color-muted)]">
                            No matching commands found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item, idx) => {
                                const Icon = item.icon;
                                const isSelected = idx === selectedIndex;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                            isSelected
                                                ? 'bg-[var(--color-surface-2)] text-[var(--color-brand)] border border-[var(--color-border)]'
                                                : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
                                        }`}
                                    >
                                        <div
                                            className={`p-2 rounded-lg shrink-0 ${
                                                isSelected
                                                    ? 'bg-[var(--color-brand)] text-white'
                                                    : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium leading-tight">
                                                {item.title}
                                            </div>
                                            {item.subtitle && (
                                                <div className="text-xs text-[var(--color-muted)] truncate mt-0.5">
                                                    {item.subtitle}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-muted)] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                                            {item.section}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span className="hidden sm:inline">Use ↑↓ arrows to navigate, Enter to select</span>
                    <span className="ml-auto font-mono text-[11px]">⌘K / Ctrl+K</span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
