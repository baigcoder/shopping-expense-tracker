import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, Sparkles,
    RefreshCw, Check,
    Mic, ArrowUpRight,
    Brain, PiggyBank, Lightbulb, Trophy
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { generateSmartInsights, SmartInsight, InsightsStats, getLocalFallbackTip } from '../services/smartInsightsService';
import { getCachedAiTip } from '../services/aiTipCacheService';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBackendInsights, getAIResponse } from '../services/aiService';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { toast } from 'sonner';
import VoiceCallModal from '../components/VoiceCallModal';

const DEFAULT_INSIGHTS_STATS: InsightsStats = { potentialSavings: 0, activeTips: 0, alerts: 0, healthScore: 50 };

const mapBackendInsight = (insight: { type?: string; title?: string; message?: string }, index: number): SmartInsight => {
    const kind = insight.type === 'risk' || insight.type === 'warning' ? 'warning'
        : insight.type === 'forecast' ? 'trend'
        : 'tip';
    const high = kind === 'warning';
    return {
        id: `ai-${index}-${insight.title || 'insight'}`,
        type: kind,
        severity: high ? 'high' : 'medium',
        title: insight.title || 'Cashly AI',
        message: insight.message || '',
        action: high ? 'Review Inbox' : 'View Transactions',
        actionPath: high ? '/transaction-inbox' : '/transactions',
        icon: high ? 'AlertTriangle' : insight.type === 'forecast' ? 'TrendingUp' : 'Sparkles',
        color: high ? 'red' : 'emerald',
    };
};

const mergeInsights = (local: SmartInsight[], remote: SmartInsight[]) => {
    const seen = new Set(local.map((item) => item.title.toLowerCase()));
    const extras = remote.filter((item) => item.message && !seen.has(item.title.toLowerCase()));
    return [...local, ...extras].slice(0, 8);
};

