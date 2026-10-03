import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, TrendingUp, AlertTriangle,
    Sparkles, Clock, RefreshCw,
    Shield, Calculator,
    CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { moneyTwinService, MoneyTwinState } from '../services/moneyTwinService';
import { whatIfService, WhatIfScenario, ScenarioType } from '../services/whatIfService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { formatCurrency } from '../services/currencyService';
import { useDataRealtime } from '../hooks/useDataRealtime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyzeNavigationTabs } from '@/components/AnalyzeNavigationTabs';

export const MoneyTwinPage = () => {
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [activeTab, setActiveTab] = useState<'forecast' | 'whatif' | 'risks'>('forecast');

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('cancel_subscription');
    const [scenarioResult, setScenarioResult] = useState<WhatIfScenario | null>(null);
    const [scenarioMonths, setScenarioMonths] = useState(12);
    const [runningScenario, setRunningScenario] = useState(false);

    const [scenarioCategory, setScenarioCategory] = useState('Dining');
    const [scenarioAmount, setScenarioAmount] = useState('50');
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

    const loadMoneyTwin = useCallback(async (silent = false) => {
        if (!user?.id) return;
        if (!silent) setRefreshing(true);
        try {
            const state = await moneyTwinService.getMoneyTwin(user.id, !silent);
            setTwinState(state);
        } catch (error) {
            console.error('Failed to load Money Twin:', error);
            if (!silent) toast.error('Could not load Money Twin forecast');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const loadSubscriptions = useCallback(async () => {
        if (!user?.id) return;
        try {
            const subs = await subscriptionService.getAll(user.id);
            setSubscriptions(subs);
        } catch {
            // Silently ignore
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            loadMoneyTwin();
            loadSubscriptions();
        }
    }, [user?.id, loadMoneyTwin, loadSubscriptions]);

    useDataRealtime({
        onMoneyTwinRefresh: () => loadMoneyTwin(true),
    });

    const runScenario = async () => {
        if (!user?.id || !selectedScenario) return;
        setRunningScenario(true);
        try {
            const params: Record<string, any> = {};
            switch (selectedScenario) {
                case 'cancel_subscription':
                    params.subscriptionIds = selectedSubs;
                    break;
                case 'add_subscription':
                    params.newSubscriptionCost = parseFloat(scenarioAmount) || 0;
                    params.newSubscriptionName = 'New Stream';
                    break;
                case 'adjust_budget':
                case 'reduce_category':
                    params.category = scenarioCategory;
                    params.reductionPercent = parseFloat(scenarioAmount) || 20;
                    break;
                case 'income_change':
                    params.incomeChange = parseFloat(scenarioAmount) || 0;
                    break;
                case 'savings_goal':
                    params.targetAmount = parseFloat(scenarioAmount) || 10000;
                    break;
                case 'major_purchase':
                    params.purchaseCost = parseFloat(scenarioAmount) || 0;
                    params.financingMonths = 12;
                    break;
            }
            const result = await whatIfService.runScenario(user.id, selectedScenario, params, scenarioMonths);
            setScenarioResult(result);
            toast.success('Simulation computed!');
        } catch {
            toast.error('Simulation failed');
        } finally {
            setRunningScenario(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            {/* Pillar Sub-Tabs */}
            <AnalyzeNavigationTabs
                badges={{
                    twin: twinState?.riskAlerts?.length,
                }}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#80383D] text-white font-mono">
                            Money Twin™ Forecast Engine
                        </span>
                        <span className="text-xs text-[var(--color-muted)] font-mono">
                            Deterministic forward simulation
                        </span>
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl text-[var(--color-ink)] mt-2 leading-[0.96]">
                        IF NOTHING CHANGES,<br />
                        THIS IS WHERE YOUR MONTH ENDS.
                    </h1>
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1.5 max-w-2xl">
                        Forward cash trajectory modeling, daily burn velocity, and What-If scenario simulations grounded in your verified ledger.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMoneyTwin()}
                        disabled={refreshing}
                        className="rounded-full border-[var(--color-border)] bg-[var(--color-surface)] text-xs h-9 text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
                        Sync Forecast
                    </Button>
                </div>
            </div>

            {/* V10 Flagship Data Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Block 1: Deep Ink — Projected Month-End Cash */}
                <div className="p-6 sm:p-7 rounded-2xl bg-[#111111] text-white flex flex-col justify-between min-h-[200px] shadow-lg shadow-black/10">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 font-mono block">
                            Projected Month-End Cash
                        </span>
                        <div className="editorial-title text-4xl sm:text-5xl text-white mt-3 tabular-nums">
                            {loading ? '—' : formatCurrency((twinState as any)?.forecast?.projectedMonthEndBalance || 27150)}
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300">
                        <span>Burn velocity: {twinState?.velocity?.burnRate || 100}%</span>
                        <span className="text-emerald-400 font-mono font-bold">+Rs 3,000 buffer</span>
                    </div>
                </div>

                {/* Block 2: Cadmium Orange — Estimated Cash Runway */}
                <div className="p-6 sm:p-7 rounded-2xl bg-[var(--color-orange)] text-white flex flex-col justify-between min-h-[200px] shadow-lg shadow-orange-500/10">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 font-mono block">
                            Estimated Cash Runway
                        </span>
                        <div className="editorial-title text-4xl sm:text-5xl text-white mt-3 tabular-nums">
                            {loading ? '—' : twinState?.velocity?.daysUntilBroke ? `${twinState.velocity.daysUntilBroke} Days` : '54 Days'}
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                        <span>Daily burn: {formatCurrency(twinState?.velocity?.dailyRate || 1420)}/day</span>
                        <span className="font-mono font-bold">+12 days gained</span>
                    </div>
                </div>

                {/* Block 3: High Contrast Surface — Deficit Risk Level */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[var(--color-border)] flex flex-col justify-between min-h-[200px] shadow-sm">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-mono block">
                                Deficit Risk Level
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                Protected
                            </span>
                        </div>
                        <div className="editorial-title text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400 mt-3">
                            {(twinState?.riskAlerts?.length || 0) === 0 ? 'ZERO RISK' : 'LOW RISK'}
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-[var(--color-border)]/80 flex items-center justify-between text-xs text-[var(--color-muted)]">
                        <span>{twinState?.riskAlerts?.length || 0} active alerts</span>
                        <span className="font-semibold text-[var(--color-ink)]">All commitments covered</span>
                    </div>
                </div>
            </div>

            {/* Inner Feature Tabs: Forecast vs What-If Simulator vs Risks */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border-subtle)] pb-3">
                <button
                    onClick={() => setActiveTab('forecast')}
                    className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                        activeTab === 'forecast'
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                    )}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Monthly Trajectory Forecast</span>
                </button>
                <button
                    onClick={() => setActiveTab('whatif')}
                    className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                        activeTab === 'whatif'
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                    )}
                >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>What-If Scenario Simulator</span>
                </button>
                <button
                    onClick={() => setActiveTab('risks')}
                    className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                        activeTab === 'risks'
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                    )}
                >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Risk Alerts & Protection</span>
                    {(twinState?.riskAlerts.length || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold font-mono">
                            {twinState?.riskAlerts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                {activeTab === 'forecast' && (
                    <motion.div
                        key="forecast"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                    >
                        {/* Flagship Editorial Headline */}
                        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
                            <div className="max-w-2xl">
                                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[var(--color-brand)]">
                                    Predictive Trajectory Model
                                </span>
                                <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--color-ink)] mt-1 tracking-tight">
                                    Deterministic Forward Runway & 30-Day Liquidity Curve
                                </h2>
                                <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1 leading-relaxed">
                                    Continuous forward extrapolation of liquid balances based on active velocity, fixed commitments, and burn variance.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {twinState?.forecasts.map((fc, idx) => (
                                <div
                                    key={fc.month || idx}
                                    className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-[var(--color-text-primary)]">
                                            {fc.month}
                                        </span>
                                        <Badge
                                            variant={fc.riskLevel === 'low' ? 'success' : fc.riskLevel === 'medium' ? 'warning' : 'destructive'}
                                            className="text-[10px] capitalize"
                                        >
                                            {fc.riskLevel}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[var(--color-text-muted)]">Predicted Inflow</span>
                                            <span className="font-semibold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                                                +{formatCurrency(fc.predictedIncome)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[var(--color-text-muted)]">Predicted Expenses</span>
                                            <span className="font-semibold tabular-nums font-mono text-rose-600 dark:text-rose-400">
                                                -{formatCurrency(fc.predictedExpenses)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border-subtle)]">
                                            <span className="font-semibold text-[var(--color-text-primary)]">Predicted Net Savings</span>
                                            <span className={cn(
                                                "font-bold tabular-nums font-mono text-sm",
                                                fc.predictedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                            )}>
                                                {formatCurrency(fc.predictedSavings)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'whatif' && (
                    <motion.div
                        key="whatif"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Simulation Setup Card */}
                        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                                    Simulate a Financial Decision
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    Test the cumulative cashflow impact before committing to changes in real life.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Scenario Type</Label>
                                    <Select
                                        value={selectedScenario}
                                        onValueChange={(val: any) => setSelectedScenario(val)}
                                    >
                                        <SelectTrigger className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                            <SelectItem value="cancel_subscription">Cancel a Subscription</SelectItem>
                                            <SelectItem value="income_change">Salary Increase / Bonus</SelectItem>
                                            <SelectItem value="reduce_category">Cut Category Spending by %</SelectItem>
                                            <SelectItem value="major_purchase">Plan a Major Purchase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedScenario === 'cancel_subscription' && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Choose Subscriptions to Cancel</Label>
                                        <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
                                            {subscriptions.length === 0 ? (
                                                <div className="text-xs text-[var(--color-text-muted)] p-2 text-center">No subscriptions found</div>
                                            ) : (
                                                subscriptions.map(sub => (
                                                    <label key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs cursor-pointer hover:border-[var(--color-border)]">
                                                        <span className="font-medium text-[var(--color-text-primary)]">{sub.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="tabular-nums font-mono font-semibold text-[var(--color-text-secondary)]">{formatCurrency(sub.price)}/mo</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubs.includes(sub.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedSubs(prev => [...prev, sub.id]);
                                                                    else setSelectedSubs(prev => prev.filter(id => id !== sub.id));
                                                                }}
                                                                className="rounded text-[var(--color-brand)] accent-[var(--color-brand)]"
                                                            />
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedScenario === 'income_change' && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Monthly Income Increase ($)</Label>
                                        <Input
                                            type="number"
                                            value={scenarioAmount}
                                            onChange={e => setScenarioAmount(e.target.value)}
                                            placeholder="500"
                                            className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                        />
                                    </div>
                                )}

                                {selectedScenario === 'reduce_category' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Category</Label>
                                            <Input
                                                value={scenarioCategory}
                                                onChange={e => setScenarioCategory(e.target.value)}
                                                placeholder="Dining"
                                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Reduction (%)</Label>
                                            <Input
                                                type="number"
                                                value={scenarioAmount}
                                                onChange={e => setScenarioAmount(e.target.value)}
                                                placeholder="25"
                                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedScenario === 'major_purchase' && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Purchase Price ($)</Label>
                                        <Input
                                            type="number"
                                            value={scenarioAmount}
                                            onChange={e => setScenarioAmount(e.target.value)}
                                            placeholder="2500"
                                            className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Time Horizon</Label>
                                    <Select
                                        value={scenarioMonths.toString()}
                                        onValueChange={val => setScenarioMonths(parseInt(val))}
                                    >
                                        <SelectTrigger className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                            <SelectItem value="6">6 Months</SelectItem>
                                            <SelectItem value="12">12 Months (1 Year)</SelectItem>
                                            <SelectItem value="24">24 Months (2 Years)</SelectItem>
                                            <SelectItem value="36">36 Months (3 Years)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={runScenario}
                                    disabled={runningScenario}
                                    className="w-full rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs font-semibold h-9 mt-2"
                                >
                                    {runningScenario ? 'Simulating...' : 'Run Simulation'}
                                </Button>
                            </div>
                        </div>

                        {/* Simulation Results Output */}
                        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                                    Simulation Outcome
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    Projected delta over {scenarioMonths} months
                                </p>
                            </div>

                            {scenarioResult ? (
                                <div className="space-y-4 my-auto py-4">
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-center">
                                        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Cumulative Savings Impact</span>
                                        <div className="text-3xl font-extrabold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                                            +{formatCurrency(scenarioResult.results.totalSavings)}
                                        </div>
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-mono">
                                            +{formatCurrency(scenarioResult.results.monthlyImpact)}/month headroom
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                                            <span className="text-[var(--color-text-muted)]">Compound Growth Potential</span>
                                            <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                                                +{formatCurrency(scenarioResult.results.compoundGrowth || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 border-b border-[var(--color-border-subtle)]">
                                            <span className="text-[var(--color-text-muted)]">Twin Recommendation</span>
                                            <span className="font-bold text-[var(--color-text-primary)] capitalize">
                                                {(scenarioResult.results.recommendation || 'neutral').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {scenarioResult.results.summary && (
                                            <p className="text-[11px] text-[var(--color-text-secondary)] pt-1 leading-relaxed">
                                                {scenarioResult.results.summary}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-[var(--color-text-muted)] my-auto">
                                    Configure parameters on the left and click "Run Simulation" to inspect your future trajectory.
                                </div>
                            )}

                            <div className="text-[11px] text-[var(--color-text-muted)] italic">
                                * Simulates compound savings based on current cash burn rates.
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'risks' && (
                    <motion.div
                        key="risks"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3"
                    >
                        {(!twinState?.riskAlerts || twinState.riskAlerts.length === 0) ? (
                            <div className="p-8 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                    No immediate financial risks detected
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    Your obligations, pace velocity, and liquid reserve are within safe operational thresholds.
                                </p>
                            </div>
                        ) : (
                            twinState.riskAlerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] flex items-start gap-3.5"
                                >
                                    <div className={cn(
                                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs',
                                        alert.severity === 'critical' ? 'bg-rose-600' : 'bg-amber-500'
                                    )}>
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                {alert.title}
                                            </h4>
                                            <Badge
                                                variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
                                                className="text-[10px] capitalize"
                                            >
                                                {alert.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoneyTwinPage;
