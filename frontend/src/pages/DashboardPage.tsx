// Cashly Dashboard - Premium Modern SaaS Finance Dashboard
// Midnight Coral Theme - Light Mode
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Receipt, BarChart3, Target, Calendar, PiggyBank, ArrowRight, Share2, TrendingUp, TrendingDown, Sparkles, Filter, MoreHorizontal, ShoppingCart, Store, Heart, Wallet, Activity, Eye, EyeOff, Zap } from 'lucide-react';
import PremiumCard from '../components/PremiumCard';
import MoneyTwinPulse from '../components/dashboard/MoneyTwinPulse';
import ExtensionStatsCard from '../components/ExtensionStatsCard';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import LoadingScreen from '../components/LoadingScreen';
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
                        color: ['#2563EB', '#64748B', '#8B5CF6', '#3B82F6', '#0D9488', '#F43F5E'][idx % 6]
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
                // Factors: Streak (30%), Budget Adherence (40%), Savings Rate (30%)
                const streakPoints = Math.min(100, streakData.currentStreak * 10);
                const budgetPoints = 100 - budgetPercentage; // Lower usage is better for score
                const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
                const score = Math.round((streakPoints * 0.3) + (budgetPoints * 0.4) + (Math.max(0, savingsRate) * 0.3));
                setHealthScore(score || 72); // Default to a decent score if new user

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

    if (loading) return <LoadingScreen />;

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
                        <p>Ecosystem Pulse • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Vault Status</span>
                            <span className="text-xs font-bold text-teal-500 flex items-center gap-1">
                                <Activity size={12} /> SECURED & ACTIVE
                            </span>
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
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <Wallet size={20} />
                            </motion.div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={styles.statTitle}>{stats.totalBalance >= 0 ? 'Total Liquidity' : 'Cumulative Spend'}</p>
                                <h2 className={styles.value}>
                                    {showBalance ? formatCurrency(Math.abs(stats.totalBalance)) : '••••••'}
                                </h2>
                            </div>
                            <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-colors">
                                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                        <div className={styles.statTrend}>
                            <TrendingUp size={12} /> <span>{Math.abs(stats.balanceTrend)}% SAVINGS RATE</span>
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
                                    y: [0, -3, 0],
                                    scale: [1, 1.05, 1],
                                    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <TrendingUp size={20} />
                            </motion.div>
                        </div>
                        <p className={styles.statTitle}>Monthly Inflow</p>
                        <h2 className={styles.value}>{formatCurrency(stats.monthlyIncome)}</h2>
                        <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">Current Interval</p>
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
                        <p className={styles.statTitle}>Monthly Outflow</p>
                        <h2 className={styles.value}>{formatCurrency(stats.monthlyExpense)}</h2>
                        <div className={cn(styles.statTrend, stats.expenseTrend <= 0 ? styles.trendUp : styles.trendDown)}>
                            {stats.expenseTrend <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                            <span>{Math.abs(stats.expenseTrend)}% VS LAST MONTH</span>
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
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.15, 1],
                                    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <Zap size={20} strokeWidth={2.5} />
                            </motion.div>
                        </div>
                        <p className={styles.statTitle}>Usage Streak</p>
                        <h2 className={styles.value}>{stats.streakDays} Days 🔥</h2>
                        <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">Consistent Tracking</p>
                    </motion.div>
                </div>

                {/* Main Content Layout */}
                <div className={styles.mainLayout}>
                    {/* Left Column */}
                    <div className="space-y-6">
                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Spending Velocity</h3>
                                <Link to="/analytics" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                    Deep Analysis <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                                <stop offset="50%" stopColor="#2563eb" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                                            tickFormatter={(v) => `$\${v}`}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white/90 backdrop-blur-md border-[3px] border-slate-200/50 p-4 rounded-2xl shadow-2xl">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">
                                                                {payload[0].payload.day}'s Pulse
                                                            </p>
                                                            {payload.map((entry, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 mt-1">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                    <span className="text-xs font-bold text-slate-500">{entry.name}:</span>
                                                                    <span className="text-sm font-black text-slate-800">{formatCurrency(entry.value as number)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#2563eb"
                                            strokeWidth={4}
                                            fill="url(#incomeGradient)"
                                            name="Inflow"
                                            animationDuration={2000}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb', className: 'animate-pulse' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#94a3b8"
                                            strokeWidth={3}
                                            fill="url(#expenseGradient)"
                                            strokeDasharray="5 5"
                                            name="Outflow"
                                            animationDuration={2500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <h3 className={cn(styles.sectionTitle, "mb-6")}>Top Categories</h3>
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
                                            className="text-center py-10 w-full relative"
                                        >
                                            {/* Premium Ripple Animation */}
                                            <div className="relative mb-8 flex justify-center">
                                                <motion.div
                                                    className="absolute w-20 h-20 bg-slate-200/50 rounded-full"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                                                />
                                                <motion.div
                                                    className="absolute w-20 h-20 bg-slate-200/50 rounded-full"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2 }}
                                                />
                                                <motion.div
                                                    animate={{
                                                        y: [0, -6, 0],
                                                        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                                    }}
                                                    className="relative z-10 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-lg"
                                                >
                                                    <ShoppingCart size={36} className="text-slate-300" />
                                                </motion.div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Expense Records</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </motion.div>

                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Budget Usage</h3>
                                    <Link to="/budgets">
                                        <Target size={18} className="text-slate-400 hover:text-blue-600 transition-colors" />
                                    </Link>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4">
                                    {budgetProgress.total > 0 ? (
                                        <>
                                            <div className="relative w-40 h-40 mb-6">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                                    <motion.circle
                                                        cx="80" cy="80" r="70"
                                                        stroke={budgetProgress.percentage > 90 ? '#f43f5e' : budgetProgress.percentage > 70 ? '#f59e0b' : '#2563eb'}
                                                        strokeWidth="12" fill="none" strokeLinecap="round"
                                                        initial={{ strokeDasharray: "0 440" }}
                                                        animate={{ strokeDasharray: `${(budgetProgress.percentage / 100) * 440} 440` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black text-slate-800">{budgetProgress.percentage}%</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Utilized</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">
                                                {formatCurrency(budgetProgress.used)} <span className="text-slate-400 font-medium">of</span> {formatCurrency(budgetProgress.total)}
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
                                                    className="absolute w-24 h-24 bg-blue-500/10 rounded-full"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                                                />
                                                <motion.div
                                                    className="absolute w-24 h-24 bg-blue-500/10 rounded-full"
                                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
                                                />
                                                <motion.div
                                                    animate={{
                                                        y: [0, -8, 0],
                                                        scale: [1, 1.05, 1],
                                                        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                                    }}
                                                    className="relative z-10 p-5 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-slate-100/50 shadow-xl"
                                                >
                                                    <Target size={44} className="text-blue-600/40" />
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
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
                                                >
                                                    SET LIMIT
                                                    <Plus size={14} />
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
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                    >
                                        <Heart size={18} className="text-rose-500" />
                                    </motion.div>
                                </div>
                                <div className={styles.healthGauge}>
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="90" cy="90" r="75" stroke="#f8fafc" strokeWidth="14" fill="none" />
                                        <motion.circle
                                            cx="90" cy="90" r="75"
                                            stroke="url(#healthGradient)"
                                            strokeWidth="14" fill="none" strokeLinecap="round"
                                            initial={{ strokeDasharray: "0 471" }}
                                            animate={{ strokeDasharray: `${(healthScore / 100) * 471} 471` }}
                                            transition={{ duration: 2, ease: "circOut" }}
                                        />
                                        <defs>
                                            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#14B8A6" />
                                                <stop offset="100%" stopColor="#2563EB" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className={styles.healthValue}>
                                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{healthScore}</span>
                                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Score</span>
                                    </div>
                                </div>
                                <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-tighter">
                                    {healthScore > 80 ? 'Excellent Status • Keeping it up!' : healthScore > 60 ? 'Healthy • Room for growth' : 'Action Required • Check advice'}
                                </p>
                            </motion.div>

                            <motion.div variants={itemVariants} className={styles.whiteCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.sectionTitle}>Top Merchants</h3>
                                    <motion.div
                                        animate={{
                                            rotate: [0, 10, -10, 0],
                                            transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                    >
                                        <Store size={18} className="text-indigo-500" />
                                    </motion.div>
                                </div>
                                <div className="space-y-3">
                                    {merchantData.length > 0 ? merchantData.map((m, i) => (
                                        <div key={i} className={styles.merchantItem}>
                                            <div className={styles.merchantIcon}>🏪</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-slate-700">{m.name}</span>
                                                    <span className={styles.merchantCount}>{m.count} Txs</span>
                                                </div>
                                                <p className="text-xs font-black text-blue-600 mt-1">{formatCurrency(m.amount)}</p>
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
                                <button onClick={openAddCard} className="p-2 bg-slate-50 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {userCards.length > 0 ? userCards.slice(0, 2).map((card, i) => (
                                    <PremiumCard
                                        key={card.id}
                                        card={{
                                            ...card,
                                            type: card.card_type // Map card_type to type for PremiumCard
                                        } as any}
                                        onClick={() => { }} // Could link to cards page
                                    />
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <CreditCard size={40} className="mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">No Cards Linked</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className={styles.whiteCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.sectionTitle}>Recent Pulse</h3>
                                <Link to="/transactions">
                                    <ArrowRight size={18} className="text-slate-400 hover:text-blue-600" />
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
                                        <div className={cn(styles.txAmount, tx.type === 'expense' ? 'text-slate-600' : 'text-blue-600')}>
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
                                    <motion.div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl" whileHover={{ scale: 1.1, rotate: 10 }}><Target size={20} /></motion.div>
                                    <span className={styles.actionLabel}>Budgets</span>
                                </Link>
                                <Link to="/goals" className={styles.actionBtn}>
                                    <motion.div className="p-3 bg-violet-50 text-violet-600 rounded-xl" whileHover={{ scale: 1.1, rotate: -10 }}><PiggyBank size={20} /></motion.div>
                                    <span className={styles.actionLabel}>Goals</span>
                                </Link>
                                <Link to="/analytics" className={styles.actionBtn}>
                                    <motion.div className="p-3 bg-blue-50 text-blue-600 rounded-xl" whileHover={{ scale: 1.1, y: -5 }}><BarChart3 size={20} /></motion.div>
                                    <span className={styles.actionLabel}>Trends</span>
                                </Link>
                                <Link to="/subscriptions" className={styles.actionBtn}>
                                    <motion.div className="p-3 bg-amber-50 text-amber-600 rounded-xl" whileHover={{ scale: 1.1, x: 5 }}><Calendar size={20} /></motion.div>
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
        </div>
    );
};

export default DashboardPage;
