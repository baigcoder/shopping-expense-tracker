// Cashly Dashboard - Premium Modern SaaS Finance Dashboard
// Midnight Coral Theme - Light Mode
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Receipt, BarChart3, Target, Calendar, PiggyBank, ArrowRight, TrendingUp, TrendingDown, ShoppingCart, Store, Heart, Wallet, Eye, EyeOff, X, Trash2, Copy, Shield, Check, Inbox, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PremiumCard from '../components/PremiumCard';
import MoneyTwinPulse from '../components/dashboard/MoneyTwinPulse';
import ExtensionStatsCard from '../components/ExtensionStatsCard';
import { SpendingChart } from '../components/SpendingChart';
import { useAuthStore, useCardStore, useModalStore } from '../store/useStore';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { budgetService } from '../services/budgetService';
import { streakService } from '../services/streakService';
import { cardService, getBrandGradient, CardData } from '../services/cardService';
import { usePaymentCaptureSync } from '../hooks/usePaymentCaptureSync';
import { formatBehaviorFlow, formatCaptureState } from '../utils/paymentCaptureTrail';
import { formatCurrency } from '../services/currencyService';
import { transactionInboxApi } from '../services/featureExpansionApi';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '../lib/motion';
import { soundManager } from '@/lib/sounds';
import styles from './DashboardPage.module.css';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
};

