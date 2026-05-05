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
import { featureExpansionApi } from '../services/featureExpansionApi';

const DEFAULT_INSIGHTS_STATS: InsightsStats = { potentialSavings: 0, activeTips: 0, alerts: 0, healthScore: 50 };

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

    // Icon mapping
    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            AlertTriangle, TrendingUp, Target, Scissors, Coffee,
            UtensilsCrossed, CreditCard, PiggyBank, Trophy, Calendar,
            Lightbulb, Plus, Shield
        };
        return icons[iconName] || Lightbulb;
    };

    // Fetch insights
    const fetchInsights = useCallback(async (showRefresh = false) => {
        if (!user?.id) {
            setInsights([]);
            setCategorySpending([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (showRefresh) setRefreshing(true);

        try {
            const result = await Promise.race([
                generateSmartInsights(user.id),
                new Promise<{
                    insights: SmartInsight[];
                    stats: InsightsStats;
                    categorySpending: CategorySpending[];
                }>((resolve) => {
                    setTimeout(() => resolve({
                        insights: [{
                            id: 'loading-fallback',
                            type: 'tip',
                            severity: 'low',
                            title: 'Keep Tracking',
                            message: 'Your local insights are taking a moment. Keep tracking transactions and Cashly will keep your tips fresh.',
                            action: 'View Transactions',
                            actionPath: '/transactions',
                            icon: 'Lightbulb',
                            color: 'emerald'
                        }],
                        stats: DEFAULT_INSIGHTS_STATS,
                        categorySpending: []
                    }), 1200);
                })
            ]);
            setInsights(result.insights);
            setStats(result.stats);
            setCategorySpending(result.categorySpending);

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
                                <span className={styles.liveBadge}>
                                    <Sparkles size={12} className="animate-pulse" />
                                    AI-POWERED
                                </span>
                            </h1>
                            <p className="text-slate-500 mt-1 font-bold">
                                AI tips based on how you spend
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
                    <section className="bg-white border-4 border-black p-6 mb-6 shadow-[8px_8px_0px_#000000]">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="font-black text-black uppercase tracking-widest text-xl">AI Financial Coach Plan</h2>
                                <p className="text-sm text-black font-bold mt-1">Three actions for this week, tracked against current spending, goals, and subscriptions.</p>
                            </div>
                            <Badge className="bg-black text-white border-2 border-white rounded-none font-black uppercase text-xs px-3 py-1 shadow-[4px_4px_0px_#E11D48]">Weekly</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {coachPlan.actions.map((action: any) => (
                                <button
                                    key={action.id}
                                    onClick={async () => {
                                        await featureExpansionApi.updateCoachAction(action.id, action.status === 'done' ? 'pending' : 'done');
                                        setCoachPlan(await featureExpansionApi.currentCoach());
                                    }}
                                    className="text-left p-5 border-4 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#E11D48] group"
                                >
                                    <div className="text-[10px] font-black uppercase text-[#E11D48] mb-3 tracking-widest">{action.action_type}</div>
                                    <div className="font-black text-lg mb-2">{action.title}</div>
                                    <p className="text-sm font-bold opacity-80 mt-2">{action.description}</p>
                                    <div className="mt-4 pt-4 border-t-4 border-black group-hover:border-white text-xs font-black uppercase flex justify-between items-center">
                                        <span>{action.status === 'done' ? 'Done' : 'Mark done'}</span>
                                        {action.status === 'done' && <Check size={16} className="text-[#E11D48]" />}
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
                            style={{ background: '#000000', color: '#E11D48', border: '2px solid #E11D48' }}
                        >
                            <Activity size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: stats.healthScore >= 70 ? '#000000' : '#E11D48' }}>
                            {stats.healthScore}<span className="text-xl opacity-50">/100</span>
                        </h3>
                        <p className={styles.statLabel}>Money Health</p>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{
                                    width: `${stats.healthScore}%`,
                                    background: `linear-gradient(90deg, #E11D48, #000000)`
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
                            style={{ background: '#f0fdf4', color: '#10b981' }}
                        >
                            <PiggyBank size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: '#10b981' }}>
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
                            style={{ background: '#eff6ff', color: '#2563eb' }}
                        >
                            <Lightbulb size={24} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: '#2563eb' }}>
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
                                <div className="p-2 border-4 border-black bg-black text-[#E11D48] shadow-[4px_4px_0px_#E11D48]">
                                    <Target size={22} strokeWidth={3} />
                                </div>
                                Things To Do
                            </h2>
                            <Badge variant="outline" className="h-8 px-4 border-4 border-black bg-white text-black font-black text-[10px] uppercase rounded-none shadow-[4px_4px_0px_#E11D48]">
                                {insights.length} TIPS
                            </Badge>
                        </div>

                        <div className={styles.insightsList}>
                            <AnimatePresence mode="popLayout">
                                {insights.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20 bg-white border-4 border-black border-dashed"
                                    >
                                        <div className="mx-auto w-20 h-20 bg-black border-4 border-black flex items-center justify-center text-white mb-6 shadow-[6px_6px_0px_#E11D48]">
                                            <Trophy size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-black uppercase tracking-widest">You're Doing Great!</h3>
                                        <p className="text-black font-bold max-w-xs mx-auto mt-2 opacity-80 uppercase tracking-widest text-[10px]">
                                            No problems found. Keep tracking your spending!
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
                                                            <span className="px-3 py-1 rounded-none bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest border-2 border-rose-600 shadow-[2px_2px_0px_#e11d48]">
                                                                Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={styles.insightText}>{insight.message}</p>
                                                    {insight.value !== undefined && insight.value > 0 && (
                                                        <div className="flex items-center gap-2 mt-3 p-2 px-3 bg-white border-2 border-black shadow-[4px_4px_0px_#10b981] w-fit">
                                                            <Zap size={14} className="text-[#10b981] fill-[#10b981]" />
                                                            <span className="text-[10px] font-black uppercase text-black tracking-widest">
                                                                You could save: {formatCurrency(insight.value)}
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
                            <div className="p-2.5 rounded-xl bg-zinc-900 text-rose-600 border border-rose-600">
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
                                                    background: `linear-gradient(90deg, #000000, #E11D48)`,
                                                    width: `${cat.percentage}%`
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.percentage}%` }}
                                                transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-black uppercase mt-2 text-right">
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
                                <div className={cn(styles.actionBtnIcon, "bg-emerald-50 text-emerald-600")}>
                                    <Target size={20} strokeWidth={2.5} />
                                </div>
                                Set a Budget
                            </motion.button>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className={styles.actionBtn}
                                onClick={() => navigate('/goals')}
                            >
                                <div className={cn(styles.actionBtnIcon, "bg-zinc-900 text-rose-600 border border-rose-600")}>
                                    <PiggyBank size={20} strokeWidth={2.5} />
                                </div>
                                Save for a Goal
                            </motion.button>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className={styles.actionBtn}
                                onClick={() => navigate('/subscriptions')}
                            >
                                <div className={cn(styles.actionBtnIcon, "bg-amber-50 text-amber-600")}>
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
