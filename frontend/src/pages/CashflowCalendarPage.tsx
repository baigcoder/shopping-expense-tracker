import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    CalendarDays, RefreshCw, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Target,
    CheckCircle2, FileText, Repeat
} from 'lucide-react';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlanNavigationTabs } from '@/components/PlanNavigationTabs';
import { toast } from 'sonner';

export const CashflowCalendarPage = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const loadData = useCallback(async () => {
        try {
            const data = await featureExpansionApi.cashflowCalendar();
            setEvents(data || []);
        } catch (error) {
            console.error('Failed to load cashflow calendar:', error);
            toast.error('Could not load calendar data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        toast.success('Calendar timeline updated');
    };

    // Calendar logic
    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthDays = new Date(year, month, 0).getDate();
        const days: Array<{ day: number; month: 'prev' | 'current' | 'next'; date: Date }> = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, month - 1, prevMonthDays - i) });
        }
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: 'current', date: new Date(year, month, i) });
        }
        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: 'next', date: new Date(year, month + 1, i) });
        }
        return days;
    }, [currentDate]);

    // Group events by YYYY-MM-DD
    const grouped = useMemo(() => {
        return events.reduce((acc, event) => {
            const key = String(event.date || '').slice(0, 10);
            if (!acc[key]) acc[key] = [];
            acc[key].push(event);
            return acc;
        }, {} as Record<string, any[]>);
    }, [events]);

    // Stats for the viewed month
    const stats = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthEvents = events.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        const income = monthEvents
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + (e.amount || 0), 0);

        const expense = monthEvents
            .filter(e => e.type === 'expense' || e.type === 'bill')
            .reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);

        return { income, expense, net: income - expense };
    }, [events, currentDate]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const jumpToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Selected day events
    const selectedDateKey = selectedDate.toISOString().split('T')[0];
    const selectedDayEvents = grouped[selectedDateKey] || [];
    const selectedDayOutflow = selectedDayEvents
        .filter(e => e.type === 'expense' || e.type === 'bill')
        .reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);

    const getHeatmapColor = (dailySpend: number) => {
        if (dailySpend > 500) return 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400';
        if (dailySpend > 200) return 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';
        if (dailySpend > 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
        if (dailySpend > 0) return 'bg-[var(--color-surface-subtle)] border-[var(--color-border-subtle)]';
        return '';
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Liquidity Runway & Movement
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Cashflow Timeline
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Interactive monthly schedule of commitments, income paydays, and spending intensity.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', refreshing && 'animate-spin')} />
                        Sync
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={jumpToToday}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 font-bold text-[var(--color-ink)] hover:bg-[#EE5024] hover:text-white hover:border-[#EE5024] transition-all"
                    >
                        Today
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <PlanNavigationTabs />

            {/* Month Navigation & Color-Blocked Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Deep Ink: Timeline Period */}
                <div className="p-6 rounded-[24px] bg-[#111111] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                        <span>Timeline Period</span>
                        <CalendarDays className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-extrabold font-mono text-white">
                            {currentDate.toLocaleString('default', { month: 'short' })} {currentDate.getFullYear()}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={prevMonth}
                                className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-white hover:text-[#111111] transition-all"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-white hover:text-[#111111] transition-all"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Cadmium Orange: Net Monthly Cashflow */}
                <div className="p-6 rounded-[24px] bg-[#EE5024] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
                        <span>Net Monthly Cashflow</span>
                        <Target className="h-4 w-4 text-white" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(stats.net)}
                        </div>
                        <div className="text-xs font-semibold text-white/90 mt-2">
                            {stats.net >= 0 ? 'Positive net monthly liquidity' : 'Net deficit — draw from reserves'}
                        </div>
                    </div>
                </div>

                {/* 3. Warm Ivory / White: Scheduled Outflow */}
                <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/60">
                        <span>Scheduled Outflow</span>
                        <TrendingDown className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(stats.expense)}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Committed bills, rent & subscriptions
                        </div>
                    </div>
                </div>

                {/* 4. Muted Sage / Soft Accent: Projected Inflow */}
                <div className="p-6 rounded-[24px] bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/70">
                        <span>Projected Inflow</span>
                        <TrendingUp className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(stats.income)}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Expected paydays & deposits
                        </div>
                    </div>
                </div>
            </div>


            {/* Calendar & Day Schedule Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2-Col Calendar Grid */}
                <div className="lg:col-span-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] p-4 sm:p-5">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-text-muted)] pb-2 border-b border-[var(--color-border-subtle)]">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-1">{d}</div>
                        ))}
                    </div>

                    {/* Day Cells Grid */}
                    <div className="grid grid-cols-7 gap-1 pt-2">
                        {monthData.map((item, idx) => {
                            const dateStr = item.date.toISOString().split('T')[0];
                            const dayEvents = grouped[dateStr] || [];
                            const dailySpend = dayEvents
                                .filter(e => e.type === 'expense' || e.type === 'bill')
                                .reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
                            const dailyIncome = dayEvents
                                .filter(e => e.type === 'income')
                                .reduce((sum, e) => sum + (e.amount || 0), 0);

                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            const isSelected = selectedDateKey === dateStr;
                            const isCurrentMonth = item.month === 'current';

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedDate(item.date)}
                                    className={cn(
                                        'min-h-[72px] sm:min-h-[84px] p-1.5 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                                        isCurrentMonth ? 'border-[var(--color-border-subtle)]' : 'border-transparent opacity-35',
                                        isSelected
                                            ? 'ring-2 ring-[var(--color-brand)] bg-[var(--color-surface)] shadow-xs z-10'
                                            : getHeatmapColor(dailySpend) || 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]',
                                        isToday && 'font-bold'
                                    )}
                                >
                                    {/* Day Number Header */}
                                    <div className="flex items-center justify-between w-full">
                                        <span className={cn(
                                            'text-xs tabular-nums font-mono',
                                            isToday
                                                ? 'h-5 w-5 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center font-bold text-[10px]'
                                                : isSelected
                                                ? 'text-[var(--color-brand)] font-bold'
                                                : 'text-[var(--color-text-primary)]'
                                        )}>
                                            {item.day}
                                        </span>

                                        {dayEvents.length > 0 && (
                                            <span className="text-[10px] text-[var(--color-text-muted)] font-medium font-mono">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Event Previews / Indicators */}
                                    <div className="space-y-0.5 w-full mt-1">
                                        {dailyIncome > 0 && (
                                            <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded truncate font-mono tabular-nums">
                                                +{formatCurrency(dailyIncome)}
                                            </div>
                                        )}
                                        {dailySpend > 0 && (
                                            <div className="text-[9px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded truncate font-mono tabular-nums">
                                                -{formatCurrency(dailySpend)}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Schedule Side Panel */}
                <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] p-5 space-y-4">
                    <div>
                        <div className="text-xs text-[var(--color-text-muted)] font-medium">Schedule for</div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-0.5">
                            {selectedDate.toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </h2>
                        {selectedDayOutflow > 0 && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 font-mono tabular-nums">
                                Total Scheduled Outflow: {formatCurrency(selectedDayOutflow)}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[var(--color-border-subtle)] pt-3 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {selectedDayEvents.length === 0 ? (
                            <div className="p-8 text-center space-y-2">
                                <div className="h-9 w-9 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    No bills, subscriptions, or transactions scheduled on this date.
                                </p>
                            </div>
                        ) : (
                            selectedDayEvents.map((evt, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                                            evt.type === 'income'
                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                : evt.type === 'bill'
                                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                        )}>
                                            {evt.type === 'income' ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : evt.type === 'bill' ? (
                                                <FileText className="h-4 w-4" />
                                            ) : (
                                                <Repeat className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-xs text-[var(--color-text-primary)]">
                                                {evt.title || evt.name || 'Obligation'}
                                            </div>
                                            <div className="text-[11px] text-[var(--color-text-muted)] capitalize">
                                                {evt.type} • {evt.category || 'Standard'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={cn(
                                            'text-xs font-bold tabular-nums font-mono',
                                            evt.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--color-text-primary)]'
                                        )}>
                                            {evt.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(evt.amount || 0))}
                                        </div>
                                        {evt.status && (
                                            <Badge variant="secondary" className="text-[9px] mt-0.5">
                                                {evt.status}
                                            </Badge>
                                        )}
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

export default CashflowCalendarPage;
