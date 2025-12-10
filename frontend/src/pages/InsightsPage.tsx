// Insights Page - Ultimate AI-powered spending analysis
// Real, accurate, and dynamic analytics for users
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Zap, Brain, RefreshCw,
    Sparkles, Target, PiggyBank, Loader2, MessageCircle, Calendar, BarChart3,
    Shield, Activity, Clock, Store, Repeat, AlertCircle, CheckCircle, XCircle,
    ChevronRight, Award, Gauge, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { getAIResponse, analyzeSpending, optimizeBudget, predictSpending, getProviderStatus } from '../services/aiService';
import { formatCurrency } from '../services/currencyService';
import { supabase } from '../config/supabase';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import genZToast from '../services/genZToast';
import {
    calculateHealthScore,
    detectAnomalies,
    calculateCategoryTrends,
    calculateSpendingVelocity,
    analyzeDayOfWeek,
    analyzeMerchants,
    detectRecurringTransactions,
    compareBudgetVsActual,
    type HealthScore,
    type Anomaly,
    type CategoryTrend,
    type SpendingVelocity,
    type DayOfWeekAnalysis,
    type MerchantAnalysis,
    type RecurringTransaction,
    type BudgetComparison
} from '../services/insightsService';
import styles from './InsightsPage.module.css';

interface Transaction {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    merchant?: string;
}

