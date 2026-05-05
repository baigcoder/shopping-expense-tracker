// Cashly Dashboard - Premium Modern SaaS Finance Dashboard
// Midnight Coral Theme - Light Mode
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Receipt, BarChart3, Target, Calendar, PiggyBank, ArrowRight, TrendingUp, TrendingDown, ShoppingCart, Store, Heart, Wallet, Activity, Eye, EyeOff, Zap, X, Trash2, Copy, Shield, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PremiumCard from '../components/PremiumCard';
import MoneyTwinPulse from '../components/dashboard/MoneyTwinPulse';
import ExtensionStatsCard from '../components/ExtensionStatsCard';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { useAuthStore, useCardStore, useModalStore } from '../store/useStore';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { budgetService } from '../services/budgetService';
import { streakService } from '../services/streakService';
import { cardService, getBrandGradient, CardData } from '../services/cardService';
import { useRealtimeTransactions } from '../hooks/useRealtimeTransactions';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
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
    useRealtimeTransactions();

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

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

            try {
                const [allTxs, streakData, budgets, fetchedCards] = await Promise.all([
                    supabaseTransactionService.getAll(user.id),
                    streakService.getStreakData(user.id),
                    budgetService.getAll(user.id),
                    cardService.getAll(user.id)
                ]);

                setTransactions(allTxs);
                setUserCards(fetchedCards);
                setRecentTransactions(allTxs.slice(0, 5));

                // Calculate stats
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentMonthTxs = allTxs.filter(tx => new Date(tx.date).getMonth() === currentMonth);

                const totalIncome = allTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
                const totalExpense = allTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                const monthlyIncome = currentMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
                const monthlyExpense = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

                const todayDate = new Date().toISOString().split('T')[0];
                const todayTxs = allTxs.filter(tx => tx.date.startsWith(todayDate));

                // Last month comparison
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

                // Chart data - last 14 days
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

                // Category data
                const categoryMap = new Map<string, number>();
                allTxs.filter(tx => tx.type === 'expense').forEach(tx => {
                    const current = categoryMap.get(tx.category) || 0;
                    categoryMap.set(tx.category, current + Math.abs(tx.amount));
                });

                const categoryArr = Array.from(categoryMap.entries())
                    .map(([name, value], idx) => ({
                        name,
                        value,
                        color: ['#000000', '#E11D48', '#3F3F46', '#09090B', '#F43F5E', '#18181B'][idx % 6]
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                setCategoryData(categoryArr);

                // Budget progress
                const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
                const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((monthlyExpense / totalBudget) * 100)) : 0;
                setBudgetProgress({
                    used: monthlyExpense,
                    total: totalBudget,
                    percentage: budgetPercentage
                });

                // Financial Health Score Calculation
                // Factors: Streak (20%), Budget Adherence (25%), Savings Rate (25%), Activity (15%), Diversification (15%)
                let score = 0;

                // 1. Streak Points (20%) - Consistent tracking
                const streakPoints = Math.min(100, streakData.currentStreak * 12);
                score += streakPoints * 0.20;

                // 2. Budget Adherence (25%) - Staying under budget
                const budgetAdherence = totalBudget > 0
                    ? Math.max(0, 100 - budgetPercentage)  // Lower usage is better
                    : 50; // Default if no budget set
                score += budgetAdherence * 0.25;

                // 3. Savings Rate (25%) - Money saved vs income
                const savingsRateCalc = totalIncome > 0
                    ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100))
                    : 50;
                score += savingsRateCalc * 0.25;

                // 4. Activity (15%) - Regular transactions
                const activityPoints = Math.min(100, allTxs.length * 5);
                score += activityPoints * 0.15;

                // 5. Category Diversification (15%) - Not overspending in one area
                const uniqueCategories = new Set(allTxs.map(t => t.category)).size;
                const diversificationPoints = Math.min(100, uniqueCategories * 15);
                score += diversificationPoints * 0.15;

                // Round and clamp between 0-100
                const finalScore = Math.max(0, Math.min(100, Math.round(score)));
                setHealthScore(allTxs.length > 0 ? finalScore : 50); // Default to 50 if no transactions

                // Merchant Data Extraction
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

                setLoading(false);
            } catch (error) {
                console.error('Dashboard data fetch error:', error);
                setLoading(false);
            }
        };

        fetchData();
        if (user?.id) {
            initializeCards(user.id);
        }
    }, [user?.id, initializeCards]);

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
                        <p>Financial Ecosystem • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Security</span>
                            <div className="flex items-center gap-2 mt-1 px-3 py-1 border-2 border-black bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-tighter">
                                <Shield size={12} /> SECURED_CHANNEL
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <motion.div
                        variants={itemVariants}
                        className={cn(styles.statCard, styles.statCardPrimary)}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxGlass)}>
                            <motion.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    rotate: [0, 10, -10, 0],
                                    filter: ["drop-shadow(0 0 0px #3b82f6)", "drop-shadow(0 0 8px #3b82f6)", "drop-shadow(0 0 0px #3b82f6)"]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Wallet size={20} className="text-blue-400" />
                            </motion.div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={styles.statTitle}>{stats.totalBalance >= 0 ? 'Total Balance' : 'Total Spent'}</p>
                                <h2 className={styles.value}>
                                    {showBalance ? formatCurrency(Math.abs(stats.totalBalance)) : '••••••'}
                                </h2>
                            </div>
                            <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 hover:bg-white/10 rounded-none text-white/80 transition-colors">
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
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxBlue)}>
                            <motion.div
                                animate={{
                                    y: [0, -5, 0],
                                    filter: ["drop-shadow(0 0 0px #10b981)", "drop-shadow(0 0 8px #10b981)", "drop-shadow(0 0 0px #10b981)"]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <TrendingUp size={20} className="text-emerald-400" />
                            </motion.div>
                        </div>
                        <p className={styles.statTitle}>Money In</p>
                        <h2 className={styles.value}>{formatCurrency(stats.monthlyIncome)}</h2>
                        <p className="text-[10px] text-slate-400 font-semibold mt-2">This Month</p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className={styles.statCard}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxRose)}>
                            <motion.div
                                animate={{
                                    y: [0, 3, 0],
                                    scale: [1, 1.05, 1],
                                    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <TrendingDown size={20} />
                            </motion.div>
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
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <div className={cn(styles.iconBox, styles.iconBoxIndigo)}>
                            <motion.div
                                animate={{
                                    rotate: [0, 15, -15, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Target size={20} className="text-purple-400" />
                            </motion.div>
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
                                <Link to="/analytics" className="text-xs font-black text-rose-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                    See More <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={true} />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                                            tickLine={false}
                                            tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                                            tickLine={false}
                                            tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                                            tickFormatter={(v) => `Rs${v}`}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white border-[3px] border-black p-4 shadow-[6px_6px_0px_#000000]">
                                                            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
                                                                {payload[0].payload.day}
                                                            </p>
                                                            {payload.map((entry, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 mt-1">
                                                                    <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: entry.color }} />
                                                                    <span className="text-[10px] font-black text-black uppercase tracking-tighter">{entry.name}:</span>
                                                                    <span className="text-sm font-black text-black">Rs{entry.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="stepAfter"
                                            dataKey="income"
                                            stroke="#000000"
                                            strokeWidth={4}
                                            fill="#000000"
                                            fillOpacity={0.1}
                                            name="Inflow"
                                            animationDuration={1000}
                                            activeDot={{ r: 8, strokeWidth: 3, stroke: '#000000', fill: '#FFFFFF' }}
                                        />
                                        <Area
                                            type="stepAfter"
                                            dataKey="expense"
                                            stroke="#E11D48"
                                            strokeWidth={4}
                                            fill="#E11D48"
                                            fillOpacity={0.1}
                                            name="Outflow"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
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
                                                    <span className="text-xs font-black text-slate-400">{formatCurrency(cat.value)}</span>
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
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-12 w-full relative"
                                        >
                                            <div className="relative mb-10 flex justify-center">
                                                <motion.div
                                                    className="absolute w-24 h-24 bg-slate-100 rounded-lg border-2 border-black/5"
                                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                                                />
                                                <motion.div
                                                    animate={{
                                                        y: [0, -10, 0],
                                                        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                                    }}
                                                    className="relative z-10 p-6 bg-white border-3 border-black shadow-[8px_8px_0px_#000000]"
                                                >
                                                    <ShoppingCart size={48} className="text-slate-200" />
                                                </motion.div>
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">NO_EXPENSE_DATA_STREAM</p>
                                        </motion.div>
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
                                                        stroke={budgetProgress.percentage > 90 ? '#E11D48' : '#000000'}
                                                        strokeWidth="20" fill="none"
                                                        initial={{ strokeDasharray: "0 471" }}
                                                        animate={{ strokeDasharray: `${(budgetProgress.percentage / 100) * 471} 471` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-black text-black">{budgetProgress.percentage}%</span>
                                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Spent</span>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-black uppercase tracking-widest">
                                                {formatCurrency(budgetProgress.used)} / {formatCurrency(budgetProgress.total)}
                                            </p>
                                        </>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-6 w-full relative"
                                        >
                                            {/* Premium Ripple Animation */}
                                            <div className="relative mb-10 flex justify-center">
                                                <motion.div
                                                    className="absolute w-24 h-24 bg-violet-500/10 rounded-none border-2 border-black/10"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                                                />
                                                <motion.div
                                                    className="absolute w-24 h-24 bg-violet-500/10 rounded-none border-2 border-black/10"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
                                                />
                                                <motion.div
                                                    animate={{
                                                        y: [0, -8, 0],
                                                        scale: [1, 1.05, 1],
                                                        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                                    }}
                                                    className="relative z-10 p-5 bg-white/50 backdrop-blur-sm rounded-none border-2 border-slate-100/50 shadow-[8px_8px_0px_#000000]"
                                                >
                                                    <Target size={44} className="text-rose-600/40" />
                                                </motion.div>
                                            </div>

                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.4 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-slate-500"
                                            >
                                                No Active Budget
                                            </motion.p>

                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <Link
                                                    to="/budgets"
                                                    className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white border-2 border-black font-black tracking-widest hover:translate-x-[-4px] hover:translate-y-[-4px] shadow-[6px_6px_0px_#E11D48] transition-all"
                                                >
                                                    SET LIMIT
                                                    <Plus size={18} />
                                                </Link>
                                            </motion.div>
                                        </motion.div>
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
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [1, 0.5, 1],
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
                                                stroke="#000000"
                                                strokeWidth="16" fill="none" strokeLinecap="round"
                                                initial={{ strokeDasharray: "0 471" }}
                                                animate={{ strokeDasharray: `${(healthScore / 100) * 471} 471` }}
                                                transition={{ duration: 2, ease: "circOut" }}
                                            />
                                        </svg>
                                        <div className={styles.healthValue}>
                                            <span className="text-5xl font-black text-black tracking-tighter">{healthScore}</span>
                                            <span className="text-[10px] font-black text-black uppercase tracking-[0.3em] mt-1">Score</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 text-center px-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                                        Current Assessment
                                    </p>
                                    <p className="text-sm font-black text-black mt-2 uppercase">
                                        {healthScore > 80 ? 'Excellent Status • Optimal Flow' : healthScore > 60 ? 'Healthy • Standard Operation' : 'Action Required • Review Strategy'}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Top Merchants</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.3, 1],
                                                    opacity: [1, 0, 1],
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"
                                            />
                                            <Store size={20} className="text-indigo-500" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {merchantData.length > 0 ? merchantData.map((m, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all rounded-lg">
                                            <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-lg">🏪</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[13px] font-black uppercase tracking-tight text-slate-800">{m.name}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.count} Txs</span>
                                                </div>
                                                <p className="text-sm font-black text-black mt-1">{formatCurrency(m.amount)}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 opacity-30">
                                            <Store size={40} className="mx-auto mb-3" />
                                            <p className="text-xs font-black uppercase">Scanning Ecosystem...</p>
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
                                <h3 className={styles.sectionTitle}>Digital Vault</h3>
                                <button onClick={openAddCard} className="w-8 h-8 flex items-center justify-center border-4 border-black bg-white rounded-none hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000000]">
                                    <Plus size={16} strokeWidth={4} />
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
                                    <div className="text-center py-16 w-full border-4 border-black rounded-none bg-white shadow-[8px_8px_0px_#000000]">
                                        <div className="relative mb-6 flex justify-center">
                                            <CreditCard size={48} className="text-black" />
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black">VAULT_EMPTY</p>
                                        <button onClick={openAddCard} className="mt-6 text-[10px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white border-2 border-black px-4 py-2 transition-all">
                                            + Initialize New Card
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Recent Pulse</h3>
                                <Link to="/transactions">
                                    <ArrowRight size={18} className="text-slate-400 hover:text-rose-600" />
                                </Link>
                            </div>
                            <div className="space-y-1">
                                {recentTransactions.length > 0 ? recentTransactions.map((tx, i) => (
                                    <div key={tx.id} className={styles.txRow}>
                                        <div className={styles.txIcon}>{getCategoryIcon(tx.category)}</div>
                                        <div className={styles.txDetails}>
                                            <p className={styles.txDesc}>{tx.description || 'System Event'}</p>
                                            <p className={styles.txCat}>{tx.category}</p>
                                        </div>
                                        <div className={cn(styles.txAmount, tx.type === 'expense' ? 'text-slate-600' : 'text-violet-500')}>
                                            {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Receipt size={40} className="mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">Quiet Period</p>
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
                    <DialogHeader className="px-6 pt-6 pb-4 bg-white border-b-2 border-black">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 rounded-none">
                                <CreditCard className="text-rose-600" size={24} />
                            </div>
                            <span className="font-bold text-slate-800">Card Details</span>
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
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-none">
                                    <span className="text-sm text-slate-500">Card Number</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold">**** **** **** {selectedCard.last4}</span>
                                        <button
                                            onClick={() => handleCopy(selectedCard.last4 || '')}
                                            className="p-1.5 hover:bg-slate-200 rounded-none transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-none">
                                    <span className="text-sm text-slate-500">Card Holder</span>
                                    <span className="font-semibold">{selectedCard.holder}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-none">
                                    <span className="text-sm text-slate-500">Expires</span>
                                    <span className="font-semibold">{selectedCard.expiry}</span>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-none text-green-700">
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
                                    className="flex-1 py-3 px-4 bg-violet-500 text-white font-semibold rounded-none hover:bg-violet-600 transition-colors"
                                >
                                    Manage Cards
                                </button>
                                <button
                                    onClick={handleDeleteCard}
                                    className="p-3 bg-red-50 text-red-600 rounded-none hover:bg-red-100 transition-colors"
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
