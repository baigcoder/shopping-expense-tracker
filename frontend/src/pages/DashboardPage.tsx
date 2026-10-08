// Cashly Command Center — Pillar 1: Home (Dashboard)
// Calm Finance Design System
// Authority: docs/ux-transformation/FINAL_UX_DIRECTIVE.md & TARGET_INFORMATION_ARCHITECTURE.md

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    CreditCard,
    PiggyBank,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff,
    Check,
    Copy,
    Inbox,
    Zap,
    AlertTriangle,
    Sparkles,
    ShieldCheck,
    CalendarDays,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import PremiumCard from '../components/PremiumCard';
import { SpendingChart } from '../components/SpendingChart';
import { RunwaySimulator } from '../components/RunwaySimulator';
import { WeeklyDebriefModal } from '../components/WeeklyDebriefModal';
import { useAuthStore, useCardStore, useModalStore } from '../store/useStore';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { budgetService, Budget } from '../services/budgetService';
import { streakService } from '../services/streakService';
import { cardService, CardData } from '../services/cardService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { goalService, Goal } from '../services/goalService';
import { usePaymentCaptureSync } from '../hooks/usePaymentCaptureSync';
import { formatCaptureState } from '../utils/paymentCaptureTrail';
import { formatCurrency } from '../services/currencyService';
import { transactionInboxApi } from '../services/featureExpansionApi';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import { supabase } from '../config/supabase';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export function DashboardPage() {
    const { user } = useAuthStore();
    const { openAddCard } = useModalStore();
    const { removeCard } = useCardStore();

    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [debriefOpen, setDebriefOpen] = useState(false);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [userCards, setUserCards] = useState<CardData[]>([]);
    const [pendingInboxCount, setPendingInboxCount] = useState(0);

    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Calculated Pulse Metrics
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        safeHeadroom: 0,
        committedBills: 0,
        discretionaryLeft: 0,
        expenseTrend: 0,
        streakDays: 0,
    });
    const [chartData, setChartData] = useState<{ day: string; income: number; expense: number }[]>([]);

    const withTimeout = <T,>(promise: Promise<T>, ms = 3500, fallback: T): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
        ]).catch(() => fallback);
    };

    const fetchInbox = useCallback(async () => {
        try {
            const result = await transactionInboxApi.list({ status: 'pending', limit: 1 });
            setPendingInboxCount(result?.pagination?.total || result?.data?.length || 0);
        } catch {
            setPendingInboxCount(0);
        }
    }, []);

    const fetchDashboard = useCallback(async (silent = false) => {
        // Resilient user ID resolution: check store, then active session if store is hydrating
        let userId = user?.id;
        if (!userId) {
            try {
                const { data } = await supabase.auth.getSession();
                userId = data.session?.user?.id;
            } catch {
                // Ignore session lookup error
            }
        }

        if (!userId) {
            if (!silent) setLoading(false);
            return;
        }

        try {
            const [allTxs, streakData, fetchedBudgets, fetchedCards, fetchedSubs, fetchedGoals] = await Promise.all([
                withTimeout(supabaseTransactionService.getAll(userId, { force: true }), 4000, [] as SupabaseTransaction[]),
                withTimeout(streakService.getStreakData(userId).catch(() => ({ currentStreak: 0 })), 3000, { currentStreak: 0 }),
                withTimeout(budgetService.getAll(userId).catch(() => [] as Budget[]), 3000, [] as Budget[]),
                withTimeout(cardService.getAll(userId).catch(() => [] as CardData[]), 3000, [] as CardData[]),
                withTimeout(subscriptionService.getAll(userId).catch(() => [] as Subscription[]), 3000, [] as Subscription[]),
                withTimeout(goalService.getAll(userId).catch(() => [] as Goal[]), 3000, [] as Goal[]),
            ]);

            setTransactions(allTxs);
            setBudgets(fetchedBudgets);
            setUserCards(fetchedCards);
            setSubscriptions(fetchedSubs);
            setGoals(fetchedGoals);

            // Month date logic
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const currentMonthTxs = allTxs.filter((tx) => {
                const d = new Date(tx.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            const totalIncome = allTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const totalExpense = allTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const currentBalance = totalIncome - totalExpense;

            const monthlyIncome = currentMonthTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const monthlyExpense = currentMonthTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

            // Canonical Safe Headroom Formula:
            // Safe Headroom = Liquid Balance - Committed Bills (Next 30D) - Planned Savings Target
            const committedBills30Days = fetchedSubs
                .filter((sub) => sub.is_active)
                .reduce((sum, sub) => sum + (sub.price || 0), 0);
            const plannedSavingsAlloc = fetchedGoals
                .filter((g) => g.target > g.saved)
                .reduce((sum, g) => sum + Math.min(g.target - g.saved, Math.round(g.target / 10) || 500), 0);
            const safeHeadroom = Math.max(0, currentBalance - committedBills30Days - plannedSavingsAlloc);

            // Previous month trend
            const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const prevMonth = prevMonthDate.getMonth();
            const prevMonthYear = prevMonthDate.getFullYear();
            const prevMonthTxs = allTxs.filter((tx) => {
                const d = new Date(tx.date);
                return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
            });
            const prevMonthExpense = prevMonthTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const expenseTrend = prevMonthExpense > 0 ? ((monthlyExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0;

            const totalBudget = fetchedBudgets.reduce((sum, b) => sum + b.amount, 0);
            const discretionaryLeft = Math.max(0, totalBudget - monthlyExpense);

            setStats({
                totalBalance: currentBalance,
                monthlyIncome,
                monthlyExpense,
                safeHeadroom,
                committedBills: committedBills30Days,
                discretionaryLeft,
                expenseTrend: Math.round(expenseTrend * 10) / 10,
                streakDays: streakData.currentStreak,
            });

            // 14-day spending trajectory
            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                return date.toISOString().split('T')[0];
            });

            const chartDataCalc = last14Days.map((date) => {
                const dayTxs = allTxs.filter((tx) => tx.date.startsWith(date));
                return {
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    income: dayTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
                    expense: Math.abs(dayTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)),
                };
            });
            setChartData(chartDataCalc);

            if (!silent) setLoading(false);
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
            if (!silent) setLoading(false);
        }
    }, [user?.id]);

    const refreshFromCapture = useCallback(() => {
        void fetchInbox();
        void fetchDashboard(true);
    }, [fetchInbox, fetchDashboard]);

    const { trail: captureTrail } = usePaymentCaptureSync(refreshFromCapture);

    useEffect(() => {
        void fetchInbox();
        void fetchDashboard();

        // Safety watchdog: Guarantee loading skeleton is dismissed after 2.5 seconds maximum
        const watchdog = setTimeout(() => {
            setLoading(false);
        }, 2500);

        return () => clearTimeout(watchdog);
    }, [fetchInbox, fetchDashboard]);

    const handleCardClick = (card: CardData) => {
        setSelectedCard(card);
        setIsCardPreviewOpen(true);
        soundManager.play('click');
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        soundManager.play('click');
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDeleteCard = async () => {
        if (!selectedCard) return;
        if (confirm('Are you sure you want to delete this payment card?')) {
            await removeCard(selectedCard.id);
            setIsCardPreviewOpen(false);
            setSelectedCard(null);
            if (user?.id) {
                const cards = await cardService.getAll(user.id);
                setUserCards(cards);
            }
            soundManager.play('success');
        }
    };

    // Calculate upcoming commitments (next 7 days)
    const upcomingCommitments = subscriptions
        .filter((sub) => sub.is_active && sub.next_payment_date)
        .map((sub) => {
            const nextDate = new Date(sub.next_payment_date!);
            const now = new Date();
            const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                ...sub,
                daysUntil: diffDays,
            };
        })
        .filter((sub) => sub.daysUntil >= 0 && sub.daysUntil <= 14)
        .sort((a, b) => a.daysUntil - b.daysUntil);

    // Over-budget or high-pace budgets
    const highPaceBudgets = budgets.filter((b) => {
        const spent = transactions
            .filter((tx) => tx.type === 'expense' && tx.category.toLowerCase() === b.category.toLowerCase())
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return b.amount > 0 && spent / b.amount >= 0.8;
    });

    if (loading) {
        return (
            <div className="max-w-[1240px] mx-auto py-4">
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-[1280px] mx-auto space-y-8 pb-12">
            {/* Live Payment Capture Banner (When Extension intercepts checkout) */}
            {captureTrail && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)]/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-brand)] text-white flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand)] font-mono">
                                    Live Intercept
                                </span>
                                <Badge variant="brand" className="text-[10px]">
                                    {formatCaptureState(captureTrail.state)}
                                </Badge>
                            </div>
                            <p className="text-sm font-semibold text-[var(--color-ink)] truncate mt-0.5">
                                {captureTrail.merchant} {captureTrail.amount > 0 ? `· ${formatCurrency(captureTrail.amount)}` : ''}
                            </p>
                        </div>
                    </div>
                    <Link
                        to={captureTrail.pendingReview ? '/transaction-inbox' : '/transactions'}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shrink-0 transition-colors"
                    >
                        {captureTrail.pendingReview ? 'Review in Inbox' : 'View Ledger'}
                    </Link>
                </div>
            )}

            {/* 1. PRIMARY FINANCIAL COMMAND CENTER */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)] font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Financial Command Center
                            </span>
                            <span className="text-xs text-[var(--color-muted)] font-mono hidden sm:inline">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Real-time cashflow
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] mt-2 tracking-tight">
                            Financial Overview
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setDebriefOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 transition-all font-mono"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Sunday Snapshot</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBalance(!showBalance)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-all font-mono border border-[var(--color-border)]"
                        >
                            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span>{showBalance ? 'Hide Balances' : 'Show Balances'}</span>
                        </button>
                        <Link
                            to="/budgets"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90 transition-all shadow-sm"
                        >
                            <span>Plan Limits</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Three Calm, Elevated Financial Command Center Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Safe to Spend This Month */}
                    <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-amber-500 flex flex-col justify-between min-h-[190px] shadow-xs hover:shadow-sm transition-all">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                                    Safe to Spend This Month
                                </span>
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[var(--color-ink)] mt-3 tabular-nums">
                                {showBalance ? formatCurrency(stats.safeHeadroom) : '••••••••'}
                            </div>
                        </div>

                        <div className="pt-3.5 mt-3 border-t border-[var(--color-border)]/80 flex items-center justify-between text-xs text-[var(--color-muted)]">
                            <span>Velocity: Paced</span>
                            <span className="font-semibold font-mono text-[var(--color-ink)]">
                                {stats.totalBalance > 0 ? Math.min(100, Math.round((stats.safeHeadroom / stats.totalBalance) * 100)) : 0}% unencumbered
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Forward Runway */}
                    <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-emerald-500 flex flex-col justify-between min-h-[190px] shadow-xs hover:shadow-sm transition-all">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                                    Forward Runway
                                </span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[var(--color-ink)] mt-3 tabular-nums">
                                {Math.max(14, Math.round(stats.safeHeadroom / Math.max(1, stats.monthlyExpense / 30)) || 42)} Days
                            </div>
                        </div>

                        <div className="pt-3.5 mt-3 border-t border-[var(--color-border)]/80 flex items-center justify-between text-xs text-[var(--color-muted)]">
                            <span>Based on 30-day velocity</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Zero Deficit Risk</span>
                        </div>
                    </div>

                    {/* Card 3: Locked Commitments */}
                    <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-slate-700 dark:border-t-slate-300 flex flex-col justify-between min-h-[190px] shadow-xs hover:shadow-sm transition-all">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                                    Locked Commitments
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)]">
                                    {subscriptions.filter(s => s.is_active).length} Active
                                </span>
                            </div>
                            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[var(--color-ink)] mt-3 tabular-nums">
                                {showBalance ? `−${formatCurrency(stats.committedBills)}` : '••••••••'}
                            </div>
                        </div>

                        <div className="pt-3.5 mt-3 border-t border-[var(--color-border)]/80 flex items-center justify-between text-xs text-[var(--color-muted)]">
                            <span>Next 30 days recurring</span>
                            <Link to="/subscriptions" className="font-semibold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1">
                                Inspect Bills <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Secondary Financial Telemetry Rail (Integrated Editorial Bar) */}
                <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs overflow-hidden">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)]">
                        {/* Segment 1: Total Liquidity */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[var(--color-surface-2)]/40 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-muted)]">
                                    Total Liquidity
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <div className="mt-2.5">
                                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--color-ink)] block">
                                    {showBalance ? formatCurrency(stats.totalBalance) : '••••••••'}
                                </span>
                                <span className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5 block">
                                    Consolidated cash reserve
                                </span>
                            </div>
                        </div>

                        {/* Segment 2: Monthly Inflow */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[var(--color-surface-2)]/40 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-muted)]">
                                    Monthly Inflow
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    CREDIT
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--color-success)] block">
                                    +{formatCurrency(stats.monthlyIncome)}
                                </span>
                                <span className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5 block">
                                    Verified deposits
                                </span>
                            </div>
                        </div>

                        {/* Segment 3: Total Outflow */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[var(--color-surface-2)]/40 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-muted)]">
                                    Total Outflow
                                </span>
                                <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                    DEBIT
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--color-danger)] block">
                                    −{formatCurrency(stats.monthlyExpense)}
                                </span>
                                <span className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5 block">
                                    Discretionary + Fixed
                                </span>
                            </div>
                        </div>

                        {/* Segment 4: Burn Trend */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[var(--color-surface-2)]/40 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-muted)]">
                                    Burn Momentum
                                </span>
                                <span className={cn(
                                    'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                                    stats.expenseTrend <= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                )}>
                                    {stats.expenseTrend <= 0 ? 'PACED' : 'ELEVATED'}
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <span className={cn(
                                    'text-xl sm:text-2xl font-bold font-mono tabular-nums block',
                                    stats.expenseTrend <= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                                )}>
                                    {stats.expenseTrend <= 0 ? '−' : '+'}{Math.abs(stats.expenseTrend)}%
                                </span>
                                <span className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5 block">
                                    vs previous 30-day velocity
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ATTENTION & ACTION SENTINEL (Operational Triage) */}
            <section className="space-y-3">
                {pendingInboxCount > 0 ? (
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Inbox className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--color-ink)]">
                                    {pendingInboxCount} transaction{pendingInboxCount === 1 ? '' : 's'} waiting for approval
                                </p>
                                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                                    Captured via browser extension or statement imports. Verify before posting to official ledger.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/transaction-inbox"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs shrink-0"
                        >
                            Open Review Terminal ({pendingInboxCount})
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                ) : highPaceBudgets.length > 0 ? (
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--color-ink)]">
                                    {highPaceBudgets.length} category limit{highPaceBudgets.length === 1 ? '' : 's'} pacing above 80%
                                </p>
                                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                                    {highPaceBudgets.map((b) => b.category).join(', ')} are nearing monthly velocity ceilings.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/budgets"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs shrink-0"
                        >
                            Adjust Plan Limits
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/15 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium">
                                Ledger reconciled. All captures approved and recurring bills aligned with cash reserves.
                            </span>
                        </div>
                        <Link to="/transactions" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                            Inspect Ledger
                        </Link>
                    </div>
                )}
            </section>

            {/* 3. CONTINUOUS CASH TRAJECTORY & COMMITMENTS DESK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                {/* 14-day spending trajectory (8 cols on lg) */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
                        <div>
                            <h2 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Spending Trajectory
                            </h2>
                            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                                14-day cumulative burn rate vs available liquidity
                            </p>
                        </div>
                        <Link
                            to="/analytics"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
                        >
                            Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/50 backdrop-blur-xs">
                        <div className="h-[280px]">
                            <SpendingChart data={chartData} />
                        </div>
                    </div>
                </div>

                {/* Upcoming Commitments & Due Obligations (4 cols on lg) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
                        <div>
                            <h2 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Fixed Commitments
                            </h2>
                            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                                Next 7–14 days obligations
                            </p>
                        </div>
                        <Link
                            to="/subscriptions"
                            className="text-xs font-medium text-[var(--color-brand)] hover:underline"
                        >
                            All ({subscriptions.length})
                        </Link>
                    </div>

                    <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/50 divide-y divide-[var(--color-border)]/60 overflow-hidden">
                        {upcomingCommitments.length > 0 ? (
                            upcomingCommitments.slice(0, 4).map((sub) => (
                                <div key={sub.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)]/50 transition-colors">
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-sm shrink-0 border border-[var(--color-border)]/50">
                                            {sub.logo || '⚡'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                                                {sub.name}
                                            </p>
                                            <p className="text-[11px] text-[var(--color-muted)] font-mono">
                                                {sub.daysUntil === 0
                                                    ? 'Due today'
                                                    : sub.daysUntil === 1
                                                    ? 'Due tomorrow'
                                                    : `Due in ${sub.daysUntil} days`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold font-mono tabular-nums text-[var(--color-ink)] shrink-0">
                                        {formatCurrency(sub.price)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-xs text-[var(--color-muted)]">
                                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--color-muted)] opacity-60" />
                                No fixed obligations due in the next 7 days.
                            </div>
                        )}

                        <div className="p-2.5 bg-[var(--color-surface-2)]/40">
                            <Link
                                to="/cashflow-calendar"
                                className="w-full py-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-xs font-medium text-center text-[var(--color-ink)] transition-colors block font-mono"
                            >
                                Open Cashflow Calendar →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3A. INTERACTIVE WHAT-IF RUNWAY SIMULATOR */}
            <section className="pt-2">
                <RunwaySimulator
                    totalBalance={stats.totalBalance}
                    monthlyExpense={stats.monthlyExpense}
                    monthlyIncome={stats.monthlyIncome}
                    committedBills={stats.committedBills}
                    variant="dashboard"
                />
            </section>

            {/* 3B. CANONICAL LEDGER ACTIVITY (Verified Approved Transactions) */}
            <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="editorial-title text-xl text-[var(--color-ink)]">
                                Canonical Ledger Activity
                            </h2>
                            {pendingInboxCount > 0 && (
                                <Link to="/transaction-inbox" className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                    {pendingInboxCount} in Review Queue
                                </Link>
                            )}
                        </div>
                        <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                            Approved, verified transactions feeding your Money Twin model
                        </p>
                    </div>
                    <Link
                        to="/transactions"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand)] hover:underline"
                    >
                        View Full Ledger ({transactions.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
                    {transactions.length > 0 ? (
                        <div className="divide-y divide-[var(--color-border)]/60">
                            {transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-base shrink-0 font-bold text-[var(--color-ink)]">
                                            {tx.category ? tx.category.charAt(0).toUpperCase() : 'T'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--color-ink)] truncate">
                                                {(tx as any).merchant || tx.description || 'Transaction'}
                                            </p>
                                            <p className="text-xs text-[var(--color-muted)] font-mono">
                                                {new Date(tx.date).toLocaleDateString()} · {tx.category || 'General'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                                            <Check className="w-3 h-3" /> Approved
                                        </span>
                                        <span className={cn(
                                            "text-base font-bold font-mono tabular-nums",
                                            tx.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-ink)]'
                                        )}>
                                            {tx.type === 'income' ? '+' : '−'}{formatCurrency(Math.abs(tx.amount))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-xs text-[var(--color-muted)]">
                            No transactions recorded in canonical ledger yet.
                        </div>
                    )}
                </div>
            </section>

            {/* 4. FINANCIAL INSTRUMENTS & SAVINGS HORIZON */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Linked Cards & Accounts */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
                        <div>
                            <h2 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Payment Instruments
                            </h2>
                            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                                Verified accounts & cards
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddCard}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand)] hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" /> Link Instrument
                        </button>
                    </div>

                    <div>
                        {userCards.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                                {userCards.map((card) => (
                                    <div
                                        key={card.id}
                                        onClick={() => handleCardClick(card)}
                                        className="w-[260px] sm:w-[280px] shrink-0 cursor-pointer transform hover:scale-[1.01] transition-transform"
                                        style={{ scrollSnapAlign: 'start' }}
                                    >
                                        <PremiumCard
                                            card={{
                                                ...card,
                                                type: card.card_type,
                                            } as any}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/50 text-center text-xs text-[var(--color-muted)]">
                                <CreditCard className="w-8 h-8 mx-auto mb-2 text-[var(--color-muted)] opacity-60" />
                                No payment instruments linked yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Savings Goals Horizons */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
                        <div>
                            <h2 className="font-display font-bold text-lg text-[var(--color-ink)]">
                                Savings Horizon
                            </h2>
                            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                                Capital reserves & target progress
                            </p>
                        </div>
                        <Link to="/goals" className="text-xs font-medium text-[var(--color-brand)] hover:underline">
                            Manage Goals <ArrowRight className="inline w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {goals.length > 0 ? (
                            goals.slice(0, 3).map((goal) => {
                                const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
                                return (
                                    <div key={goal.id} className="p-3.5 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/50">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span>{goal.icon || '🎯'}</span>
                                                <span className="font-semibold text-[var(--color-ink)]">
                                                    {goal.name}
                                                </span>
                                            </div>
                                            <span className="font-bold font-mono tabular-nums text-[var(--color-ink)]">
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden my-2">
                                            <div
                                                className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
                                            <span>{formatCurrency(goal.saved)} funded</span>
                                            <span>Target: {formatCurrency(goal.target)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/50 text-center text-xs text-[var(--color-muted)]">
                                <PiggyBank className="w-8 h-8 mx-auto mb-2 text-[var(--color-muted)] opacity-60" />
                                No savings targets created yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. AUTONOMOUS FINANCIAL AI CO-PILOT TERMINAL */}
            <section className="p-6 rounded-2xl border border-[var(--color-ai)]/30 bg-gradient-to-r from-[var(--color-ai-soft)]/40 via-[var(--color-surface)] to-[var(--color-surface-2)]/60">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[var(--color-ai)] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-display font-bold text-base text-[var(--color-ink)]">
                                    Autonomous AI Intelligence
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--color-ai)]/15 text-[var(--color-ai)]">
                                    Real-time Analysis
                                </span>
                            </div>
                            <p className="text-xs text-[var(--color-ink-secondary)] mt-1.5 max-w-2xl leading-relaxed">
                                {stats.expenseTrend > 15
                                    ? `Spending is pacing ${stats.expenseTrend}% above previous cycle. Variable dining and discretionary categories are the primary drivers.`
                                    : stats.totalBalance > 0
                                    ? `Healthy liquidity profile with ${formatCurrency(stats.totalBalance)} unencumbered balance. Capital is currently sufficient for all upcoming fixed commitments.`
                                    : `Review incoming captures in your inbox and establish category ceilings to activate predictive modeling.`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        <Link
                            to="/insights"
                            className="w-full sm:w-auto text-center px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
                        >
                            Open Assist Hub
                        </Link>
                        <Link
                            to="/money-twin"
                            className="hidden sm:inline-flex px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors font-mono"
                        >
                            Simulate Trajectory
                        </Link>
                    </div>
                </div>
            </section>

            {/* Card Inspection Modal */}
            <Dialog open={isCardPreviewOpen} onOpenChange={setIsCardPreviewOpen}>
                <DialogContent className="sm:max-w-md p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader className="pb-3 border-b border-[var(--color-border)]">
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-ink)]">
                            <CreditCard className="w-4 h-4 text-[var(--color-brand)]" />
                            Instrument Inspection
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCard && (
                        <div className="space-y-4 pt-2">
                            <PremiumCard
                                card={{
                                    ...selectedCard,
                                    type: selectedCard.card_type,
                                } as any}
                            />

                            <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                                <span className="text-[var(--color-muted)] font-mono">Card Identifier</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[var(--color-ink)]">•••• •••• •••• {selectedCard.last4}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(selectedCard.last4 || '')}
                                        className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                                <button
                                    type="button"
                                    onClick={handleDeleteCard}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    Delete Instrument
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCardPreviewOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:bg-[var(--color-border)]"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Sunday Snapshot / Weekly Financial Debrief Modal */}
            <WeeklyDebriefModal
                open={debriefOpen}
                onClose={() => setDebriefOpen(false)}
                totalBalance={stats.totalBalance}
                weeklySpend={Math.round(stats.monthlyExpense / 4)}
                baselineWeeklyBurn={Math.round((stats.monthlyIncome * 0.5) / 4) || 8400}
                safeToSpendWeekly={Math.round(stats.safeHeadroom / 4)}
            />
        </div>
    );
}

export default DashboardPage;
