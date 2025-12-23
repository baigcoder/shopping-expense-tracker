// InsightsPage - Cashly AI Financial Insights (Enhanced)
// Uses smart local analytics with AI fallback
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Brain, Lightbulb, TrendingUp, AlertTriangle, Sparkles, Target,
    ArrowRight, Zap, RefreshCw, PieChart, Scissors, Coffee,
    UtensilsCrossed, CreditCard, PiggyBank, Trophy, Calendar,
    ChevronRight, Plus, Shield, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useStore';
import { generateSmartInsights, SmartInsight, InsightsStats, CategorySpending, getLocalFallbackTip } from '../services/smartInsightsService';
import { getCachedAiTip, fetchAiTipInBackground } from '../services/aiTipCacheService';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const InsightsPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insights, setInsights] = useState<SmartInsight[]>([]);
    const [stats, setStats] = useState<InsightsStats>({ potentialSavings: 0, activeTips: 0, alerts: 0, healthScore: 50 });
    const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
    const [aiTip, setAiTip] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Icon mapping
    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            AlertTriangle, TrendingUp, Target, Scissors, Coffee,
            UtensilsCrossed, CreditCard, PiggyBank, Trophy, Calendar,
            Lightbulb, Plus, Shield
        };
        return icons[iconName] || Lightbulb;
    };

    // Color mapping
    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
            emerald: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-500/5' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-500/5' },
            violet: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-500/5' },
            pink: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', gradient: 'from-rose-500/5' },
            red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', gradient: 'from-red-500/5' },
            blue: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', gradient: 'from-slate-500/5' },
        };
        return colors[color] || colors.emerald;
    };


    // Fetch insights
    const fetchInsights = async (showRefresh = false) => {
        if (!user?.id) return;

        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await generateSmartInsights(user.id);
            setInsights(result.insights);
            setStats(result.stats);
            setCategorySpending(result.categorySpending);

            // Get cached AI tip or fallback
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
    };

    // Try fetch AI tip
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
            console.log('AI tip fetch failed, using local fallback');
        }
        setAiLoading(false);
    };

    useEffect(() => {
        fetchInsights();

        // Listen for AI tip ready event
        const handleAiTipReady = (e: CustomEvent) => {
            setAiTip(e.detail.tip);
        };

        // Listen for data changes (transactions/budgets/subscriptions)
        const handleDataChanged = () => {
            console.log('📢 Data changed, refreshing insights...');
            fetchInsights(true);
        };

        window.addEventListener('ai-tip-ready', handleAiTipReady as EventListener);
        window.addEventListener('insights-data-changed', handleDataChanged);
        window.addEventListener('transaction-added', handleDataChanged);
        window.addEventListener('transaction-updated', handleDataChanged);
        window.addEventListener('transaction-deleted', handleDataChanged);
        window.addEventListener('budget-changed', handleDataChanged);
        window.addEventListener('subscription-changed', handleDataChanged);

        return () => {
            window.removeEventListener('ai-tip-ready', handleAiTipReady as EventListener);
            window.removeEventListener('insights-data-changed', handleDataChanged);
            window.removeEventListener('transaction-added', handleDataChanged);
            window.removeEventListener('transaction-updated', handleDataChanged);
            window.removeEventListener('transaction-deleted', handleDataChanged);
            window.removeEventListener('budget-changed', handleDataChanged);
            window.removeEventListener('subscription-changed', handleDataChanged);
        };
    }, [user?.id]);

    // Health score color
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-blue-600';
        if (score >= 60) return 'text-indigo-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };


    const getHealthBg = (score: number) => {
        if (score >= 80) return 'bg-blue-500';
        if (score >= 60) return 'bg-indigo-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain className="h-12 w-12 text-emerald-500" />
                    </motion.div>
                    <p className="text-muted-foreground">Analyzing your finances...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        Smart Insights
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        Personalized analysis based on your actual spending data
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchInsights(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Health Score */}
                <Card className="card-hover border-slate-200/60 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500 font-medium">Health Score</span>
                            <Activity className="h-4 w-4 text-primary" />
                        </div>

                        <div className={cn("text-3xl font-bold font-display", getHealthColor(stats.healthScore))}>
                            {stats.healthScore}/100
                        </div>
                        <Progress
                            value={stats.healthScore}
                            className="h-2 mt-2"
                        />
                    </CardContent>
                </Card>

                {/* Potential Savings */}
                <Card className="card-hover border-slate-200/60 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500 font-medium">Potential Savings</span>
                            <PiggyBank className="h-4 w-4 text-blue-600" />
                        </div>

                        <div className="text-3xl font-bold font-display text-blue-600">
                            {formatCurrency(stats.potentialSavings)}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">per month</p>
                    </CardContent>
                </Card>

                {/* Active Tips */}
                <Card className="card-hover border-slate-200/60 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500 font-medium">Active Tips</span>
                            <Lightbulb className="h-4 w-4 text-indigo-600" />
                        </div>

                        <div className="text-3xl font-bold font-display text-indigo-600">
                            {stats.activeTips}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">recommendations</p>
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className={cn(
                    "card-hover border-slate-200/60 shadow-sm overflow-hidden",
                    stats.alerts > 0
                        ? "bg-red-50/50"
                        : "bg-white"
                )}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500 font-medium">Alerts</span>
                            {stats.alerts > 0
                                ? <AlertTriangle className="h-4 w-4 text-red-600" />
                                : <Shield className="h-4 w-4 text-blue-600" />
                            }
                        </div>

                        <div className={cn(
                            "text-3xl font-bold font-display",
                            stats.alerts > 0 ? "text-red-600" : "text-blue-600"
                        )}>
                            {stats.alerts > 0 ? stats.alerts : 'None'}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.alerts > 0 ? 'need attention' : 'all clear!'}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* AI Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="card-hover bg-primary/5 border-primary/20">
                    <CardContent className="flex items-start gap-4 py-5">
                        <div className="p-3 rounded-xl bg-primary flex-shrink-0">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">SpendSync AI Analysis</h3>

                                {aiLoading && (
                                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {aiTip || 'Analyzing your spending patterns...'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={tryFetchAiTip}
                            disabled={aiLoading}
                            className="flex-shrink-0"
                        >
                            <Zap className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-emerald-500" />
                            Your Insights
                        </h2>
                        <Badge variant="secondary">{insights.length} insights</Badge>
                    </div>

                    <AnimatePresence>
                        <motion.div
                            className="space-y-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {insights.length === 0 ? (
                                <Card className="card-hover">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg">
                                            <Target className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-2">No Insights Yet</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                                            Add more transactions to unlock personalized insights and savings recommendations
                                        </p>
                                        <Button
                                            className="mt-4 gradient-primary text-white"
                                            onClick={() => navigate('/transactions')}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Transactions
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                insights.map((insight, i) => {
                                    const Icon = getIcon(insight.icon);
                                    const colors = getColorClasses(insight.color);
                                    return (
                                        <motion.div key={insight.id} variants={itemVariants}>
                                            <Card className={cn(
                                                "card-hover bg-gradient-to-br via-transparent to-transparent",
                                                colors.gradient,
                                                colors.border
                                            )}>
                                                <CardContent className="flex items-start gap-4 py-4">
                                                    <div className={cn("p-3 rounded-xl flex-shrink-0", colors.bg)}>
                                                        <Icon className={cn("h-5 w-5", colors.text)} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold truncate">{insight.title}</h3>
                                                            {insight.severity === 'high' && (
                                                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {insight.message}
                                                        </p>
                                                        {insight.value !== undefined && insight.value > 0 && (
                                                            <p className={cn("text-sm font-semibold mt-1", colors.text)}>
                                                                {formatCurrency(insight.value)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {insight.action && insight.actionPath && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(insight.actionPath!)}
                                                            className="flex-shrink-0"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Category Breakdown Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-violet-500" />
                        Category Breakdown
                    </h2>

                    <Card className="card-hover">
                        <CardContent className="pt-6 space-y-4">
                            {categorySpending.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No spending data this month
                                </p>
                            ) : (
                                categorySpending.slice(0, 5).map((cat, i) => (
                                    <div key={cat.category} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium truncate">{cat.category}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">{cat.percentage}%</span>
                                                {cat.trend === 'up' && (
                                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                                )}
                                                {cat.trend === 'down' && (
                                                    <TrendingUp className="h-3 w-3 text-emerald-500 rotate-180" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    i === 0 ? "bg-primary" :
                                                        i === 1 ? "bg-indigo-500" :
                                                            i === 2 ? "bg-slate-400" :
                                                                i === 3 ? "bg-blue-400" :
                                                                    "bg-amber-400"
                                                )}

                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.percentage}%` }}
                                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(cat.amount)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/budgets')}
                            >
                                <Target className="mr-2 h-4 w-4 text-emerald-600" />
                                Set a Budget
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/goals')}
                            >
                                <PiggyBank className="mr-2 h-4 w-4 text-violet-600" />
                                Create a Goal
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/subscriptions')}
                            >
                                <CreditCard className="mr-2 h-4 w-4 text-amber-600" />
                                Review Subscriptions
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InsightsPage;
