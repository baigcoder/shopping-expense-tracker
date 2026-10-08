import { useEffect, useState, useRef, useMemo } from 'react';
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
    Zap,
    CornerDownLeft,
    TrendingDown,
    Activity,
} from 'lucide-react';
import { useModalStore, useUIStore, useAuthStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { emitFinancialDataEvent } from '../services/financialDataEvents';
import { formatCurrency } from '../services/currencyService';
import { soundManager } from '@/lib/sounds';
import { toast } from 'sonner';
import { WeeklyDebriefModal } from './WeeklyDebriefModal';

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

interface ParsedExpense {
    amount: number;
    merchant: string;
    category: string;
}

function parseNaturalLanguageExpense(text: string): ParsedExpense | null {
    const raw = text.trim();
    if (!raw) return null;

    // Matches numbers with optional currency symbols: 450, 1,200, ₹450, rs 450, $45
    const amountMatch = raw.match(/(?:rs\.?|₹|inr|\$)?\s*([\d,]+(?:\.\d+)?)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!amount || isNaN(amount) || amount <= 0) return null;

    let merchant = '';
    let category = 'Shopping';

    // Check "at <merchant>" or "from <merchant>" or "to <merchant>" or "for <item>" or "on <item>"
    const atMatch = raw.match(/(?:at|from|to)\s+([a-zA-Z0-9\s&'-]+)/i);
    const forMatch = raw.match(/(?:for|on)\s+([a-zA-Z0-9\s&'-]+)/i);

    if (atMatch) {
        merchant = atMatch[1].trim();
    } else if (forMatch) {
        merchant = forMatch[1].trim();
    } else {
        const cleaned = raw
            .replace(/^(?:spent|paid|bought|add)\s+/i, '')
            .replace(/(?:rs\.?|₹|inr|\$)?\s*[\d,]+(?:\.\d+)?/i, '')
            .trim();
        if (cleaned.length > 1) {
            merchant = cleaned;
        }
    }

    if (!merchant && !raw.toLowerCase().includes('spent') && !raw.toLowerCase().includes('paid')) {
        return null;
    }

    merchant = merchant.replace(/\s+/g, ' ').trim() || 'General Expense';
    const lowerMerchant = merchant.toLowerCase();
    const lowerRaw = raw.toLowerCase();

    if (
        lowerMerchant.includes('nando') ||
        lowerMerchant.includes('mcdonald') ||
        lowerMerchant.includes('starbuck') ||
        lowerMerchant.includes('coffee') ||
        lowerMerchant.includes('food') ||
        lowerMerchant.includes('restaurant') ||
        lowerMerchant.includes('pizza') ||
        lowerMerchant.includes('burger') ||
        lowerMerchant.includes('dining') ||
        lowerRaw.includes('dinner') ||
        lowerRaw.includes('lunch')
    ) {
        category = 'Food & Dining';
    } else if (
        lowerMerchant.includes('uber') ||
        lowerMerchant.includes('careem') ||
        lowerMerchant.includes('fuel') ||
        lowerMerchant.includes('petrol') ||
        lowerMerchant.includes('shell') ||
        lowerMerchant.includes('transport')
    ) {
        category = 'Transport';
    } else if (
        lowerMerchant.includes('netflix') ||
        lowerMerchant.includes('spotify') ||
        lowerMerchant.includes('youtube') ||
        lowerMerchant.includes('subscription')
    ) {
        category = 'Subscriptions';
    } else if (
        lowerMerchant.includes('grocery') ||
        lowerMerchant.includes('supermarket') ||
        lowerMerchant.includes('mart')
    ) {
        category = 'Groceries';
    } else if (
        lowerMerchant.includes('electricity') ||
        lowerMerchant.includes('water') ||
        lowerMerchant.includes('wifi') ||
        lowerMerchant.includes('bill')
    ) {
        category = 'Utilities';
    }

    return { amount, merchant, category };
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [debriefOpen, setDebriefOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const openAddTransaction = useModalStore((s) => s.openAddTransaction);
    const openAddCard = useModalStore((s) => s.openAddCard);
    const { theme, setTheme } = useUIStore();

    const isCommandMode = query.trim().startsWith('>');
    const cleanQuery = isCommandMode
        ? query.trim().substring(1).trim().toLowerCase()
        : query.toLowerCase().trim();

    const parsedExpense = useMemo(
        () => (!isCommandMode ? parseNaturalLanguageExpense(query) : null),
        [query, isCommandMode]
    );

    const handleSaveParsedExpense = async (parsed: ParsedExpense) => {
        if (!user?.id) {
            toast.error('Please sign in to log transactions');
            return;
        }
        try {
            soundManager.play('click');
            const today = new Date().toISOString().split('T')[0];
            const newTx = await supabaseTransactionService.create({
                user_id: user.id,
                amount: -parsed.amount,
                type: 'expense',
                category: parsed.category,
                description: parsed.merchant,
                date: today,
            });
            emitFinancialDataEvent('transaction-added', newTx);
            emitFinancialDataEvent('cashly-data-updated', {
                area: 'transactions',
                source: 'command-palette-quick-add',
            });
            soundManager.play('success');
            toast.success(`Logged ${formatCurrency(parsed.amount)} at ${parsed.merchant}`);
            onOpenChange(false);
            setQuery('');
        } catch {
            soundManager.play('error');
            toast.error('Could not save quick transaction');
        }
    };

    const items: CommandItem[] = [
        // Navigation (5 Pillars & Shortcuts)
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
            title: 'Needs Review (Sovereign Inbox)',
            subtitle: 'Staged transactions requiring approval',
            section: 'Navigation',
            icon: CheckCircle2,
            action: () => navigate('/transaction-inbox'),
            keywords: ['inbox', 'review', 'unposted', 'pending', 'staging', '> review', 'review'],
        },
        {
            id: 'nav-runway',
            title: 'Runway Simulator & Cash Trajectory',
            subtitle: 'Live velocity restraint slider and deficit radar',
            section: 'Navigation',
            icon: Activity,
            action: () => navigate('/money-twin'),
            keywords: ['runway', 'simulator', 'forecast', 'burn', '> runway', 'velocity'],
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
            keywords: ['spending limit', 'limits', 'envelope', 'pace', '> budget'],
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
            keywords: ['plaid', 'bank', 'visa', 'mastercard', 'accounts', '> card'],
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
            id: 'action-weekly-debrief',
            title: 'Sunday Snapshot / Weekly Financial Debrief',
            subtitle: 'Calming 60-second retrospective, velocity variance & lock targets',
            section: 'Actions',
            icon: Calendar,
            action: () => setDebriefOpen(true),
            keywords: ['debrief', 'sunday', 'snapshot', 'weekly', 'review', '> debrief'],
        },
        {
            id: 'action-add-transaction',
            title: 'Add New Transaction',
            subtitle: 'Log an expense or purchase manually',
            section: 'Actions',
            icon: Plus,
            action: () => openAddTransaction(),
            keywords: ['new', 'record', 'create expense', 'spend', '> add'],
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
        if (!cleanQuery) return true;
        return (
            item.title.toLowerCase().includes(cleanQuery) ||
            item.subtitle?.toLowerCase().includes(cleanQuery) ||
            item.keywords?.some((k) => k.toLowerCase().includes(cleanQuery))
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
            if (parsedExpense) {
                handleSaveParsedExpense(parsedExpense);
                return;
            }
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onOpenChange(false);
        }
    };

    return (
        <>
            <WeeklyDebriefModal
                open={debriefOpen}
                onClose={() => setDebriefOpen(false)}
            />

            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[var(--cashly-bg-overlay)] backdrop-blur-[2px] animate-fade-in">
                    <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

                    <div
                        className="relative w-full max-w-xl bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden z-10 animate-fade-in-up"
                        onKeyDown={handleKeyDownInList}
                    >
                        {/* Search Input Bar */}
                        <div className="flex items-center px-4 py-3.5 border-b border-[var(--color-border)] gap-3 bg-[var(--color-canvas)]">
                            <Search className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Try 'spent 450 at Nandos' or '> runway', '> review', '> debrief'..."
                                className="w-full bg-transparent text-sm sm:text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
                            />
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                                ESC
                            </kbd>
                        </div>

                        {/* Natural Language Quick-Add Expense Card */}
                        {parsedExpense && (
                            <div className="p-3 mx-3 my-2.5 rounded-xl bg-gradient-to-r from-[var(--color-brand)]/15 via-[var(--color-surface-2)] to-transparent border border-[var(--color-brand)]/35 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                                        <Zap className="w-4 h-4 text-[var(--color-brand)] shrink-0 fill-[var(--color-brand)]/20" />
                                        <span>Quick-Add:</span>
                                        <span className="font-bold font-mono text-[var(--color-brand)]">
                                            {formatCurrency(parsedExpense.amount)}
                                        </span>
                                        <span>at</span>
                                        <span className="font-bold truncate">{parsedExpense.merchant}</span>
                                    </div>
                                    <div className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5 flex items-center gap-2">
                                        <span>Category: {parsedExpense.category}</span>
                                        <span>·</span>
                                        <span className="text-[var(--color-brand)] font-medium">Press Enter ↵ to log instantly</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSaveParsedExpense(parsedExpense)}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:opacity-90 shrink-0 flex items-center gap-1 shadow-xs"
                                >
                                    <span>Log Expense</span>
                                    <CornerDownLeft className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Command List */}
                        <div
                            ref={listRef}
                            className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[var(--color-border)]/50"
                        >
                            {filteredItems.length === 0 && !parsedExpense ? (
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

                        {/* Footer Tips */}
                        <div className="px-4 py-2 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
                            <span className="hidden sm:inline font-mono text-[11px]">
                                Try typing: &quot;spent 450 at Nandos&quot; · &quot;&gt; runway&quot; · &quot;&gt; debrief&quot;
                            </span>
                            <span className="ml-auto font-mono text-[11px]">⌘K / Ctrl+K</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CommandPalette;