const InsightsPage = () => {
    // Core state
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'anomalies' | 'trends' | 'patterns' | 'ai'>('overview');
    const [aiProvider, setAiProvider] = useState<string>('');

    // Data state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);

    // Computed insights
    const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
    const [velocity, setVelocity] = useState<SpendingVelocity | null>(null);
    const [dayAnalysis, setDayAnalysis] = useState<DayOfWeekAnalysis[]>([]);
    const [merchantStats, setMerchantStats] = useState<MerchantAnalysis[]>([]);
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    const [budgetComparison, setBudgetComparison] = useState<BudgetComparison[]>([]);

    // AI Analysis
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [budgetSuggestions, setBudgetSuggestions] = useState<any>(null);

    // Calculate all insights
    const calculateAllInsights = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setIsLoading(false);
                return;
            }

            // Fetch all data in parallel
            const [txData, budgetData, goalData] = await Promise.all([
                supabaseTransactionService.getAll(session.user.id),
                budgetService.getAll(session.user.id).catch(() => []),
                goalService.getAll(session.user.id).catch(() => [])
            ]);

            const typedTx: Transaction[] = txData.map((t: any) => ({
                ...t,
                type: t.type as 'income' | 'expense'
            }));

            setTransactions(typedTx);
            setBudgets(budgetData);
            setGoals(goalData);

            // Map goals to expected format
            const mappedGoals = goalData.map((g: any) => ({
                id: g.id,
                name: g.name,
                target: g.target || g.target_amount || 0,
                saved: g.saved || g.current_amount || 0,
                deadline: g.deadline
            }));

            // Calculate all insights
            const health = calculateHealthScore(typedTx, budgetData, mappedGoals);
            const anomalyList = detectAnomalies(typedTx);
            const trends = calculateCategoryTrends(typedTx);
            const totalBudget = budgetData.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
            const vel = calculateSpendingVelocity(typedTx, totalBudget || undefined);
            const dayStats = analyzeDayOfWeek(typedTx);
            const merchants = analyzeMerchants(typedTx);
            const recurringTx = detectRecurringTransactions(typedTx);
            const budgetVsActual = compareBudgetVsActual(typedTx, budgetData);

            setHealthScore(health);
            setAnomalies(anomalyList);
            setCategoryTrends(trends);
            setVelocity(vel);
            setDayAnalysis(dayStats);
            setMerchantStats(merchants);
            setRecurring(recurringTx);
            setBudgetComparison(budgetVsActual);

            // Get AI analysis
            const [analysis, predict, budget] = await Promise.all([
                analyzeSpending(typedTx),
                predictSpending(typedTx),
                optimizeBudget(
                    typedTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 5000,
                    trends.map(t => ({ category: t.category, amount: t.currentMonth }))
                )
            ]);

            setAiAnalysis(analysis);
            setPrediction(predict);
            setBudgetSuggestions(budget);
            setAiProvider(getProviderStatus());

            // Debug logging - shows REAL data being used
            console.log('📊 INSIGHTS DEBUG - REAL DATA:', {
                totalTransactions: typedTx.length,
                totalBudgets: budgetData.length,
                totalGoals: goalData.length,
                sampleTransactions: typedTx.slice(0, 3),
                healthScore: health,
                anomaliesFound: anomalyList.length,
                categoryTrendsCount: trends.length,
                recurringDetected: recurringTx.length
            });

            genZToast.success(`Insights refreshed! Analyzed ${typedTx.length} transactions 🧠✨`);
        } catch (error) {
            console.error('Failed to calculate insights:', error);
            genZToast.error('Failed to load insights');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        calculateAllInsights();
    }, []);

    // Derived stats
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
        const expenses = currentMonthTxs.filter(t => t.type === 'expense');
        const income = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const spent = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

        return {
            totalTransactions: transactions.length,
            monthlySpent: spent,
            monthlyIncome: income,
            transactionsThisMonth: currentMonthTxs.length
        };
    }, [transactions]);

    // Grade color
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A+': case 'A': return '#10B981';
            case 'B': return '#3B82F6';
            case 'C': return '#F59E0B';
            case 'D': return '#EF4444';
            case 'F': return '#DC2626';
            default: return '#6B7280';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return '#DC2626';
            case 'medium': return '#F59E0B';
            case 'low': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'under': return '#10B981';
            case 'on_track': return '#3B82F6';
            case 'over': return '#F59E0B';
            case 'critical': return '#DC2626';
            default: return '#6B7280';
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerLeft}>
                    <h1>
                        Insights 🧠
                        <span className={styles.aiBadge}>
                            <Brain size={12} /> {aiProvider ? `via ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}` : 'AI Powered'}
                        </span>
                    </h1>
                    <p>Real-time financial intelligence for smarter decisions</p>
                </div>
                <motion.button
                    className={styles.refreshBtn}
                    onClick={calculateAllInsights}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isLoading ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
                    {isLoading ? 'Analyzing...' : 'Refresh'}
                </motion.button>
            </motion.div>

            {/* Quick Stats Bar */}
            <motion.div
                className={styles.quickStats}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Live Data Indicator */}
                <div className={styles.quickStat} style={{ background: '#D1FAE5', borderColor: '#10B981' }}>
                    <Activity size={20} style={{ color: '#10B981' }} />
                    <div>
                        <span className={styles.quickStatValue} style={{ color: '#059669' }}>
                            {transactions.length}
                        </span>
                        <span className={styles.quickStatLabel}>Real Transactions</span>
                    </div>
                </div>
                {healthScore && (
                    <div className={styles.quickStat} style={{ borderColor: getGradeColor(healthScore.grade) }}>
                        <Award size={20} style={{ color: getGradeColor(healthScore.grade) }} />
                        <div>
                            <span className={styles.quickStatValue} style={{ color: getGradeColor(healthScore.grade) }}>
                                {healthScore.grade}
                            </span>
                            <span className={styles.quickStatLabel}>Health Score</span>
                        </div>
                    </div>
                )}
                <div className={styles.quickStat}>
                    <DollarSign size={20} />
                    <div>
                        <span className={styles.quickStatValue}>{formatCurrency(stats.monthlySpent)}</span>
                        <span className={styles.quickStatLabel}>This Month</span>
                    </div>
                </div>
                <div className={styles.quickStat}>
                    <AlertCircle size={20} style={{ color: anomalies.length > 0 ? '#EF4444' : '#10B981' }} />
                    <div>
                        <span className={styles.quickStatValue}>{anomalies.length}</span>
                        <span className={styles.quickStatLabel}>Anomalies</span>
                    </div>
                </div>
                <div className={styles.quickStat}>
                    <Repeat size={20} />
                    <div>
                        <span className={styles.quickStatValue}>{recurring.length}</span>
                        <span className={styles.quickStatLabel}>Subscriptions</span>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                {[
                    { id: 'overview', icon: Gauge, label: 'Overview' },
                    { id: 'health', icon: Shield, label: 'Health Score' },
                    { id: 'anomalies', icon: AlertTriangle, label: 'Anomalies' },
                    { id: 'trends', icon: Activity, label: 'Trends' },
                    { id: 'patterns', icon: Calendar, label: 'Patterns' },
                    { id: 'ai', icon: Brain, label: 'AI Analysis' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={styles.loadingState}>
                    <Loader2 size={48} className={styles.spinner} />
                    <p>Crunching your financial data...</p>
                </div>
            )}

            {/* Tab Content */}
            {!isLoading && (
                <AnimatePresence mode="wait">
                    {/* Empty State - No Transactions */}
                    {transactions.length === 0 && (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <BarChart3 size={64} style={{ color: '#3B82F6' }} />
                            <h3>No Transaction Data Yet!</h3>
                            <p>Add some transactions to get real, accurate insights about your spending patterns.</p>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                                Go to <strong>Transactions</strong> page to add your first transaction.
                            </p>
                        </motion.div>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && transactions.length > 0 && (
                        <motion.div
                            key="overview"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Health Score Card */}
                            {healthScore && (
                                <div className={styles.overviewCard}>
                                    <div className={styles.healthScoreDisplay}>
                                        <div
                                            className={styles.scoreCircle}
                                            style={{ borderColor: getGradeColor(healthScore.grade) }}
                                        >
                                            <span className={styles.scoreGrade} style={{ color: getGradeColor(healthScore.grade) }}>
                                                {healthScore.grade}
                                            </span>
                                            <span className={styles.scoreNumber}>{healthScore.overall}/100</span>
                                        </div>
                                        <div className={styles.scoreDetails}>
                                            <h3>Financial Health Score</h3>
                                            <p>Based on savings rate, budget adherence, spending trends, tracking consistency, and goal progress</p>
                                            <button
                                                className={styles.viewMoreBtn}
                                                onClick={() => setActiveTab('health')}
                                            >
                                                View Details <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Spending Velocity */}
                            {velocity && (
                                <div className={styles.overviewCard}>
                                    <h3><Activity size={20} /> Spending Velocity</h3>
                                    <div className={styles.velocityGrid}>
                                        <div className={styles.velocityStat}>
                                            <span className={styles.velocityValue}>{formatCurrency(velocity.dailyRate)}</span>
                                            <span className={styles.velocityLabel}>Daily Rate</span>
                                        </div>
                                        <div className={styles.velocityStat}>
                                            <span className={styles.velocityValue}>{formatCurrency(velocity.projectedMonthEnd)}</span>
                                            <span className={styles.velocityLabel}>Projected Month End</span>
                                        </div>
                                        {velocity.daysUntilBudgetDepleted !== null && (
                                            <div className={styles.velocityStat}>
                                                <span className={styles.velocityValue}>{velocity.daysUntilBudgetDepleted} days</span>
                                                <span className={styles.velocityLabel}>Until Budget Depleted</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`${styles.burnRateBadge} ${styles[velocity.burnRate]}`}>
                                        {velocity.burnRate === 'fast' ? '🔥' : velocity.burnRate === 'slow' ? '✅' : '👌'} {velocity.suggestion}
                                    </div>
                                </div>
                            )}

                            {/* Top Anomalies Preview */}
                            {anomalies.length > 0 && (
                                <div className={styles.overviewCard}>
                                    <h3><AlertTriangle size={20} /> Recent Anomalies</h3>
                                    <div className={styles.anomalyPreview}>
                                        {anomalies.slice(0, 3).map(a => (
                                            <div key={a.id} className={styles.anomalyItem} style={{ borderLeftColor: getSeverityColor(a.severity) }}>
                                                <span className={styles.anomalySeverity} style={{ background: getSeverityColor(a.severity) }}>
                                                    {a.severity}
                                                </span>
                                                <span>{a.description}</span>
                                                <span className={styles.anomalyAmount}>{formatCurrency(a.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className={styles.viewMoreBtn} onClick={() => setActiveTab('anomalies')}>
                                        View All <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Budget vs Actual */}
                            {budgetComparison.length > 0 && (
                                <div className={styles.overviewCard}>
                                    <h3><Target size={20} /> Budget Status</h3>
                                    <div className={styles.budgetBars}>
                                        {budgetComparison.slice(0, 4).map(b => (
                                            <div key={b.category} className={styles.budgetBar}>
                                                <div className={styles.budgetBarHeader}>
                                                    <span>{b.category}</span>
                                                    <span style={{ color: getStatusColor(b.status) }}>
                                                        {b.percentUsed.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className={styles.budgetBarTrack}>
                                                    <div
                                                        className={styles.budgetBarFill}
                                                        style={{
                                                            width: `${Math.min(100, b.percentUsed)}%`,
                                                            background: getStatusColor(b.status)
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.budgetBarFooter}>
                                                    <span>{formatCurrency(b.actual)} / {formatCurrency(b.budgeted)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Prediction */}
                            {prediction && (
                                <div className={styles.overviewCard}>
                                    <h3><Brain size={20} /> AI Prediction</h3>
                                    <div className={styles.predictionDisplay}>
                                        <div className={styles.predictionMain}>
                                            <span className={styles.predictionAmount}>{formatCurrency(prediction.nextMonth)}</span>
                                            <span className={styles.predictionLabel}>Next Month Forecast</span>
                                        </div>
                                        <div className={`${styles.predictionTrend} ${styles[prediction.trend]}`}>
                                            {prediction.trend === 'up' ? <ArrowUpRight size={20} /> : prediction.trend === 'down' ? <ArrowDownRight size={20} /> : null}
                                            {prediction.trend} trend • {Math.round(prediction.confidence * 100)}% confidence
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* HEALTH SCORE TAB */}
                    {activeTab === 'health' && healthScore && (
                        <motion.div
                            key="health"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className={styles.healthHeader}>
                                <div
                                    className={styles.bigScoreCircle}
                                    style={{ borderColor: getGradeColor(healthScore.grade) }}
                                >
                                    <span className={styles.bigGrade} style={{ color: getGradeColor(healthScore.grade) }}>
                                        {healthScore.grade}
                                    </span>
                                    <span className={styles.bigScore}>{healthScore.overall}</span>
                                    <span className={styles.outOf}>out of 100</span>
                                </div>
                            </div>

                            <div className={styles.factorsGrid}>
                                {healthScore.factors.map((factor, i) => (
                                    <motion.div
                                        key={factor.name}
                                        className={styles.factorCard}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className={styles.factorHeader}>
                                            <span className={styles.factorName}>{factor.name}</span>
                                            <span
                                                className={styles.factorStatus}
                                                style={{
                                                    background: factor.status === 'excellent' ? '#10B981' :
                                                        factor.status === 'good' ? '#3B82F6' :
                                                            factor.status === 'fair' ? '#F59E0B' : '#EF4444'
                                                }}
                                            >
                                                {factor.status}
                                            </span>
                                        </div>
                                        <div className={styles.factorScore}>
                                            <div className={styles.factorBar}>
                                                <div
                                                    className={styles.factorFill}
                                                    style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                                                />
                                            </div>
                                            <span>{factor.score}/{factor.maxScore}</span>
                                        </div>
                                        <p className={styles.factorTip}>💡 {factor.tip}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ANOMALIES TAB */}
                    {activeTab === 'anomalies' && (
                        <motion.div
                            key="anomalies"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {anomalies.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <CheckCircle size={64} />
                                    <h3>No Anomalies Detected!</h3>
                                    <p>Your spending patterns look normal. Keep it up! 🎉</p>
                                </div>
                            ) : (
                                <div className={styles.anomaliesList}>
                                    {anomalies.map((anomaly, i) => (
                                        <motion.div
                                            key={anomaly.id}
                                            className={styles.anomalyCard}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
                                        >
                                            <div className={styles.anomalyTop}>
                                                <span
                                                    className={styles.severityBadge}
                                                    style={{ background: getSeverityColor(anomaly.severity) }}
                                                >
                                                    {anomaly.severity === 'high' ? <XCircle size={14} /> : <AlertCircle size={14} />}
                                                    {anomaly.severity}
                                                </span>
                                                <span className={styles.anomalyType}>{anomaly.type.replace('_', ' ')}</span>
                                                <span className={styles.anomalyDate}>{new Date(anomaly.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className={styles.anomalyBody}>
                                                <p>{anomaly.description}</p>
                                                <div className={styles.anomalyComparison}>
                                                    <div>
                                                        <span className={styles.compLabel}>Actual</span>
                                                        <span className={styles.compValue}>{formatCurrency(anomaly.amount)}</span>
                                                    </div>
                                                    <div>
                                                        <span className={styles.compLabel}>Expected</span>
                                                        <span className={styles.compValue}>{formatCurrency(anomaly.expected)}</span>
                                                    </div>
                                                    <div>
                                                        <span className={styles.compLabel}>Difference</span>
                                                        <span className={styles.compValue} style={{ color: '#EF4444' }}>
                                                            +{formatCurrency(anomaly.amount - anomaly.expected)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* TRENDS TAB */}
                    {activeTab === 'trends' && (
                        <motion.div
                            key="trends"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className={styles.sectionTitle}>Category Trends</h2>
                            <div className={styles.trendsGrid}>
                                {categoryTrends.map((trend, i) => (
                                    <motion.div
                                        key={trend.category}
                                        className={styles.trendCard}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ borderTopColor: trend.color }}
                                    >
                                        <div className={styles.trendHeader}>
                                            <span className={styles.trendCategory}>{trend.category}</span>
                                            <span className={`${styles.trendIndicator} ${styles[trend.trend]}`}>
                                                {trend.trend === 'up' ? <TrendingUp size={16} /> :
                                                    trend.trend === 'down' ? <TrendingDown size={16} /> : '→'}
                                                {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className={styles.trendAmount}>{formatCurrency(trend.currentMonth)}</div>
                                        <div className={styles.trendMiniChart}>
                                            {[trend.threeMonthsAgo, trend.twoMonthsAgo, trend.lastMonth, trend.currentMonth].map((val, idx) => (
                                                <div
                                                    key={idx}
                                                    className={styles.miniBar}
                                                    style={{
                                                        height: `${Math.max(10, (val / Math.max(trend.currentMonth, trend.lastMonth, trend.twoMonthsAgo, trend.threeMonthsAgo, 1)) * 60)}px`,
                                                        background: idx === 3 ? trend.color : '#E5E7EB'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className={styles.trendFooter}>
                                            <span>Last month: {formatCurrency(trend.lastMonth)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PATTERNS TAB */}
                    {activeTab === 'patterns' && (
                        <motion.div
                            key="patterns"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Day of Week Analysis */}
                            <div className={styles.patternSection}>
                                <h2 className={styles.sectionTitle}><Clock size={20} /> Day of Week Spending</h2>
                                <div className={styles.dayGrid}>
                                    {dayAnalysis.map((day, i) => (
                                        <motion.div
                                            key={day.dayName}
                                            className={`${styles.dayCard} ${day.isHighest ? styles.highest : ''} ${day.isLowest ? styles.lowest : ''}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <span className={styles.dayName}>{day.dayName.slice(0, 3)}</span>
                                            <div
                                                className={styles.dayBar}
                                                style={{ height: `${Math.max(20, day.percentage * 3)}px` }}
                                            />
                                            <span className={styles.dayPercent}>{day.percentage.toFixed(0)}%</span>
                                            <span className={styles.dayAmount}>{formatCurrency(day.avgSpent)}/day</span>
                                            {day.isHighest && <span className={styles.dayBadge}>🔥 Most</span>}
                                            {day.isLowest && <span className={styles.dayBadge}>✨ Least</span>}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Recurring Transactions */}
                            <div className={styles.patternSection}>
                                <h2 className={styles.sectionTitle}><Repeat size={20} /> Detected Subscriptions</h2>
                                {recurring.length === 0 ? (
                                    <p className={styles.emptyText}>No recurring transactions detected yet</p>
                                ) : (
                                    <div className={styles.recurringGrid}>
                                        {recurring.map((r, i) => (
                                            <motion.div
                                                key={i}
                                                className={styles.recurringCard}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <div className={styles.recurringTop}>
                                                    <span className={styles.recurringMerchant}>{r.merchant}</span>
                                                    <span className={styles.recurringFreq}>{r.frequency}</span>
                                                </div>
                                                <div className={styles.recurringAmount}>{formatCurrency(r.amount)}</div>
                                                <div className={styles.recurringMeta}>
                                                    <span>Next: {new Date(r.nextExpected).toLocaleDateString()}</span>
                                                    <span>{Math.round(r.confidence * 100)}% confidence</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Top Merchants */}
                            <div className={styles.patternSection}>
                                <h2 className={styles.sectionTitle}><Store size={20} /> Top Merchants</h2>
                                <div className={styles.merchantList}>
                                    {merchantStats.slice(0, 8).map((m, i) => (
                                        <motion.div
                                            key={m.merchant}
                                            className={styles.merchantRow}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <span className={styles.merchantRank}>#{i + 1}</span>
                                            <div className={styles.merchantInfo}>
                                                <span className={styles.merchantName}>{m.merchant}</span>
                                                <span className={styles.merchantCategory}>{m.category}</span>
                                            </div>
                                            <div className={styles.merchantStats}>
                                                <span className={styles.merchantTotal}>{formatCurrency(m.totalSpent)}</span>
                                                <span className={styles.merchantCount}>{m.transactionCount} txns</span>
                                            </div>
                                            {m.isRecurring && <span className={styles.recurringBadge}>🔄</span>}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI ANALYSIS TAB */}
                    {activeTab === 'ai' && (
                        <motion.div
                            key="ai"
                            className={styles.tabContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {aiAnalysis && (
                                <>
                                    <div className={styles.aiSummaryCard}>
                                        <h3>📊 AI Summary</h3>
                                        <p>{aiAnalysis.summary}</p>
                                    </div>

                                    <div className={styles.aiGrid}>
                                        <div className={styles.aiSection}>
                                            <h4><Lightbulb size={18} /> Key Insights</h4>
                                            <ul>
                                                {aiAnalysis.insights?.map((insight: string, i: number) => (
                                                    <li key={i}>{insight}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className={`${styles.aiSection} ${styles.warnings}`}>
                                            <h4><AlertTriangle size={18} /> Warnings</h4>
                                            <ul>
                                                {aiAnalysis.warnings?.length > 0 ?
                                                    aiAnalysis.warnings.map((w: string, i: number) => (
                                                        <li key={i}>{w}</li>
                                                    )) :
                                                    <li style={{ color: '#10B981' }}>No warnings - looking good!</li>
                                                }
                                            </ul>
                                        </div>

                                        <div className={`${styles.aiSection} ${styles.opportunities}`}>
                                            <h4><Zap size={18} /> Savings Opportunities</h4>
                                            <ul>
                                                {aiAnalysis.opportunities?.map((opp: string, i: number) => (
                                                    <li key={i}>{opp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {budgetSuggestions && budgetSuggestions.totalSavings > 0 && (
                                        <div className={styles.savingsCard}>
                                            <div className={styles.savingsAmount}>
                                                {formatCurrency(budgetSuggestions.totalSavings)}
                                            </div>
                                            <span>Potential Monthly Savings</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className={styles.aiChatHint}>
                                <MessageCircle size={24} />
                                <p>Use the floating chat button to ask AI personalized questions about your finances!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

export default InsightsPage;
