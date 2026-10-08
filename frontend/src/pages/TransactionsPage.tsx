// Cashly Activity & Ledger — Pillar 2: Activity
// Unified Ledger, Review Inbox & Statement Imports
// Authority: docs/ux-transformation/FINAL_UX_DIRECTIVE.md & TARGET_INFORMATION_ARCHITECTURE.md

import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    Edit2,
    ArrowRight,
    ArrowLeft,
    Download,
    FileText,
    Receipt,
    Check,
    Inbox,
    Sparkles,
    CheckCircle2,
    Plus,
    X,
} from 'lucide-react';
import { useAuthStore, useModalStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useTransactionRealtime } from '../hooks/useRealtimeSync';
import {
    transactionInboxApi,
    TransactionCandidate,
    invalidateInboxCache,
} from '../services/featureExpansionApi';
import { toast } from 'sonner';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { TransactionSideSheet } from '../components/TransactionSideSheet';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';

const CSVImport = lazy(() => import('../components/CSVImport'));
const ExportModal = lazy(() => import('../components/ExportModal'));
const PDFAnalyzer = lazy(() => import('../components/PDFAnalyzer'));

type ActivityTab = 'ledger' | 'inbox' | 'imports';

export function TransactionsPage() {
    const { user } = useAuthStore();
    const { openAddTransaction } = useModalStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tab State: default to URL param if provided
    const initialTab = (searchParams.get('tab') as ActivityTab) || 'ledger';
    const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);

    // Ledger State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);

    // Inbox (Review Queue) State
    const [inboxItems, setInboxItems] = useState<TransactionCandidate[]>([]);
    const [selectedInboxIds, setSelectedInboxIds] = useState<string[]>([]);

    // Inspection Side-Sheet
    const [inspectedTx, setInspectedTx] = useState<SupabaseTransaction | null>(null);
    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

    // Import Modals
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [showPDFAnalyzer, setShowPDFAnalyzer] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab') as ActivityTab;
        if (tab && (tab === 'ledger' || tab === 'inbox' || tab === 'imports')) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: ActivityTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
        soundManager.play('click');
    };

    // Load Ledger
    const loadLedger = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await supabaseTransactionService.getAll(user.id, { force: true });
            setTransactions(data);
        } catch {
            toast.error('Failed to load transaction ledger');
        }
    }, [user?.id]);

    // Load Inbox
    const loadInbox = useCallback(async () => {
        try {
            invalidateInboxCache();
            const res = await transactionInboxApi.list({ status: 'pending', limit: 100 });
            setInboxItems(res.data || []);
        } catch {
            // Silently ignore if offline
        }
    }, []);

    useEffect(() => {
        loadLedger();
        loadInbox();
    }, [loadLedger, loadInbox]);

    // Realtime Sync
    useTransactionRealtime({
        onInsert: () => {
            loadLedger();
            loadInbox();
        },
        onUpdate: () => {
            loadLedger();
            loadInbox();
        },
        onDelete: () => {
            loadLedger();
            loadInbox();
        },
    });

    // Listen to financial data events
    useEffect(() => {
        const handleUpdate = () => {
            loadLedger();
            loadInbox();
        };
        window.addEventListener('cashly-data-updated', handleUpdate);
        window.addEventListener('transaction-candidate-added', handleUpdate);
        return () => {
            window.removeEventListener('cashly-data-updated', handleUpdate);
            window.removeEventListener('transaction-candidate-added', handleUpdate);
        };
    }, [loadLedger, loadInbox]);

    // Inbox Handlers
    const handleApproveInbox = async (id: string) => {
        try {
            await transactionInboxApi.approve(id);
            soundManager.play('success');
            toast.success('Transaction approved and posted to ledger.');
            setInboxItems((prev) => prev.filter((i) => i.id !== id));
            loadLedger();
        } catch {
            toast.error('Failed to approve transaction.');
        }
    };

    const handleBatchApproveInbox = async () => {
        if (selectedInboxIds.length === 0) return;
        try {
            await transactionInboxApi.bulk(selectedInboxIds, 'approve');
            soundManager.play('success');
            toast.success(`Approved ${selectedInboxIds.length} transactions.`);
            setInboxItems((prev) => prev.filter((i) => !selectedInboxIds.includes(i.id)));
            setSelectedInboxIds([]);
            loadLedger();
        } catch {
            toast.error('Batch approval failed.');
        }
    };

    const handleRejectInbox = async (id: string) => {
        try {
            await transactionInboxApi.reject(id);
            toast.info('Transaction rejected and archived.');
            setInboxItems((prev) => prev.filter((i) => i.id !== id));
        } catch {
            toast.error('Failed to reject transaction.');
        }
    };

    // Ledger Handlers
    const handleRowClick = (tx: SupabaseTransaction) => {
        setInspectedTx(tx);
        setIsSideSheetOpen(true);
        soundManager.play('click');
    };

    const handleUpdateTx = async (updated: SupabaseTransaction) => {
        try {
            await supabaseTransactionService.update(updated.id, {
                description: updated.description,
                category: updated.category,
                amount: updated.amount,
            });
            toast.success('Transaction updated successfully.');
            setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        } catch {
            toast.error('Failed to update transaction.');
        }
    };

    const handleDeleteTx = async (id: string) => {
        try {
            await supabaseTransactionService.delete(id);
            toast.success('Transaction removed from ledger.');
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch {
            toast.error('Failed to delete transaction.');
        }
    };

    // Filtered & Sorted Ledger
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((tx) => {
                if (search) {
                    const q = search.toLowerCase();
                    const descMatch = (tx.description || '').toLowerCase().includes(q);
                    const catMatch = (tx.category || '').toLowerCase().includes(q);
                    if (!descMatch && !catMatch) return false;
                }

                if (categoryFilter !== 'all') {
                    if (tx.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
                }

                if (dateRange !== 'all') {
                    const txDate = new Date(tx.date);
                    const now = new Date();
                    if (dateRange === 'today') {
                        if (txDate.toDateString() !== now.toDateString()) return false;
                    } else if (dateRange === 'week') {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        if (txDate < weekAgo) return false;
                    } else if (dateRange === 'month') {
                        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
                            return false;
                        }
                    }
                }

                if (typeFilter !== 'all') {
                    if (tx.type !== typeFilter) return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (sortOrder === 'highest') return Math.abs(b.amount) - Math.abs(a.amount);
                if (sortOrder === 'lowest') return Math.abs(a.amount) - Math.abs(b.amount);
                return 0;
            });
    }, [transactions, search, categoryFilter, dateRange, typeFilter, sortOrder]);

    const PAGE_SIZE = 12;
    const paginatedTransactions = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredTransactions.slice(start, start + PAGE_SIZE);
    }, [filteredTransactions, page]);

    const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);

    const categoriesList = useMemo(() => {
        const set = new Set(transactions.map((t) => t.category).filter(Boolean));
        return Array.from(set);
    }, [transactions]);

    const totalSpent = useMemo(() => {
        return filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }, [filteredTransactions]);

    return (
        <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Top Activity Header & Sub-Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)]">
                        Money Activity
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-0.5">
                        Authoritative financial ledger, capture review inbox & bank statement imports
                    </p>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shrink-0">
                    <button
                        type="button"
                        onClick={() => handleTabChange('ledger')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            activeTab === 'ledger'
                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        )}
                    >
                        Ledger ({transactions.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('inbox')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                            activeTab === 'inbox'
                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        )}
                    >
                        <span>Needs Review</span>
                        {inboxItems.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-warning)] text-white animate-pulse">
                                {inboxItems.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('imports')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            activeTab === 'imports'
                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        )}
                    >
                        Imports
                    </button>
                </div>
            </div>

            {/* TAB 1: ALL TRANSACTIONS (CANONICAL LEDGER) */}
            {activeTab === 'ledger' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Search & Filter Toolbar */}
                    <Surface className="p-4 flex flex-col gap-3 border-[var(--color-border)] shadow-xs">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                                <div className="relative flex-1 min-w-[200px] max-w-sm">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Search merchant or category..."
                                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] text-[var(--color-ink)]"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                setPage(1);
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Type Filter */}
                                <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                                    <button
                                        type="button"
                                        onClick={() => { setTypeFilter('all'); setPage(1); }}
                                        className={cn(
                                            'px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                            typeFilter === 'all'
                                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                                        )}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setTypeFilter('expense'); setPage(1); }}
                                        className={cn(
                                            'px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                            typeFilter === 'expense'
                                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                                        )}
                                    >
                                        Outflow
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setTypeFilter('income'); setPage(1); }}
                                        className={cn(
                                            'px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                            typeFilter === 'income'
                                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                                        )}
                                    >
                                        Inflow
                                    </button>
                                </div>

                                {/* Category Filter */}
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                                >
                                    <option value="all">All Categories</option>
                                    {categoriesList.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>

                                {/* Date Filter */}
                                <select
                                    value={dateRange}
                                    onChange={(e) => {
                                        setDateRange(e.target.value as any);
                                        setPage(1);
                                    }}
                                    className="px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] hidden sm:block"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Past 7 Days</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>

                            {/* Right Tools: Sort, Export, Add */}
                            <div className="flex items-center gap-2 shrink-0">
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Amount</option>
                                    <option value="lowest">Lowest Amount</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowExportModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={openAddTransaction}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                    <span className="hidden sm:inline">Transaction</span>
                                </button>
                            </div>
                        </div>
                    </Surface>

                    {/* Summary Ribbon: Count + Total Filtered Volume */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs shadow-xs">
                        <span className="text-[var(--color-muted)]">
                            Showing <strong className="text-[var(--color-ink)] font-mono">{filteredTransactions.length}</strong> recorded entries
                            {categoryFilter !== 'all' ? ` in ${categoryFilter}` : ''}
                            {typeFilter !== 'all' ? ` (${typeFilter})` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--color-muted)]">Filtered Outflow:</span>
                            <span className="font-mono font-bold text-[var(--color-ink)] text-sm">{formatCurrency(totalSpent)}</span>
                        </div>
                    </div>

                    {/* Ledger Data Table */}
                    <Surface className="p-0 overflow-hidden border-[var(--color-border)] shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] text-[11px] uppercase tracking-wider">
                                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                                        <th className="py-3 px-4 font-semibold">Description / Merchant</th>
                                        <th className="py-3 px-4 font-semibold">Category</th>
                                        <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Amount</th>
                                        <th className="py-3 px-4 font-semibold text-center whitespace-nowrap min-w-[80px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]/60">
                                    {paginatedTransactions.length > 0 ? (
                                        paginatedTransactions.map((tx) => {
                                            const isExpense = tx.type === 'expense';
                                            return (
                                                <tr
                                                    key={tx.id}
                                                    onClick={() => handleRowClick(tx)}
                                                    className="hover:bg-[var(--color-surface-2)]/80 cursor-pointer transition-colors"
                                                >
                                                    <td className="py-3.5 px-4 text-xs font-mono text-[var(--color-muted)] whitespace-nowrap">
                                                        {new Date(tx.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-medium text-[var(--color-ink)]">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-xs shrink-0">
                                                                {isExpense ? '🛒' : '💰'}
                                                            </div>
                                                            <span className="truncate max-w-xs">{tx.description || 'Purchase'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <Badge variant="secondary" className="text-[11px] bg-[var(--color-surface-2)] text-[var(--color-ink)] border-[var(--color-border)]">
                                                            {tx.category || 'Other'}
                                                        </Badge>
                                                    </td>
                                                    <td className={cn(
                                                        'py-3.5 px-4 text-right font-semibold tabular-nums font-mono whitespace-nowrap',
                                                        isExpense ? 'text-[var(--color-ink)]' : 'text-[var(--color-success)]'
                                                    )}>
                                                        {isExpense ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRowClick(tx);
                                                            }}
                                                            aria-label="Inspect transaction"
                                                            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-surface-2)]"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center text-sm">
                                                <div className="max-w-sm mx-auto flex flex-col items-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-3 text-[var(--color-muted)]">
                                                        <Receipt className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="font-semibold text-sm text-[var(--color-ink)]">
                                                        {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                                                    </h4>
                                                    <p className="text-xs text-[var(--color-muted)] mt-1 mb-4 leading-relaxed">
                                                        {transactions.length === 0
                                                            ? 'Start logging your expenses and income to see them in your authoritative ledger.'
                                                            : 'No entries match your search or active filter combination. Try resetting filters.'}
                                                    </p>
                                                    {transactions.length === 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={openAddTransaction}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-sm"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Add First Transaction
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearch('');
                                                                setCategoryFilter('all');
                                                                setDateRange('all');
                                                                setTypeFilter('all');
                                                            }}
                                                            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                                                        >
                                                            Reset All Filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
                                <span>
                                    Showing {(page - 1) * PAGE_SIZE + 1}–
                                    {Math.min(page * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length} items
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40 hover:bg-[var(--color-surface-2)]"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2 font-medium text-[var(--color-ink)]">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40 hover:bg-[var(--color-surface-2)]"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </Surface>
                </div>
            )}

            {/* TAB 2: NEEDS REVIEW (INBOX) */}
            {activeTab === 'inbox' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Inbox Header Actions */}
                    <Surface className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-800/40">
                        <div className="flex items-center gap-2.5">
                            <Inbox className="w-5 h-5 text-amber-600" />
                            <div>
                                <h3 className="font-display font-bold text-sm text-[var(--color-ink)]">
                                    Capture Review Queue ({inboxItems.length})
                                </h3>
                                <p className="text-xs text-[var(--color-muted)]">
                                    Unposted charges detected by the browser extension or uploaded statements. Approve to post to ledger.
                                </p>
                            </div>
                        </div>

                        {inboxItems.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedInboxIds.length === inboxItems.length) {
                                            setSelectedInboxIds([]);
                                        } else {
                                            setSelectedInboxIds(inboxItems.map((i) => i.id));
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                                >
                                    {selectedInboxIds.length === inboxItems.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBatchApproveInbox}
                                    disabled={selectedInboxIds.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-success)] text-white hover:opacity-90 shadow-sm disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve Selected ({selectedInboxIds.length})
                                </button>
                            </div>
                        )}
                    </Surface>

                    {/* Inbox Cards List */}
                    {inboxItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {inboxItems.map((item) => {
                                const isSelected = selectedInboxIds.includes(item.id);
                                return (
                                    <Surface
                                        key={item.id}
                                        className={cn(
                                            'p-4 flex flex-col justify-between transition-all border shadow-xs',
                                            isSelected ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]/20' : 'border-[var(--color-border)]'
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedInboxIds([...selectedInboxIds, item.id]);
                                                            } else {
                                                                setSelectedInboxIds(selectedInboxIds.filter((id) => id !== item.id));
                                                            }
                                                        }}
                                                        className="rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
                                                    />
                                                    <span className="font-semibold text-sm text-[var(--color-ink)]">
                                                        {item.description || item.merchant_name || 'Detected Charge'}
                                                    </span>
                                                </div>
                                                <span className="font-display font-bold text-base tabular-nums font-mono text-[var(--color-ink)]">
                                                    {formatCurrency(Math.abs(Number(item.amount || 0)))}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                                                <Badge variant="secondary" className="text-[10px] bg-[var(--color-surface-2)] text-[var(--color-ink)] border-[var(--color-border)]">
                                                    {item.category || 'Shopping'}
                                                </Badge>
                                                <span>·</span>
                                                <span className="font-mono">
                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                                {item.confidence && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-[var(--color-success)] font-medium">
                                                            {Math.round(item.confidence * 100)}% match
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRejectInbox(item.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/30"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApproveInbox(item.id)}
                                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-success)] text-white hover:opacity-90 shadow-sm"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                        </div>
                                    </Surface>
                                );
                            })}
                        </div>
                    ) : (
                        <Surface className="p-16 text-center border-[var(--color-border)]">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-[var(--color-success)] mb-3" />
                            <h3 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Review Queue is Empty
                            </h3>
                            <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto mt-1">
                                Great job! All background captures from checkouts and statement imports have been approved and reconciled.
                            </p>
                        </Surface>
                    )}
                </div>
            )}

            {/* TAB 3: STATEMENT IMPORTS */}
            {activeTab === 'imports' && (
                <div className="space-y-6 animate-fade-in">
                    <Surface className="p-6 border-[var(--color-border)]">
                        <div className="max-w-2xl">
                            <h3 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Bank Statement & Spreadsheet Importer
                            </h3>
                            <p className="text-xs text-[var(--color-muted)] mt-1">
                                Bring your financial history into Cashly without manual typing. Support for PDF statement OCR and CSV spreadsheets.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {/* CSV Importer Card */}
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold text-sm text-[var(--color-ink)]">
                                        CSV Spreadsheet Import
                                    </h4>
                                    <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                                        Upload exports from Chase, Amex, Bank of America, Apple Card, or custom CSV with flexible column mapping.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCSVImport(true)}
                                    className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90 transition-all text-center block"
                                >
                                    Launch CSV Wizard
                                </button>
                            </div>

                            {/* PDF OCR Card */}
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)] text-white flex items-center justify-center mb-3">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold text-sm text-[var(--color-ink)]">
                                        AI PDF Statement Scanner
                                    </h4>
                                    <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                                        Scan monthly PDF bank statements using local OCR to parse charges directly into staged ledger entries.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPDFAnalyzer(true)}
                                    className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-all text-center block"
                                >
                                    Scan PDF Statement
                                </button>
                            </div>
                        </div>
                    </Surface>
                </div>
            )}

            {/* Contextual Side-Sheet for Transaction Inspection */}
            <TransactionSideSheet
                transaction={inspectedTx}
                open={isSideSheetOpen}
                onOpenChange={setIsSideSheetOpen}
                onUpdate={handleUpdateTx}
                onDelete={handleDeleteTx}
            />

            {/* Suspense Modals */}
            <Suspense fallback={null}>
                {showCSVImport && (
                    <CSVImport
                        onImport={() => {
                            setShowCSVImport(false);
                            loadLedger();
                        }}
                        onClose={() => setShowCSVImport(false)}
                    />
                )}
                {showPDFAnalyzer && (
                    <PDFAnalyzer
                        onComplete={() => {
                            setShowPDFAnalyzer(false);
                            loadLedger();
                        }}
                        onClose={() => setShowPDFAnalyzer(false)}
                    />
                )}
                {showExportModal && (
                    <ExportModal
                        transactions={filteredTransactions}
                        onClose={() => setShowExportModal(false)}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default TransactionsPage;
