import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Wallet, RefreshCw, Target,
    TrendingUp, Clock, Flame, AlertTriangle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../services/currencyService';
import { budgetService, Budget } from '../services/budgetService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { PlanNavigationTabs } from '@/components/PlanNavigationTabs';

const BUDGET_CATEGORIES = [
    'Shopping', 'Food & Dining', 'Transport', 'Entertainment',
    'Bills & Utilities', 'Health', 'Education', 'Travel', 'Other'
];

const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
        'Shopping': '🛍️', 'Food & Dining': '🍽️', 'Transport': '🚗',
        'Entertainment': '🎬', 'Bills & Utilities': '💡', 'Health': '💊',
        'Education': '📚', 'Travel': '✈️', 'Other': '📦'
    };
    return emojis[category] || '📦';
};

type FilterStatus = 'all' | 'risk' | 'safe';

export const BudgetsPage = () => {
    const { user } = useAuth();
    const sound = useSound();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newBudget, setNewBudget] = useState({ category: 'Shopping', limit: '' });
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

    // Calendar progress for pace calculation
    const now = new Date();
    const currentDay = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgressPercent = (currentDay / totalDaysInMonth) * 100;

    const calculateSpending = useCallback((txList: SupabaseTransaction[], budgetList: Budget[]) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentTx = txList.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        });
        const spending: Record<string, number> = {};
        currentTx.forEach(t => {
            const txCategory = typeof t.category === 'string' ? t.category.toLowerCase() : (t.category as any)?.name?.toLowerCase() || 'other';
            const matchingBudget = budgetList.find(b =>
                b.category.toLowerCase() === txCategory ||
                b.category.toLowerCase().includes(txCategory) ||
                txCategory.includes(b.category.toLowerCase())
            );
            if (matchingBudget) {
                spending[matchingBudget.category] = (spending[matchingBudget.category] || 0) + t.amount;
            }
        });
        return spending;
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsRefreshing(true);
        try {
            const [fetchedBudgets, fetchedTransactions] = await Promise.all([
                budgetService.getAll(user.id),
                supabaseTransactionService.getAll(user.id)
            ]);
            setBudgets(fetchedBudgets);
            setTransactions(fetchedTransactions);
            setSpendingMap(calculateSpending(fetchedTransactions, fetchedBudgets));
        } catch (error) {
            console.error("Failed to load budget data", error);
            toast.error("Failed to load budgets");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, calculateSpending]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBudget.category || !newBudget.limit || !user) return;
        setSaving(true);
        try {
            const limitNum = parseFloat(newBudget.limit);
            if (isNaN(limitNum) || limitNum <= 0) throw new Error('Please enter a valid amount');

            const created = await budgetService.create({
                user_id: user.id,
                category: newBudget.category,
                amount: limitNum,
                period: 'monthly'
            });
            if (created) {
                const updatedBudgets = [...budgets, created];
                setBudgets(updatedBudgets);
                setSpendingMap(calculateSpending(transactions, updatedBudgets));
                setNewBudget({ category: 'Shopping', limit: '' });
                setShowModal(false);
                toast.success('Budget cap activated');
                sound.playSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save budget");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBudget = async (id: string, category: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Remove monthly cap for ${category}?`)) return;
        if (await budgetService.delete(id)) {
            setBudgets(budgets.filter(b => b.id !== id));
            toast.success("Budget removed");
            sound.playClick();
        }
    };

    // Global Stats
    const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + b.amount, 0), [budgets]);
    const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + (spendingMap[b.category] || 0), 0), [budgets, spendingMap]);
    const remainingCash = totalBudget - totalSpent;
    const globalProgressPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Projected Month-End Global
    const projectedGlobalTotal = currentDay > 0 ? (totalSpent / currentDay) * totalDaysInMonth : 0;
    const globalOverrunRisk = projectedGlobalTotal > totalBudget && totalBudget > 0;

    // Decorated Budgets with Velocity Analytics
    const decoratedBudgets = useMemo(() => {
        return budgets.map(b => {
            const spent = spendingMap[b.category] || 0;
            const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const remaining = b.amount - spent;
            const projectedMonthEnd = currentDay > 0 ? (spent / currentDay) * totalDaysInMonth : spent;
            const projectedOverrun = projectedMonthEnd - b.amount;
            
            // Pace assessment:
            // High pace if spent % exceeds calendar % by more than 15%, or if already >= 100%
            const isOverBudget = spent >= b.amount;
            const isHighPace = !isOverBudget && (progress > monthProgressPercent + 12 || progress >= 85);
            const isOnTrack = !isOverBudget && !isHighPace;

            return {
                ...b,
                spent,
                progress,
                remaining,
                projectedMonthEnd,
                projectedOverrun,
                isOverBudget,
                isHighPace,
                isOnTrack,
            };
        });
    }, [budgets, spendingMap, currentDay, totalDaysInMonth, monthProgressPercent]);

    // Filtered
    const filteredBudgets = useMemo(() => {
        if (filterStatus === 'risk') {
            return decoratedBudgets.filter(b => b.isOverBudget || b.isHighPace);
        }
        if (filterStatus === 'safe') {
            return decoratedBudgets.filter(b => b.isOnTrack);
        }
        return decoratedBudgets;
    }, [decoratedBudgets, filterStatus]);

    const highRiskCount = decoratedBudgets.filter(b => b.isOverBudget || b.isHighPace).length;

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Guardrails & Pace Governance
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Budgets & Velocity
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Category guardrails, daily burn pace, and projected month-end overrun warnings.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', isRefreshing && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowModal(true)}
                        className="rounded-full bg-[#EE5024] hover:bg-[#EE5024]/90 text-white font-bold text-xs h-10 px-6 shadow-sm transition-all"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Budget Cap
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <PlanNavigationTabs
                badges={{
                    budgets: budgets.length,
                }}
            />

            {/* Overview Color-Blocked Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cadmium Orange: Discretionary Headroom */}
                <div className="p-6 rounded-[24px] bg-[#EE5024] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
                        <span>Discretionary Headroom</span>
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {isLoading ? '—' : formatCurrency(remainingCash)}
                        </div>
                        <div className="text-xs font-semibold text-white/90 mt-2">
                            {remainingCash < 0 ? 'Deficit across budget limits' : 'Remaining cash balance before cap'}
                        </div>
                    </div>
                </div>

                {/* 2. Deep Ink: Total Monthly Cap */}
                <div className="p-6 rounded-[24px] bg-[#111111] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                        <span>Total Monthly Cap</span>
                        <Target className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {isLoading ? '—' : formatCurrency(totalBudget)}
                        </div>
                        <div className="text-xs text-white/70 mt-2">
                            Allocated across {budgets.length} categories
                        </div>
                    </div>
                </div>

                {/* 3. Warm Ivory / White: Month Burn to Date */}
                <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/60">
                        <span>Month Burn to Date</span>
                        <Flame className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {isLoading ? '—' : formatCurrency(totalSpent)}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-ink)]/70 font-medium">
                            <span className="font-bold text-[var(--color-ink)]">{globalProgressPercent.toFixed(0)}% consumed</span>
                            <span>•</span>
                            <span>Day {currentDay} of {totalDaysInMonth}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Muted Sage / Soft Accent: Projected Month-End */}
                <div className="p-6 rounded-[24px] bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/70">
                        <span>Projected Month-End</span>
                        <TrendingUp className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {isLoading ? '—' : formatCurrency(projectedGlobalTotal)}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            {globalOverrunRisk ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    +{formatCurrency(projectedGlobalTotal - totalBudget)} overrun
                                </span>
                            ) : (
                                <span className="text-emerald-700 font-bold">On pace to remain under cap</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Velocity Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            filterStatus === 'all'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        All Categories ({decoratedBudgets.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('risk')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                            filterStatus === 'risk'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        <span>Pace Risks & Overruns</span>
                        {highRiskCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold font-mono">
                                {highRiskCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatus('safe')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            filterStatus === 'safe'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        On Track ({decoratedBudgets.filter(b => b.isOnTrack).length})
                    </button>
                </div>

                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Month is {monthProgressPercent.toFixed(0)}% elapsed</span>
                </div>
            </div>

            {/* Budget Cards Grid */}
            {isLoading ? (
                <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Computing spending velocities and month-end projections...
                </div>
            ) : filteredBudgets.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {filterStatus === 'risk' ? 'No spending pace risks detected' : 'No budget limits configured'}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
                            {filterStatus === 'risk'
                                ? 'All active category limits are pacing safely below their calendar benchmarks.'
                                : 'Set spending limits on food, shopping, and entertainment to manage cashflow.'}
                        </p>
                    </div>
                    {filterStatus !== 'risk' && (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                onClick={() => setShowModal(true)}
                                className="rounded-xl bg-[var(--color-brand)] text-white text-xs"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add First Budget Limit
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredBudgets.map((b) => {
                            const progressClamped = Math.min(b.progress, 100);

                            return (
                                <motion.div
                                    key={b.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border)] transition-all space-y-4"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center text-lg border border-[var(--color-border-subtle)]">
                                                {getCategoryEmoji(b.category)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                    {b.category}
                                                </h3>
                                                <div className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
                                                    Cap: {formatCurrency(b.amount)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {b.isOverBudget ? (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    Over Budget
                                                </Badge>
                                            ) : b.isHighPace ? (
                                                <Badge variant="warning" className="text-[10px]">
                                                    Pacing High
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" className="text-[10px]">
                                                    On Track
                                                </Badge>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => handleDeleteBudget(b.id, b.category, e)}
                                                className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-rose-600 rounded-lg"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Utilization Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[var(--color-text-secondary)] font-medium">
                                                {b.progress.toFixed(0)}% consumed
                                            </span>
                                            <span className="tabular-nums font-mono font-semibold text-[var(--color-text-primary)]">
                                                {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    b.isOverBudget
                                                        ? 'bg-rose-500'
                                                        : b.isHighPace
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                )}
                                                style={{ width: `${progressClamped}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Velocity & Projection Diagnostics */}
                                    <div className="pt-2 border-t border-[var(--color-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block">
                                                Remaining
                                            </span>
                                            <span className={cn(
                                                "font-semibold tabular-nums font-mono",
                                                b.remaining < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                                            )}>
                                                {b.remaining < 0 ? `-${formatCurrency(Math.abs(b.remaining))}` : formatCurrency(b.remaining)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block">
                                                Projected Run
                                            </span>
                                            <span className={cn(
                                                "font-semibold tabular-nums font-mono",
                                                b.projectedOverrun > 0 ? "text-amber-600 dark:text-amber-400" : "text-[var(--color-text-primary)]"
                                            )}>
                                                {formatCurrency(b.projectedMonthEnd)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Budget Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[var(--color-text-primary)]">Set Category Spending Cap</DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Establish a monthly ceiling to track your burn rate velocity.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddBudget} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="budget-category" className="text-xs font-semibold text-[var(--color-text-primary)]">Category</Label>
                            <Select
                                value={newBudget.category}
                                onValueChange={(val) => setNewBudget(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger id="budget-category" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                    {BUDGET_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            <span className="mr-2">{getCategoryEmoji(cat)}</span>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="budget-amount" className="text-xs font-semibold text-[var(--color-text-primary)]">Monthly Limit Amount</Label>
                            <Input
                                id="budget-amount"
                                type="number"
                                step="1"
                                placeholder="500"
                                value={newBudget.limit}
                                onChange={e => setNewBudget(prev => ({ ...prev, limit: e.target.value }))}
                                required
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="rounded-xl text-xs border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs"
                            >
                                {saving ? 'Activating...' : 'Activate Budget'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetsPage;