const DashboardPage = () => {
    const { user } = useAuthStore();
    const { initializeCards } = useCardStore();
    const { openAddCard } = useModalStore();
    const reduceMotion = usePrefersReducedMotion();

    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        transactionsToday: 0,
        streakDays: 0,
        totalSaving: 0,
        balanceTrend: 0,
        expenseTrend: 0,
    });
    const [chartData, setChartData] = useState<{ day: string; income: number; expense: number }[]>([]);
    const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [budgetProgress, setBudgetProgress] = useState({ used: 0, total: 0, percentage: 0 });
    const [userCards, setUserCards] = useState<CardData[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<SupabaseTransaction[]>([]);
    const [healthScore, setHealthScore] = useState(0);
    const [merchantData, setMerchantData] = useState<{ name: string; amount: number; count: number }[]>([]);
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pendingInboxCount, setPendingInboxCount] = useState(0);
    const { removeCard } = useCardStore();
    const navigate = useNavigate();

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
        if (confirm('Are you sure you want to delete this card?')) {
            await removeCard(selectedCard.id);
            setIsCardPreviewOpen(false);
            setSelectedCard(null);
            // Refresh cards
            if (user?.id) {
                const cards = await cardService.getAll(user.id);
                setUserCards(cards);
            }
            soundManager.play('success');
        }
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
        if (!user?.id) return;

        try {
            const [allTxs, streakData, budgets, fetchedCards] = await Promise.all([
                supabaseTransactionService.getAll(user.id, { force: true }),
                streakService.getStreakData(user.id),
                budgetService.getAll(user.id),
                cardService.getAll(user.id)
            ]);

            setTransactions(allTxs);
            setUserCards(fetchedCards);
            setRecentTransactions(allTxs.slice(0, 5));

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentMonthTxs = allTxs.filter(tx => new Date(tx.date).getMonth() === currentMonth);

            const totalIncome = allTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const totalExpense = allTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const monthlyIncome = currentMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const monthlyExpense = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

            const todayDate = new Date().toISOString().split('T')[0];
            const todayTxs = allTxs.filter(tx => tx.date.startsWith(todayDate));

            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthTxs = allTxs.filter(tx => new Date(tx.date).getMonth() === lastMonth);
            const lastMonthExpense = lastMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const expenseTrend = lastMonthExpense > 0 ? ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

            setStats({
                totalBalance: totalIncome - totalExpense,
                monthlyIncome,
                monthlyExpense,
                transactionsToday: todayTxs.length,
                streakDays: streakData.currentStreak,
                totalSaving: Math.max(0, totalIncome - totalExpense),
                balanceTrend: totalIncome > 0 ? Math.round((totalIncome - totalExpense) / totalIncome * 100) : 0,
                expenseTrend: Math.round(expenseTrend * 10) / 10,
            });

            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                return date.toISOString().split('T')[0];
            });

            const chartDataCalc = last14Days.map(date => {
                const dayTxs = allTxs.filter(tx => tx.date.startsWith(date));
                return {
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    income: dayTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
                    expense: Math.abs(dayTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0))
                };
            });
            setChartData(chartDataCalc);

            const categoryMap = new Map<string, number>();
            allTxs.filter(tx => tx.type === 'expense').forEach(tx => {
                const current = categoryMap.get(tx.category) || 0;
                categoryMap.set(tx.category, current + Math.abs(tx.amount));
            });

            const categoryArr = Array.from(categoryMap.entries())
                .map(([name, value], idx) => ({
                    name,
                    value,
                    color: ['#E11D48', '#78716C', '#A8A29E', '#57534E', '#BE123C', '#1C1917'][idx % 6]
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            setCategoryData(categoryArr);

            const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
            const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((monthlyExpense / totalBudget) * 100)) : 0;
            setBudgetProgress({
                used: monthlyExpense,
                total: totalBudget,
                percentage: budgetPercentage
            });

            let score = 0;
            const streakPoints = Math.min(100, streakData.currentStreak * 12);
            score += streakPoints * 0.20;
            const budgetAdherence = totalBudget > 0
                ? Math.max(0, 100 - budgetPercentage)
                : 50;
            score += budgetAdherence * 0.25;
            const savingsRateCalc = totalIncome > 0
                ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100))
                : 50;
            score += savingsRateCalc * 0.25;
            const activityPoints = Math.min(100, allTxs.length * 5);
            score += activityPoints * 0.15;
            const uniqueCategories = new Set(allTxs.map(t => t.category)).size;
            const diversificationPoints = Math.min(100, uniqueCategories * 15);
            score += diversificationPoints * 0.15;
            const finalScore = Math.max(0, Math.min(100, Math.round(score)));
            setHealthScore(allTxs.length > 0 ? finalScore : 50);

            const merchantMap = new Map<string, { amount: number; count: number }>();
            allTxs.filter(tx => tx.type === 'expense').forEach(tx => {
                const name = tx.description.split(/[\d\s]/)[0] || 'Unknown';
                const cleanedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                const current = merchantMap.get(cleanedName) || { amount: 0, count: 0 };
                merchantMap.set(cleanedName, {
                    amount: current.amount + Math.abs(tx.amount),
                    count: current.count + 1
                });
            });

            const merchantArr = Array.from(merchantMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);
            setMerchantData(merchantArr);

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
    }, [fetchInbox]);

    useEffect(() => {
        void fetchDashboard();
        if (user?.id) {
            initializeCards(user.id);
        }
    }, [user?.id, initializeCards, fetchDashboard]);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Shopping': '🛍️',
            'Food & Dining': '🍔',
            'Transport': '🚗',
            'Entertainment': '🎬',
            'Bills': '📱',
            'Health': '💊',
            'Travel': '✈️',
            'Other': '📦'
        };
        return icons[category] || '📦';
    };

    if (loading) {
        return (
            <div className={styles.dashboardWrapper}>
                <DashboardSkeleton />
            </div>
        );
    }


    return (
        <div className={styles.dashboardWrapper}>
            <motion.div
                className={styles.container}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.header className={styles.header} variants={itemVariants}>
                    <div className={styles.welcomeText}>
                        <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
                        <p>Here’s a calm look at this month.</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-[var(--text-muted)]">Protected session</span>
                            <div className="mt-1 flex items-center gap-2 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
                                <Shield size={12} /> Signed in
                            </div>
                        </div>
                    </div>
                </motion.header>

                {captureTrail && (
                    <motion.div variants={itemVariants} className={styles.captureTrail}>
                        <div className={styles.captureTrailIcon}>
                            <Zap size={18} strokeWidth={2.5} />
                        </div>
                        <div className={styles.captureTrailBody}>
                            <p className={styles.captureTrailLabel}>
                                Live payment capture
                                <span className={styles.captureTrailState}>{formatCaptureState(captureTrail.state)}</span>
                            </p>
                            <p className={styles.captureTrailMerchant}>
                                {captureTrail.merchant}
                                {captureTrail.amount > 0 ? ` · ${formatCurrency(captureTrail.amount)}` : ''}
                            </p>
                            {formatBehaviorFlow(captureTrail.behaviorFlow) && (
                                <p className={styles.captureTrailFlow}>{formatBehaviorFlow(captureTrail.behaviorFlow)}</p>
                            )}
                        </div>
                        <Link
                            to={captureTrail.pendingReview ? '/transaction-inbox' : '/transactions'}
                            className={styles.captureTrailAction}
                        >
                            {captureTrail.pendingReview ? 'Review' : 'Ledger'}
                        </Link>
                    </motion.div>
                )}

                {pendingInboxCount > 0 && (
                    <motion.div variants={itemVariants}>
                        <Link
                            to="/transaction-inbox"
                            className="flex items-center justify-between gap-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-lg)]"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand-muted)] text-[var(--brand)]">
                                    <Inbox size={18} strokeWidth={2} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-[var(--brand)]">Inbox</p>
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                        {pendingInboxCount} payment{pendingInboxCount === 1 ? '' : 's'} waiting to review
                                    </p>
                                </div>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-[var(--brand)]">Review</span>
                        </Link>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <motion.div
                        variants={itemVariants}
                        className={cn(styles.statCard, styles.statCardPrimary)}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxGlass)}>
                            <div data-anim={reduceMotion ? undefined : 'pulse-soft'}>
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={styles.statTitle}>{stats.totalBalance >= 0 ? 'Total Balance' : 'Total Spent'}</p>
                                <h2 className={styles.value}>
                                    {showBalance ? formatCurrency(Math.abs(stats.totalBalance)) : '••••••'}
                                </h2>
                            </div>
                            <button onClick={() => setShowBalance(!showBalance)} className="rounded-[var(--r-sm)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)]">
                                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                        <div className={styles.statTrend}>
                            <TrendingUp size={12} /> <span>{Math.abs(stats.balanceTrend)}% Saved</span>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className={styles.statCard}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxBlue)}>
                            <div data-anim={reduceMotion ? undefined : 'bob-up'}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <p className={styles.statTitle}>Money In</p>
                        <h2 className={styles.value}>{formatCurrency(stats.monthlyIncome)}</h2>
                        <p className="text-[10px] text-slate-400 font-semibold mt-2">This Month</p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className={styles.statCard}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxRose)}>
                            <div data-anim={reduceMotion ? undefined : 'bob-down'}>
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <p className={styles.statTitle}>Money Out</p>
                        <h2 className={styles.value}>{formatCurrency(stats.monthlyExpense)}</h2>
                        <div className={cn(styles.statTrend, stats.expenseTrend <= 0 ? styles.trendUp : styles.trendDown)}>
                            {stats.expenseTrend <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                            <span>{Math.abs(stats.expenseTrend)}% vs last month</span>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className={styles.statCard}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxIndigo)}>
                            <div data-anim={reduceMotion ? undefined : 'wobble'}>
                                <Target size={20} />
                            </div>
                        </div>
                        <p className={styles.statTitle}>Your Streak</p>
                        <h2 className={styles.value}>{stats.streakDays} Days 🔥</h2>
                        <p className="text-[10px] text-slate-400 font-semibold mt-2">Keep it going! 💪</p>
                    </motion.div>
                </div>

                {/* Main Content Layout */}
                <div className={styles.mainLayout}>
                    {/* Left Column */}
                    <div className="space-y-6">
                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Spending Chart</h3>
                                <Link to="/analytics" className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:underline">
                                    See more <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="h-[300px]">
                                <SpendingChart data={chartData} />
                            </div>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <h3 className={cn(styles.sectionTitle, "mb-6")}>Where Your Money Goes</h3>
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.15 }
                                        }
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {categoryData.length > 0 ? categoryData.map((cat, i) => (
                                        <motion.div
                                            key={i}
                                            variants={{
                                                hidden: { opacity: 0, x: -20 },
                                                visible: { opacity: 1, x: 0 }
                                            }}
                                            className={styles.pipelineItem}
                                        >
                                            <motion.div
                                                className={styles.catIcon}
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                            >
                                                {getCategoryIcon(cat.name)}
                                            </motion.div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                                    <span className="text-xs font-medium text-[var(--text-muted)]">{formatCurrency(cat.value)}</span>
                                                </div>
                                                <div className={styles.progressTrack}>
                                                    <motion.div
                                                        className={styles.progressBar}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (cat.value / (categoryData[0]?.value || 1)) * 100)}%` }}
                                                        style={{ backgroundColor: cat.color }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div
                                            className="text-center py-12 w-full relative"
                                        >
                                            <div className="relative mb-10 flex justify-center">
                                                <span
                                                    data-anim={reduceMotion ? undefined : 'ripple'}
                                                    className="absolute w-24 h-24 bg-slate-100 rounded-lg border-2 border-black/5"
                                                />
                                                <div
                                                    data-anim={reduceMotion ? undefined : 'bob-up'}
                                                    className="relative z-10 rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)]"
                                                >
                                                    <ShoppingCart size={48} className="text-[var(--text-muted)]" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)]">No spending to show yet</p>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>

                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Budget Usage</h3>
                                    <Link to="/budgets">
                                        <Target size={18} className="text-slate-400 hover:text-rose-600 transition-colors" />
                                    </Link>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4">
                                    {budgetProgress.total > 0 ? (
                                        <>
                                            <div className="relative w-44 h-44 mb-6">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="88" cy="88" r="75" stroke="#f1f5f9" strokeWidth="16" fill="none" />
                                                    <motion.circle
                                                        cx="88" cy="88" r="75"
                                                        stroke={budgetProgress.percentage > 90 ? '#E11D48' : '#1C1917'}
                                                        strokeWidth="20" fill="none"
                                                        initial={{ strokeDasharray: "0 471" }}
                                                        animate={{ strokeDasharray: `${(budgetProgress.percentage / 100) * 471} 471` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-semibold text-[var(--text-primary)]">{budgetProgress.percentage}%</span>
                                                    <span className="text-xs font-medium text-[var(--text-muted)]">Spent</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-[var(--text-muted)]">
                                                {formatCurrency(budgetProgress.used)} / {formatCurrency(budgetProgress.total)}
                                            </p>
                                        </>
                                    ) : (
                                        <div
                                            className="text-center py-6 w-full relative"
                                        >
                                            {/* Premium Ripple Animation */}
                                            <div className="relative mb-10 flex justify-center">
                                                <span
                                                    data-anim={reduceMotion ? undefined : 'ripple'}
                                                    className="absolute h-24 w-24 rounded-full bg-[var(--brand-muted)]"
                                                />
                                                <span
                                                    data-anim={reduceMotion ? undefined : 'ripple'}
                                                    className="absolute h-24 w-24 rounded-full bg-[var(--brand-muted)]"
                                                    style={reduceMotion ? undefined : { animationDelay: '1.5s' }}
                                                />
                                                <div
                                                    data-anim={reduceMotion ? undefined : 'bob-up'}
                                                    className="relative z-10 rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-md)]"
                                                >
                                                    <Target size={44} className="text-[var(--brand)]/50" />
                                                </div>
                                            </div>

                                            <p className="mb-6 text-sm text-[var(--text-muted)]">
                                                No budget set yet
                                            </p>

                                            <div>
                                                <Link
                                                    to="/budgets"
                                                    className="inline-flex items-center gap-2 rounded-[var(--r-md)] bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--brand-hover)]"
                                                >
                                                    Set a budget
                                                    <Plus size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* NEW EXTRA CARDS ROW */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Financial Health</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span
                                                data-anim={reduceMotion ? undefined : 'ping-soft'}
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"
                                            />
                                            <Heart size={20} className="text-rose-500" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.healthGaugeContainer}>
                                    <div className={styles.healthGauge}>
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="90" cy="90" r="75" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                                            <motion.circle
                                                cx="90" cy="90" r="75"
                                                stroke="#E11D48"
                                                strokeWidth="16" fill="none" strokeLinecap="round"
                                                initial={{ strokeDasharray: "0 471" }}
                                                animate={{ strokeDasharray: `${(healthScore / 100) * 471} 471` }}
                                                transition={{ duration: 2, ease: "circOut" }}
                                            />
                                        </svg>
                                        <div className={styles.healthValue}>
                                            <span className="text-5xl font-semibold tracking-tight text-[var(--text-primary)]">{healthScore}</span>
                                            <span className="mt-1 text-xs font-medium text-[var(--text-muted)]">Score</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 text-center px-4">
                                    <p className="text-xs font-medium text-[var(--text-muted)]">
                                        How this month looks
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                        {healthScore > 80 ? 'You’re in good shape' : healthScore > 60 ? 'Steady — a few tweaks would help' : 'Worth a closer look this week'}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Top Merchants</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span
                                                data-anim={reduceMotion ? undefined : 'ping-strong'}
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--brand)] rounded-full"
                                            />
                                            <Store size={20} className="text-[var(--brand)]" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {merchantData.length > 0 ? merchantData.map((m, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all rounded-lg">
                                            <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-lg">🏪</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{m.name}</span>
                                                    <span className="text-xs font-medium text-[var(--text-muted)]">{m.count} visits</span>
                                                </div>
                                                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(m.amount)}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 opacity-30">
                                            <Store size={40} className="mx-auto mb-3" />
                                            <p className="text-xs text-[var(--text-muted)]">No merchants yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <motion.div variants={itemVariants}>
                            <ExtensionStatsCard />
                        </motion.div>

                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Cards</h3>
                                <button onClick={openAddCard} className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                    <Plus size={16} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                                {userCards.length > 0 ? userCards.map((card) => (
                                    <div key={card.id} className="flex-shrink-0 cursor-pointer w-[320px]" style={{ scrollSnapAlign: 'start' }}>
                                        <PremiumCard
                                            card={{
                                                ...card,
                                                type: card.card_type // Map card_type to type for PremiumCard
                                            } as any}
                                            onClick={() => handleCardClick(card)}
                                        />
                                    </div>
                                )) : (
                                    <div className="w-full rounded-[var(--r-lg)] border border-[var(--border)] bg-white py-16 text-center shadow-[var(--shadow-md)]">
                                        <div className="relative mb-6 flex justify-center">
                                            <CreditCard size={48} className="text-[var(--text-muted)]" />
                                        </div>
                                        <p className="text-sm font-medium text-[var(--text-muted)]">No cards yet</p>
                                        <button onClick={openAddCard} className="mt-6 rounded-[var(--r-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                            Add a card
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Recent activity</h3>
                                <Link to="/transactions">
                                    <ArrowRight size={18} className="text-slate-400 hover:text-rose-600" />
                                </Link>
                            </div>
                            <div className="space-y-1">
                                {recentTransactions.length > 0 ? recentTransactions.map((tx, i) => (
                                    <div key={tx.id} className={styles.txRow}>
                                        <div className={styles.txIcon}>{getCategoryIcon(tx.category)}</div>
                                        <div className={styles.txDetails}>
                                            <p className={styles.txDesc}>{tx.description || 'Transaction'}</p>
                                            <p className={styles.txCat}>{tx.category}</p>
                                        </div>
                                        <div className={cn(styles.txAmount, tx.type === 'expense' ? 'text-[var(--text-secondary)]' : 'text-[var(--success)]')}>
                                            {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Receipt size={40} className="mx-auto mb-3" />
                                        <p className="text-sm text-[var(--text-muted)]">No recent transactions</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Quick Access</h3>
                            </div>
                            <div className={styles.quickActionGrid}>
                                <Link to="/budgets" className={styles.actionBtn}>
                                    <div className="p-3 bg-slate-100 text-slate-900 rounded-lg"><Target size={20} /></div>
                                    <span className={styles.actionLabel}>Budgets</span>
                                </Link>
                                <Link to="/goals" className={styles.actionBtn}>
                                    <div className="p-3 bg-slate-100 text-slate-900 rounded-lg"><PiggyBank size={20} /></div>
                                    <span className={styles.actionLabel}>Goals</span>
                                </Link>
                                <Link to="/analytics" className={styles.actionBtn}>
                                    <div className="p-3 bg-slate-100 text-slate-900 rounded-lg"><BarChart3 size={20} /></div>
                                    <span className={styles.actionLabel}>Trends</span>
                                </Link>
                                <Link to="/subscriptions" className={styles.actionBtn}>
                                    <div className="p-3 bg-slate-100 text-slate-900 rounded-lg"><Calendar size={20} /></div>
                                    <span className={styles.actionLabel}>Bills</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* AI Insights Section */}
                <motion.div variants={itemVariants} className="mt-8">
                    <MoneyTwinPulse userId={user?.id || ''} />
                </motion.div>
            </motion.div>

            {/* Card Preview Dialog */}
            <Dialog open={isCardPreviewOpen} onOpenChange={setIsCardPreviewOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                    <DialogHeader className="border-b border-[var(--border)] bg-white px-6 pb-4 pt-6">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="rounded-[var(--r-md)] bg-[var(--brand-muted)] p-2">
                                <CreditCard className="text-[var(--brand)]" size={24} />
                            </div>
                            <span className="font-semibold text-[var(--text-primary)]">Card details</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCard && (
                        <div className="p-6 space-y-5">
                            {/* Card Preview */}
                            <div className="transform scale-95 origin-center">
                                <PremiumCard
                                    card={{
                                        ...selectedCard,
                                        type: selectedCard.card_type
                                    } as any}
                                />
                            </div>

                            {/* Card Info */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center rounded-[var(--r-md)] bg-[#FAF8F5] p-3">
                                    <span className="text-sm text-slate-500">Card Number</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold">**** **** **** {selectedCard.last4}</span>
                                        <button
                                            onClick={() => handleCopy(selectedCard.last4 || '')}
                                            className="rounded-[var(--r-sm)] p-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
                                        >
                                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center rounded-[var(--r-md)] bg-[#FAF8F5] p-3">
                                    <span className="text-sm text-slate-500">Card Holder</span>
                                    <span className="font-semibold">{selectedCard.holder}</span>
                                </div>

                                <div className="flex justify-between items-center rounded-[var(--r-md)] bg-[#FAF8F5] p-3">
                                    <span className="text-sm text-slate-500">Expires</span>
                                    <span className="font-semibold">{selectedCard.expiry}</span>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="flex items-center gap-2 rounded-[var(--r-md)] bg-[#ECFDF5] p-3 text-[#059669]">
                                <Shield size={16} />
                                <span className="text-xs">PCI-DSS compliant • No sensitive data stored</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsCardPreviewOpen(false);
                                        navigate('/cards');
                                    }}
                                    className="flex-1 rounded-[var(--r-md)] bg-[var(--brand)] px-4 py-3 font-semibold text-white hover:bg-[var(--brand-hover)]"
                                >
                                    Manage cards
                                </button>
                                <button
                                    onClick={handleDeleteCard}
                                    className="rounded-[var(--r-md)] bg-[#FFE4E6] p-3 text-[var(--brand)] hover:bg-[#FECDD3]"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardPage;