export const InsightsPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState<SmartInsight[]>([]);
    const [stats, setStats] = useState<InsightsStats>(DEFAULT_INSIGHTS_STATS);
    const [aiTip, setAiTip] = useState<string | null>(null);
    const [coachPlan, setCoachPlan] = useState<any>(null);
    const [generatingCoach, setGeneratingCoach] = useState(false);
    const [insightSource, setInsightSource] = useState<'local' | 'ai' | 'degraded'>('local');

    // Voice assistant modal
    const [showVoiceCall, setShowVoiceCall] = useState(false);

    // Interactive in-page AI conversation
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; action?: { label: string; path: string } }>>([
        {
            role: 'assistant',
            text: 'Hello! I am your Cashly Co-Pilot. I monitor your transactions, spending velocities, and recurring bills.',
            action: { label: 'Review Inbox', path: '/transaction-inbox' }
        }
    ]);
    const [chatLoading, setChatLoading] = useState(false);

    // Fetch insights
    const fetchInsights = useCallback(async (showRefresh = false) => {
        if (!user?.id) {
            setInsights([]);
            setInsightSource('local');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await generateSmartInsights(user.id);
            setInsights(result.insights);
            setStats(result.stats);
            setInsightSource('local');

            void getBackendInsights(user.id).then((backend) => {
                const remote = (backend.insights || []).map(mapBackendInsight);
                const live = backend.status === 'ready' && !backend.fromFallback && !backend.aiUnavailable;
                if (live) setInsightSource('ai');
                else if (backend.fromFallback || backend.aiUnavailable || backend.status === 'degraded') setInsightSource('degraded');
                if (remote.length) {
                    setInsights((current) => mergeInsights(current, remote));
                    if (live && remote[0]?.message) setAiTip(remote[0].message);
                }
            }).catch(() => setInsightSource('degraded'));

            const cachedTip = getCachedAiTip();
            if (cachedTip) {
                setAiTip(cachedTip);
            } else {
                setAiTip(getLocalFallbackTip(result.stats));
            }

            // Load coach
            try {
                const plan = await featureExpansionApi.currentCoach();
                setCoachPlan(plan);
            } catch {
                // Ignore
            }
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchInsights(true);
        toast.success('AI Context synchronized');
    };

    const handleGenerateWeeklyCoach = async () => {
        setGeneratingCoach(true);
        try {
            const plan = await featureExpansionApi.generateCoach();
            setCoachPlan(plan);
            toast.success('Generated new weekly financial habit plan!');
        } catch {
            toast.error('Could not generate coach plan');
        } finally {
            setGeneratingCoach(false);
        }
    };

    const handleToggleCoachAction = async (actionId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'done' ? 'pending' : 'done';
        try {
            await featureExpansionApi.updateCoachAction(actionId, nextStatus as any);
            // Optimistic update
            setCoachPlan((prev: any) => {
                if (!prev || !prev.actions) return prev;
                return {
                    ...prev,
                    actions: prev.actions.map((act: any) =>
                        act.id === actionId ? { ...act, status: nextStatus } : act
                    )
                };
            });
            toast.success(nextStatus === 'done' ? 'Habit completed! 🎉' : 'Marked as pending');
        } catch {
            toast.error('Failed to update habit');
        }
    };

    // Chat submission
    const handleSendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !user?.id) return;

        const userText = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
        setChatLoading(true);

        try {
            const content = await getAIResponse(userText, user.id);

            // Infer structured deep-link action based on response text
            let action: { label: string; path: string } | undefined;
            const lower = content.toLowerCase();
            if (lower.includes('inbox') || lower.includes('review')) {
                action = { label: 'Review Candidates', path: '/transaction-inbox' };
            } else if (lower.includes('budget') || lower.includes('limit')) {
                action = { label: 'Manage Budgets', path: '/budgets' };
            } else if (lower.includes('subscription') || lower.includes('recurring')) {
                action = { label: 'Inspect Commitments', path: '/subscriptions' };
            } else if (lower.includes('goal')) {
                action = { label: 'View Savings Goals', path: '/goals' };
            } else if (lower.includes('transaction') || lower.includes('spent')) {
                action = { label: 'View Transactions', path: '/transactions' };
            }

            setChatMessages(prev => [...prev, { role: 'assistant', text: content, action }]);
        } catch {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                text: "I couldn't reach the model right now, but your local financial telemetry is active and healthy."
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Assist & AI Financial Operator
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Contextual Intelligence
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Deterministic spending telemetry paired with grounded conversational modeling. No generic chatbot fluff.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVoiceCall(true)}
                        className="rounded-full border-[var(--color-ink)] bg-white text-xs h-10 px-5 font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-all shadow-xs"
                    >
                        <Mic className="h-4 w-4 mr-2 text-[#EE5024]" />
                        Voice Operator
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-4 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', refreshing && 'animate-spin')} />
                        Sync Telemetry
                    </Button>
                </div>
            </div>

            {/* Live Observation Banner */}
            {aiTip && (
                <div className="p-6 rounded-[24px] bg-[#111111] text-white border border-[#222222] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#EE5024] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-[11px] text-[#EE5024] uppercase tracking-wider font-mono">Live Spending Telemetry</span>
                                <Badge variant="outline" className="text-[9px] border-white/20 text-white/80 font-mono">
                                    Active Observation
                                </Badge>
                            </div>
                            <p className="text-base text-white font-medium mt-1 leading-snug">{aiTip}</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => navigate('/transaction-inbox')}
                        className="rounded-full bg-white text-[#111111] hover:bg-[#EE5024] hover:text-white font-bold text-xs h-9 px-4 shrink-0 transition-colors"
                    >
                        Review Inbox
                        <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
            )}

            {/* V10 Color-Blocked KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cadmium Orange: Health Pulse */}
                <div className="p-6 rounded-[24px] bg-[#EE5024] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
                        <span>Health Pulse</span>
                        <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : `${stats.healthScore}/100`}
                        </div>
                        <div className="text-xs font-semibold text-white/90 mt-2">
                            {stats.healthScore >= 70 ? 'Optimal liquidity buffer' : 'Accelerated burn rate detected'}
                        </div>
                    </div>
                </div>

                {/* 2. Deep Ink: Potential Savings */}
                <div className="p-6 rounded-[24px] bg-[#111111] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                        <span>Identified Savings</span>
                        <PiggyBank className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(stats.potentialSavings)}
                        </div>
                        <div className="text-xs text-white/70 mt-2">
                            Optimizable subscriptions & discretionary waste
                        </div>
                    </div>
                </div>

                {/* 3. Warm Ivory / White: Active Context Vectors */}
                <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/60">
                        <span>Active Insights</span>
                        <Lightbulb className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : insights.length}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            {insights.filter(i => i.severity === 'high').length} high-severity remediation targets
                        </div>
                    </div>
                </div>

                {/* 4. Muted Sage / Soft Accent: Habits Progress */}
                <div className="p-6 rounded-[24px] bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/70">
                        <span>Weekly Habits</span>
                        <Trophy className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {coachPlan?.actions ? (
                                `${coachPlan.actions.filter((a: any) => a.status === 'done').length}/${coachPlan.actions.length}`
                            ) : '0/3'}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Behavioral routines completed
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout: Left = Weekly Coach + Action Cards, Right = Embedded Co-Pilot Conversation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2-Col Left Panel: Coach Plan & Context Insights */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Weekly Coach Plan Card */}
                    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-[var(--color-ai)]" />
                                    Weekly Financial Coach
                                </h2>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    3 concrete behavioral tasks generated from your active spending patterns
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateWeeklyCoach}
                                disabled={generatingCoach}
                                className="rounded-xl border-[var(--color-border)] text-xs h-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            >
                                <RefreshCw className={cn('h-3 w-3 mr-1', generatingCoach && 'animate-spin')} />
                                Refresh Plan
                            </Button>
                        </div>

                        {(!coachPlan || !coachPlan.actions || coachPlan.actions.length === 0) ? (
                            <div className="p-6 text-center rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] space-y-2">
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    No weekly coach plan generated yet.
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleGenerateWeeklyCoach}
                                    disabled={generatingCoach}
                                    className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs h-8"
                                >
                                    Generate This Week's Habits
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {coachPlan.actions.map((action: any) => {
                                    const isDone = action.status === 'done';
                                    return (
                                        <div
                                            key={action.id}
                                            onClick={() => handleToggleCoachAction(action.id, action.status)}
                                            className={cn(
                                                'p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none',
                                                isDone
                                                    ? 'bg-[var(--color-positive-subtle)] border-[var(--color-positive)]/30'
                                                    : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    'h-5 w-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                                                    isDone
                                                        ? 'bg-[var(--color-positive)] border-[var(--color-positive)] text-white'
                                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)]'
                                                )}
                                            >
                                                {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                            </button>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        'text-xs font-semibold',
                                                        isDone ? 'line-through text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'
                                                    )}>
                                                        {action.title}
                                                    </span>
                                                    {action.impact && (
                                                        <span className="text-[10px] font-bold font-mono text-[var(--color-positive)] bg-[var(--color-positive-subtle)] px-1.5 py-0.5 rounded border border-[var(--color-positive)]/20">
                                                            {action.impact}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    'text-[11px] mt-0.5 leading-relaxed',
                                                    isDone ? 'text-[var(--color-positive)]/80' : 'text-[var(--color-text-secondary)]'
                                                )}>
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Grounded Insight Action Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                                High-Confidence Ledger Insights
                            </h2>
                            <span className="text-xs text-[var(--color-text-muted)] font-mono">
                                {insights.length} recommendations
                            </span>
                        </div>

                        <div className="space-y-3">
                            {insights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs hover:border-[var(--color-border)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs',
                                            insight.severity === 'high' 
                                                ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)]/20' 
                                                : 'bg-[var(--color-ai-subtle)] text-[var(--color-ai)] border border-[var(--color-ai)]/20'
                                        )}>
                                            {insight.severity === 'high' ? (
                                                <AlertTriangle className="h-4 w-4" />
                                            ) : (
                                                <Sparkles className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                                                    {insight.title}
                                                </span>
                                                <Badge
                                                    variant={insight.severity === 'high' ? 'destructive' : 'secondary'}
                                                    className="text-[9px] uppercase tracking-wider font-mono"
                                                >
                                                    {insight.type}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl">
                                                {insight.message}
                                            </p>
                                        </div>
                                    </div>

                                    {insight.actionPath && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(insight.actionPath!)}
                                            className="rounded-xl border-[var(--color-border)] text-xs h-8 shrink-0 font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
                                        >
                                            <span>{insight.action || 'Execute Action'}</span>
                                            <ArrowUpRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 1-Col Right Panel: Live Co-Pilot Conversation */}
                <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs p-5 flex flex-col h-[640px]">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-[var(--color-ai-subtle)] text-[var(--color-ai)] flex items-center justify-center font-bold">
                                <Brain className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Co-Pilot Operator</h3>
                                <p className="text-[10px] text-[var(--color-text-muted)]">Grounded in your financial ledger</p>
                            </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-[var(--color-positive)] animate-pulse" />
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                        {chatMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex flex-col',
                                    msg.role === 'user' ? 'items-end' : 'items-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'p-3 rounded-xl max-w-[88%] leading-relaxed text-xs',
                                        msg.role === 'user'
                                            ? 'bg-[var(--color-brand)] text-white'
                                            : 'bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]'
                                    )}
                                >
                                    {msg.text}
                                </div>

                                {msg.action && (
                                    <button
                                        onClick={() => navigate(msg.action!.path)}
                                        className="mt-1.5 px-3 py-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[11px] font-semibold flex items-center gap-1 shadow-2xs hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
                                    >
                                        <span>[{msg.action.label}]</span>
                                        <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {chatLoading && (
                            <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs py-1">
                                <Sparkles className="h-3.5 w-3.5 animate-spin text-[var(--color-ai)]" />
                                <span>Analyzing ledger...</span>
                            </div>
                        )}
                    </div>

                    {/* Chat Form */}
                    <form onSubmit={handleSendChatMessage} className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Ask about spending, budgets, or bills..."
                            className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-ai)]"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!chatInput.trim() || chatLoading}
                            className="rounded-xl bg-[var(--color-ai)] hover:bg-[var(--color-ai)]/90 text-white text-xs h-8 px-3 shadow-xs"
                        >
                            Send
                        </Button>
                    </form>
                </div>
            </div>

            {/* Voice Assistant Modal */}
            <VoiceCallModal
                isOpen={showVoiceCall}
                onClose={() => setShowVoiceCall(false)}
                voiceName="jenny"
                userId={user?.id || ''}
                userName={user?.name?.split(' ')[0] || 'there'}
            />
        </div>
    );
};

export default InsightsPage;
