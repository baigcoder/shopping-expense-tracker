// AnalyticsPage — Spending Intelligence
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
    TrendingUp, DollarSign, Store, RefreshCw,
    PieChart as PieIcon, Globe
} from 'lucide-react';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { FINANCIAL_DATA_EVENTS } from '../services/financialDataEvents';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyzeNavigationTabs } from '@/components/AnalyzeNavigationTabs';

const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#B8680B',
    'Food & Dining': '#B8680B',
    'Shopping': '#0E8174',
    'Transport': '#3677E8',
    'Entertainment': '#7753C7',
    'Bills & Utilities': '#56656A',
    'Health': '#17824F',
    'Travel': '#16A394',
    'Income': '#17824F',
    'Other': '#86969C',
};

export const AnalyticsPage = () => {
    const { user } = useAuthStore();
    const sound = useSound();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    const fetchData = useCallback(async (silent = false) => {
        if (!user?.id) return;
        if (!silent) setIsRefreshing(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
            if (loading && !silent) sound.playSuccess();
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id, loading, sound]);

    useEffect(() => {
        const handleRefresh = () => fetchData(true);
        window.addEventListener('analytics-data-changed', handleRefresh);
        FINANCIAL_DATA_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleRefresh);
        });

        return () => {
            window.removeEventListener('analytics-data-changed', handleRefresh);
            FINANCIAL_DATA_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleRefresh);
            });
        };
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter by Time Range
    const filteredTx = useMemo(() => {
        const now = new Date();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            switch (timeRange) {
                case 'week':
                    return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                case 'month':
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                case 'year':
                    return d.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }, [transactions, timeRange]);

    // Primary KPI Metrics
    const totalSpent = useMemo(() => filteredTx.reduce((sum, t) => sum + t.amount, 0), [filteredTx]);
    const avgTicket = useMemo(() => filteredTx.length > 0 ? totalSpent / filteredTx.length : 0, [filteredTx, totalSpent]);
    const uniqueStores = useMemo(() => new Set(filteredTx.map(t => t.description)).size, [filteredTx]);

    // Comparison with prior period
    const changePercent = useMemo(() => {
        const now = new Date();
        const prevTotal = transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            if (timeRange === 'month') {
                const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
            }
            if (timeRange === 'week') {
                const weekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= weekStart && d < weekEnd;
            }
            return false;
        }).reduce((sum, t) => sum + t.amount, 0);

        return prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;
    }, [transactions, totalSpent, timeRange]);

    // Channel breakdown (Online vs In-Store)
    const channelStats = useMemo(() => {
        let onlineSum = 0;
        let instoreSum = 0;

        filteredTx.forEach(t => {
            const desc = (t.description || '').toLowerCase();
            const isOnline = desc.includes('amazon') || desc.includes('online') || desc.includes('.com') || desc.includes('apple') || desc.includes('uber') || desc.includes('doordash');
            if (isOnline) onlineSum += t.amount;
            else instoreSum += t.amount;
        });

        const total = onlineSum + instoreSum || 1;
        return {
            onlineSum,
            instoreSum,
            onlinePercent: Math.round((onlineSum / total) * 100),
            instorePercent: Math.round((instoreSum / total) * 100),
        };
    }, [filteredTx]);

    // Daily spending curve
    const timelineData = useMemo(() => {
        const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;
        const now = new Date();
        const dailyMap: Record<string, number> = {};

        if (timeRange === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            months.forEach(m => { dailyMap[m] = 0; });
            filteredTx.forEach(t => {
                const m = new Date(t.date).toLocaleString('default', { month: 'short' });
                if (dailyMap[m] !== undefined) dailyMap[m] += t.amount;
            });
            return Object.entries(dailyMap).map(([label, amount]) => ({ label, amount }));
        }

        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyMap[key] = 0;
        }

        filteredTx.forEach(t => {
            const key = new Date(t.date).toISOString().split('T')[0];
            if (dailyMap[key] !== undefined) {
                dailyMap[key] += t.amount;
            }
        });

        return Object.entries(dailyMap).map(([date, amount]) => {
            const d = new Date(date);
            return {
                label: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
                amount,
            };
        });
    }, [filteredTx, timeRange]);

    // Category Distribution
    const categoryData = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        filteredTx.forEach(t => {
            const cat = (t.category as any)?.name || (typeof t.category === 'string' ? t.category : 'Other');
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        return Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({
                name,
                value,
                color: CATEGORY_COLORS[name] || '#64748b',
                percent: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0,
            }));
    }, [filteredTx, totalSpent]);

    // Top Merchants
    const topMerchants = useMemo(() => {
        const stores: Record<string, { count: number; amount: number; category: string }> = {};
        filteredTx.forEach(t => {
            const store = t.description || 'Unknown Merchant';
            const cat = (t.category as any)?.name || (typeof t.category === 'string' ? t.category : 'General');
            if (!stores[store]) stores[store] = { count: 0, amount: 0, category: cat };
            stores[store].count++;
            stores[store].amount += t.amount;
        });

        return Object.entries(stores)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
    }, [filteredTx]);

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Spending Dynamics & Volume Concentration
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Financial Analytics
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Question-oriented analytics: Where is money going, merchant concentration, and channels.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center p-1.5 rounded-full bg-white border border-[var(--color-border)] text-xs shadow-xs">
                        {(['week', 'month', 'year'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all',
                                    timeRange === range
                                        ? 'bg-[#111111] text-white shadow-xs'
                                        : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
                                )}
                            >
                                {range === 'week' ? 'Past 7D' : range === 'month' ? 'This Month' : 'This Year'}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData()}
                        disabled={isRefreshing}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', isRefreshing && 'animate-spin')} />
                        Sync
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <AnalyzeNavigationTabs />

            {/* Top Color-Blocked Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cadmium Orange: Total Outflow */}
                <div className="p-6 rounded-[24px] bg-[#EE5024] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
                        <span>Total Outflow ({timeRange})</span>
                        <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(totalSpent)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-white/90">
                            {changePercent !== 0 && (
                                <span className="font-mono">
                                    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </span>
                            )}
                            <span className="text-white/80 font-normal">vs previous period</span>
                        </div>
                    </div>
                </div>

                {/* 2. Deep Ink: Average Transaction Size */}
                <div className="p-6 rounded-[24px] bg-[#111111] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                        <span>Average Ticket</span>
                        <TrendingUp className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(avgTicket)}
                        </div>
                        <div className="text-xs text-white/70 mt-2">
                            Across {filteredTx.length} posted purchases
                        </div>
                    </div>
                </div>

                {/* 3. Warm Ivory / White: Active Merchants */}
                <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/60">
                        <span>Active Merchants</span>
                        <Store className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : uniqueStores}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Distinct retailers and venues
                        </div>
                    </div>
                </div>

                {/* 4. Muted Sage / Soft Accent: Velocity */}
                <div className="p-6 rounded-[24px] bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/70">
                        <span>Categories</span>
                        <PieIcon className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : categoryData.length}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Active expense segments
                        </div>
                    </div>
                </div>
            </div>


            {/* Question 1: Spending Trajectory Curve */}
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Spending Velocity Curve
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Daily cash burn pattern over the selected period
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                        {timelineData.length} Data Points
                    </Badge>
                </div>

                <div className="h-64 w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">Loading charts...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="spendPulse" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D92F57" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#D92F57" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                <XAxis dataKey="label" stroke="currentColor" className="opacity-50" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke="currentColor"
                                    className="opacity-50"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-surface)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#D92F57"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#spendPulse)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Question 2 & 3: Category Allocation & Top Merchants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Donut & Breakdown */}
                <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                                Where Did Money Go?
                            </h2>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Category distribution of expenses
                            </p>
                        </div>
                        <PieIcon className="h-4 w-4 text-[var(--color-brand)]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
                        <div className="h-48 w-full flex items-center justify-center">
                            {categoryData.length === 0 ? (
                                <span className="text-xs text-[var(--color-text-muted)]">No expenses recorded</span>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={4}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => formatCurrency(Number(value))}
                                            contentStyle={{
                                                backgroundColor: 'var(--color-surface)',
                                                borderColor: 'var(--color-border)',
                                                color: 'var(--color-text-primary)',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {categoryData.map(cat => (
                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="font-medium text-[var(--color-text-primary)]">{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold tabular-nums font-mono text-[var(--color-text-primary)]">{formatCurrency(cat.value)}</span>
                                        <span className="text-[var(--color-text-muted)] text-[10px] ml-1.5 font-mono">({cat.percent}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Merchants Leaderboard */}
                <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                                Top Merchants & Venues
                            </h2>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Retailers with highest cumulative charge volume
                            </p>
                        </div>
                        <Store className="h-4 w-4 text-[var(--color-brand)]" />
                    </div>

                    <div className="divide-y divide-[var(--color-border-subtle)] pt-1">
                        {topMerchants.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                                No merchant activity recorded in this period.
                            </div>
                        ) : (
                            topMerchants.map((merchant, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-[var(--color-surface-subtle)] flex items-center justify-center font-bold text-[10px] text-[var(--color-text-secondary)] font-mono">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[var(--color-text-primary)]">{merchant.name}</div>
                                            <div className="text-[10px] text-[var(--color-text-muted)]">{merchant.count} transaction{merchant.count > 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold tabular-nums font-mono text-[var(--color-text-primary)]">
                                        {formatCurrency(merchant.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
