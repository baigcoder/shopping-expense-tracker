// InsightsPage - Cashly AI Financial Insights (Premium Redesign)
// Midnight Coral Theme - Light Mode
import { useState, useEffect, useCallback } from 'react';
import {
    Brain, Lightbulb, TrendingUp, AlertTriangle, Sparkles, Target,
    ArrowRight, Zap, RefreshCw, PieChart, Scissors, Coffee,
    UtensilsCrossed, CreditCard, PiggyBank, Trophy, Calendar,
    ChevronRight, Plus, Shield, Activity, Wallet, Star, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useStore';
import { generateSmartInsights, SmartInsight, InsightsStats, CategorySpending, getLocalFallbackTip } from '../services/smartInsightsService';
import { getCachedAiTip, fetchAiTipInBackground } from '../services/aiTipCacheService';
import { FINANCIAL_DATA_EVENTS } from '../services/financialDataEvents';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import styles from './InsightsPage.module.css';
import { InsightsSkeleton } from '../components/LoadingSkeleton';
import { getBackendInsights } from '../services/aiService';
import { featureExpansionApi } from '../services/featureExpansionApi';

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

const InsightsPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState<SmartInsight[]>([]);
    const [stats, setStats] = useState<InsightsStats>(DEFAULT_INSIGHTS_STATS);
    const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
    const [aiTip, setAiTip] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [coachPlan, setCoachPlan] = useState<any>(null);
    const [insightSource, setInsightSource] = useState<'local' | 'ai' | 'degraded'>('local');

    // Icon mapping
    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            AlertTriangle, TrendingUp, Target, Scissors, Coffee,
            UtensilsCrossed, CreditCard, PiggyBank, Trophy, Calendar,
            Lightbulb, Plus, Shield, Sparkles
        };
        return icons[iconName] || Lightbulb;
    };

    // Fetch insights
    const fetchInsights = useCallback(async (showRefresh = false) => {
        if (!user?.id) {
            setInsights([]);
            setCategorySpending([]);
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
            setCategorySpending(result.categorySpending);
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
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const tryFetchAiTip = async () => {
        if (!user?.id || categorySpending.length === 0) return;
        setAiLoading(true);
        try {
            const topCat = categorySpending[0];
            await fetchAiTipInBackground(user.id, {
                monthlyTotal: categorySpending.reduce((sum, c) => sum + c.amount, 0),
                topCategory: topCat.category,
                categoryAmount: topCat.amount
            });
        } catch (error) {
            console.log('AI tip fetch failed');
        }
        setAiLoading(false);
    };

    useEffect(() => {
        fetchInsights();
        featureExpansionApi.currentCoach()
            .then(plan => plan || featureExpansionApi.generateCoach())
            .then(setCoachPlan)
            .catch(() => setCoachPlan(null));
        const handleAiTipReady = (e: CustomEvent) => setAiTip(e.detail.tip);
        const handleDataChanged = () => fetchInsights(true);

        window.addEventListener('ai-tip-ready', handleAiTipReady as EventListener);
        window.addEventListener('insights-data-changed', handleDataChanged);
        FINANCIAL_DATA_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleDataChanged);
        });

        return () => {
            window.removeEventListener('ai-tip-ready', handleAiTipReady as EventListener);
            window.removeEventListener('insights-data-changed', handleDataChanged);
            FINANCIAL_DATA_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleDataChanged);
            });
        };
    }, [user?.id, fetchInsights]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    const iconAnim = {
        animate: {
            y: [0, -4, 0],
            scale: [1, 1.05, 1],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    };

    if (loading && insights.length === 0) {
        return (
            <div className={styles.mainContent}>
                <InsightsSkeleton />
            </div>
        );
    }


    return (
        <div className={styles.mainContent}>
            <div className={styles.contentArea}>
                {/* Glass Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerLeft}>
                        <motion.div
                            className={styles.titleIcon}
                            whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                            <Brain size={28} />
                        </motion.div>
                        <div>
                            <h1 className={styles.title}>
                                Smart Insights
                                <span className={cn(
                                    styles.liveBadge,
                                    insightSource === 'degraded' && styles.liveBadgeDegraded,
                                    insightSource === 'local' && styles.liveBadgeLocal
                                )}>
                                    <Sparkles size={12} className="animate-pulse" />
                                    {insightSource === 'ai' ? 'AI-powered' : insightSource === 'degraded' ? 'Local fallback' : 'Local insights'}
                                </span>
                            </h1>
                            <p className="text-slate-500 mt-1 font-bold">
                                {insightSource === 'ai'
                                    ? 'AI tips based on how you spend'
                                    : insightSource === 'degraded'
                                        ? 'Showing local tips because live AI is unavailable'
                                        : 'Tips from your ledger while live AI loads'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05, rotate: 15 }}
                            whileTap={{ scale: 0.95 }}
                            className={styles.refreshCircle}
                            onClick={() => fetchInsights(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw size={22} className={refreshing ? styles.spinning : ''} />
                        </motion.button>
                    </div>
                </motion.header>

                {coachPlan?.actions && (
                    <section className="mb-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)]">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">This week’s plan</h2>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">{coachPlan.plan?.summary || 'Three actions for this week, based on spending, goals, and subscriptions.'}</p>
                            </div>
                            <Badge className="rounded-full border-0 bg-[#F4F0EB] px-3 py-1 text-xs font-medium text-[#57534E]">Weekly</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {coachPlan.actions.map((action: any) => (
                                <button
                                    key={action.id}
                                    onClick={async () => {
                                        await featureExpansionApi.updateCoachAction(action.id, action.status === 'done' ? 'pending' : 'done');
                                        setCoachPlan(await featureExpansionApi.currentCoach());
                                    }}
                                    className="group rounded-[var(--r-lg)] border border-[var(--border)] bg-[#FAF8F5] p-5 text-left transition-colors hover:bg-white"
                                >
                                    <div className="mb-3 text-xs font-medium capitalize text-[var(--brand)]">{String(action.action_type || '').replace(/_/g, ' ')}</div>
                                    <div className="mb-2 text-lg font-semibold">{action.title}</div>
                                    <p className="mt-2 text-sm text-[var(--text-muted)]">{action.description}</p>
                                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs font-medium">
                                        <span>{action.status === 'done' ? 'Done' : 'Mark done'}</span>
                                        {action.status === 'done' && <Check size={16} className="text-[var(--brand)]" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Main Stats Row */}
                <motion.div
                    className={styles.statsRow}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Health Score */}
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <motion.div
                            {...iconAnim}
                            className={styles.statIconBox}
                            style={{ background: 'var(--brand-muted)', color: 'var(--brand)', border: 'none' }}
                        >
                            <Activity size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: stats.healthScore >= 70 ? 'var(--text-primary)' : 'var(--brand)' }}>
                            {stats.healthScore}<span className="text-xl opacity-50">/100</span>
                        </h3>
                        <p className={styles.statLabel}>Money Health</p>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{
                                    width: `${stats.healthScore}%`,
                                    background: 'var(--brand)'
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.healthScore}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                            />
                        </div>
                    </motion.div>

                    {/* Potential Savings */}
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <motion.div
                            {...iconAnim}
                            className={styles.statIconBox}
                            style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                        >
                            <PiggyBank size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: 'var(--success)' }}>
                            {formatCurrency(stats.potentialSavings)}
                        </h3>
                        <p className={styles.statLabel}>You Could Save</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-2">Every Month</p>
                    </motion.div>

                    {/* Active Tips */}
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <motion.div
                            {...iconAnim}
                            className={styles.statIconBox}
                            style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                        >
                            <Lightbulb size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: 'var(--text-primary)' }}>
                            {stats.activeTips}
                        </h3>
                        <p className={styles.statLabel}>Tips For You</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-2">Ways to Save</p>
                    </motion.div>

                    {/* Alerts */}
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <motion.div
                            {...iconAnim}
                            className={styles.statIconBox}
                            style={{
                                background: stats.alerts > 0 ? '#fff1f2' : '#f8fafc',
                                color: stats.alerts > 0 ? '#e11d48' : '#64748b'
                            }}
                        >
                            {stats.alerts > 0 ? <AlertTriangle size={24} /> : <Shield size={24} />}
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: stats.alerts > 0 ? '#e11d48' : '#0f172a' }}>
                            {stats.alerts > 0 ? stats.alerts : 'Stable'}
                        </h3>
                        <p className={styles.statLabel}>Warnings</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-2">
                            {stats.alerts > 0 ? 'Needs Attention' : 'All Good!'}
                        </p>
                    </motion.div>
                </motion.div>

                {/* AI Summary Card */}
                <motion.div
                    className={styles.aiSummaryCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className={styles.aiMagicCircle}>
                        <Sparkles size={32} />
                    </div>
                    <div className={styles.aiContent}>
                        <div className={styles.aiBadgeLabel}>
                            <Star size={14} className="fill-indigo-500 text-indigo-500" />
                            AI Money Advice
                        </div>
                        <p className={styles.aiMessage}>
                            {aiTip || 'Looking at your spending to give you tips...'}
                        </p>
                    </div>
                    <div className={styles.aiActions}>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            className={styles.refreshCircle}
                            onClick={tryFetchAiTip}
                            disabled={aiLoading}
                            style={{ border: '2px solid #E11D48', background: 'transparent' }}
                        >
                            <RefreshCw size={20} className={aiLoading ? styles.spinning : ''} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className={styles.mainGrid}>
                    {/* Insights List */}
                    <motion.div
                        className={styles.insightsListSection}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={styles.sectionTitle}>
                                <div className="rounded-[var(--r-md)] bg-[var(--brand-muted)] p-2 text-[var(--brand)]">
                                    <Target size={22} strokeWidth={2} />
                                </div>
                                Things to do
                            </h2>
                            <Badge variant="outline" className="h-8 rounded-full border-[#E7E5E4] bg-white px-4 text-xs font-medium text-[var(--text-muted)]">
                                {insights.length} tips
                            </Badge>
                        </div>

                        <div className={styles.insightsList}>
                            <AnimatePresence mode="popLayout">
                                {insights.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-[var(--r-lg)] border border-dashed border-[var(--border)] bg-white py-16 text-center"
                                    >
                                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--r-lg)] bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                                            <Trophy size={32} />
                                        </div>
                                        <h3 className="font-display text-xl font-semibold">You’re doing well</h3>
                                        <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--text-muted)]">
                                            No issues found. Keep tracking your spending.
                                        </p>
                                    </motion.div>
                                ) : (
                                    insights.map((insight) => {
                                        const Icon = getIcon(insight.icon);
                                        return (
                                            <motion.div
                                                layout
                                                key={insight.id}
                                                className={styles.insightGlassCard}
                                                variants={fadeInUp}
                                                onClick={() => insight.actionPath && navigate(insight.actionPath)}
                                            >
                                                <div
                                                    className={styles.insightIconBox}
                                                    style={{
                                                        background: insight.color === 'red' ? '#fff1f2' : '#f0fdf4',
                                                        color: insight.color === 'red' ? '#e11d48' : '#10b981'
                                                    }}
                                                >
                                                    <Icon size={24} />
                                                </div>
                                                <div className={styles.insightContent}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className={styles.insightTitle}>{insight.title}</h3>
                                                        {insight.severity === 'high' && (
                                                            <span className="rounded-full border border-[#E11D48]/30 bg-[#FFE4E6] px-3 py-1 text-[10px] font-medium text-[#E11D48]">
                                                                Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={styles.insightText}>{insight.message}</p>
                                                    {insight.value !== undefined && insight.value > 0 && (
                                                        <div className="mt-3 flex w-fit items-center gap-2 rounded-[var(--r-md)] border border-[var(--border)] bg-white px-3 py-2">
                                                            <Zap size={14} className="text-[var(--success)]" />
                                                            <span className="text-xs font-medium text-[var(--text-primary)]">
                                                                You could save {formatCurrency(insight.value)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.insightAction}>
                                                    <ChevronRight size={22} strokeWidth={3} />
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        className={styles.sidebar}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h2 className={cn(styles.sectionTitle, "mb-6")}>
                            <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5 text-[var(--brand)]">
                                <PieChart size={22} />
                            </div>
                            Spending Breakdown
                        </h2>

                        <motion.div variants={fadeInUp} className={styles.sidebarCard}>
                            {categorySpending.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 font-bold text-sm">No spending data yet</p>
                            ) : (
                                categorySpending.slice(0, 5).map((cat, i) => (
                                    <div key={cat.category} className={styles.categoryProgressBar}>
                                        <div className={styles.categoryInfo}>
                                            <span className="truncate">{cat.category}</span>
                                            <div className="flex items-center gap-3">
                                                <span className={styles.percentageBadge}>{cat.percentage}%</span>
                                                {cat.trend === 'up' && <TrendingUp size={16} className="text-rose-500" />}
                                                {cat.trend === 'down' && <TrendingUp size={16} className="text-emerald-500 rotate-180" />}
                                            </div>
                                        </div>
                                        <div className={styles.progressTrack}>
                                            <motion.div
                                                className={styles.progressThumb}
                                                style={{
                                                    background: 'var(--brand)',
                                                    width: `${cat.percentage}%`
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.percentage}%` }}
                                                transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                                            />
                                        </div>
                                        <p className="mt-2 text-right text-xs font-medium text-[var(--text-muted)]">
                                            {formatCurrency(cat.amount)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={fadeInUp} className={styles.sidebarCard}>
                            <h3 className="text-sm font-bold text-slate-600 mb-6">Quick Links</h3>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className={styles.actionBtn}
                                onClick={() => navigate('/budgets')}
                            >
                                <div className={cn(styles.actionBtnIcon, "bg-[var(--success-light)] text-[var(--success)]")}>
                                    <Target size={20} strokeWidth={2.5} />
                                </div>
                                Set a Budget
                            </motion.button>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className={styles.actionBtn}
                                onClick={() => navigate('/goals')}
                            >
                                <div className={cn(styles.actionBtnIcon, "bg-[var(--brand-muted)] text-[var(--brand)]")}>
                                    <PiggyBank size={20} strokeWidth={2.5} />
                                </div>
                                Save for a Goal
                            </motion.button>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className={styles.actionBtn}
                                onClick={() => navigate('/subscriptions')}
                            >
                                <div className={cn(styles.actionBtnIcon, "bg-[var(--warning-light)] text-[var(--warning)]")}>
                                    <CreditCard size={20} strokeWidth={2.5} />
                                </div>
                                Manage Subscriptions
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default InsightsPage;
