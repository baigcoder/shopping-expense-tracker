// Cashly Dashboard - Premium Modern SaaS Finance Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Wallet, Activity, PiggyBank,
    CreditCard, ArrowUpRight, Sparkles, Plus, Eye, EyeOff,
    Target, Bell, ArrowRight, Receipt, BarChart3, Zap,
    ChevronRight, Calendar, DollarSign, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MoneyTwinPulse from '../components/dashboard/MoneyTwinPulse';
import ExtensionStatsCard from '../components/ExtensionStatsCard';
import { toast } from 'react-toastify';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
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

// Cashly theme colors for charts - Premium Indigo Theme
const CHART_COLORS = {
    primary: '#2563EB',   // Indigo for primary/income
    secondary: '#64748B', // Slate for expenses/secondary
    accent: '#8B5CF6',    // Violet
    info: '#3B82F6',      // Blue
    pink: '#F43F5E',
    teal: '#0D9488'
};

const CATEGORY_COLORS = ['#2563EB', '#64748B', '#8B5CF6', '#3B82F6', '#0D9488', '#F43F5E'];


// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
                    .map(([name, value], idx) => ({ name, value, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                setCategoryData(categoryArr);

                // Budget progress
                const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
                setBudgetProgress({
                    used: monthlyExpense,
                    total: totalBudget,
                    percentage: totalBudget > 0 ? Math.min(100, Math.round((monthlyExpense / totalBudget) * 100)) : 0
                });

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
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-background">
            <motion.div
                className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'} 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </motion.div>

                {/* Stats Cards - Bento Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Balance / Total Spend */}
                    <Card className="col-span-2 md:col-span-1 card-hover bg-primary border-none shadow-lg shadow-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-white/90 flex items-center justify-between">
                                {stats.totalBalance >= 0 ? 'Total Balance' : 'Total Spend'}
                                <button
                                    onClick={() => { setShowBalance(!showBalance); soundManager.play('click'); }}
                                    className="p-1 hover:bg-white/20 rounded text-white/80 transition-colors"
                                >
                                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                {showBalance ? formatCurrency(Math.abs(stats.totalBalance)) : '••••••'}
                            </div>
                            <div className="text-xs flex items-center gap-1 mt-2 text-white/80">
                                <TrendingUp className="h-3 w-3" />
                                <span>{Math.abs(stats.balanceTrend)}% savings rate</span>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Monthly Income */}
                    <Card className="card-hover border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-50">
                                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyIncome)}</div>
                            <p className="text-xs text-muted-foreground mt-1">This month</p>
                        </CardContent>
                    </Card>


                    {/* Monthly Expenses */}
                    <Card className="card-hover border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-slate-100">
                                    <TrendingDown className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyExpense)}</div>
                            <div className={cn("text-xs flex items-center gap-1 mt-1",
                                stats.expenseTrend <= 0 ? "text-blue-600" : "text-amber-600")}>
                                {stats.expenseTrend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                <span>{Math.abs(stats.expenseTrend)}% vs last month</span>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Streak */}
                    <Card className="card-hover bg-indigo-50/30 border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-50">
                                    <Zap className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                                Streak
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-indigo-600">{stats.streakDays} days 🔥</div>
                            <p className="text-xs text-muted-foreground mt-1">Keep tracking!</p>
                        </CardContent>
                    </Card>

                </motion.div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Spending Trend Chart */}
                        <motion.div variants={itemVariants}>
                            <Card className="card-hover">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="font-display">Spending Trend</CardTitle>
                                            <CardDescription>Income vs Expenses over last 14 days</CardDescription>
                                        </div>
                                        <Link to="/analytics">
                                            <Button variant="ghost" size="sm">
                                                View All <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis
                                                    dataKey="day"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `$${value}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                                                    }}
                                                    formatter={(value: number) => [formatCurrency(value), '']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="income"
                                                    stroke={CHART_COLORS.primary}
                                                    strokeWidth={2}
                                                    fill="url(#incomeGradient)"
                                                    name="Income"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="expense"
                                                    stroke={CHART_COLORS.secondary}
                                                    strokeWidth={2}
                                                    fill="url(#expenseGradient)"
                                                    name="Expense"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <span className="text-sm text-muted-foreground font-medium">Income</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-400" />
                                            <span className="text-sm text-muted-foreground font-medium">Expenses</span>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Category Breakdown & Budget */}
                        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <Card className="card-hover">
                                <CardHeader>
                                    <CardTitle className="font-display">Top Categories</CardTitle>
                                    <CardDescription>Where your money goes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {categoryData.length > 0 ? (
                                        <div className="space-y-4">
                                            {categoryData.map((cat, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="text-xl">{getCategoryIcon(cat.name)}</div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium">{cat.name}</span>
                                                            <span className="text-sm text-muted-foreground">{formatCurrency(cat.value)}</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.min(100, (cat.value / (categoryData[0]?.value || 1)) * 100)}%`,
                                                                    backgroundColor: cat.color
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No expenses yet</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Budget Progress */}
                            <Card className="card-hover">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="font-display">Budget</CardTitle>
                                            <CardDescription>Monthly spending limit</CardDescription>
                                        </div>
                                        <Link to="/budgets">
                                            <Button variant="ghost" size="sm">
                                                <Target className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {budgetProgress.total > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center">
                                                <div className="relative w-32 h-32">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle
                                                            cx="64"
                                                            cy="64"
                                                            r="56"
                                                            stroke="hsl(var(--muted))"
                                                            strokeWidth="10"
                                                            fill="none"
                                                        />
                                                        <circle
                                                            cx="64"
                                                            cy="64"
                                                            r="56"
                                                            stroke={budgetProgress.percentage > 90 ? '#EF4444' : budgetProgress.percentage > 70 ? '#F59E0B' : '#2563EB'}
                                                            strokeWidth="10"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${budgetProgress.percentage * 3.52} 352`}
                                                            className="transition-all duration-1000"
                                                        />
                                                    </svg>

                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-2xl font-bold">{budgetProgress.percentage}%</span>
                                                        <span className="text-xs text-muted-foreground">used</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-lg font-semibold">{formatCurrency(budgetProgress.used)} <span className="text-muted-foreground font-normal">of</span> {formatCurrency(budgetProgress.total)}</p>
                                                <p className="text-sm text-muted-foreground">{formatCurrency(budgetProgress.total - budgetProgress.used)} remaining</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground mb-3">No budget set</p>
                                            <Link to="/budgets">
                                                <Button size="sm" variant="outline">Create Budget</Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column - Cards & Transactions */}
                    <div className="space-y-6">
                        {/* Extension Tracking Stats */}
                        <motion.div variants={itemVariants}>
                            <ExtensionStatsCard />
                        </motion.div>

                        {/* Card Wallet */}
                        <motion.div variants={itemVariants}>
                            <Card className="card-hover overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-display">My Cards</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={openAddCard}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {userCards.length > 0 ? (
                                        userCards.slice(0, 2).map((card, i) => (
                                            <motion.div
                                                key={card.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={cn(
                                                    "p-4 rounded-xl text-white relative overflow-hidden",
                                                    i === 0 ? "bg-primary" : "bg-slate-800"
                                                )}
                                                style={card.theme ? { background: getBrandGradient(card.theme) } : {}}
                                            >

                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                                <div className="relative">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <CreditCard className="h-8 w-8 opacity-80" />
                                                        <span className="text-xs opacity-80 uppercase">{card.card_type || 'VISA'}</span>
                                                    </div>
                                                    <div className="font-mono text-lg tracking-wider mb-2">
                                                        •••• •••• •••• {card.number?.slice(-4) || '****'}
                                                    </div>
                                                    <div className="text-xs opacity-80">{card.holder || 'Card Holder'}</div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground mb-3">No cards added</p>
                                            <Button size="sm" variant="outline" onClick={openAddCard}>Add Card</Button>
                                        </div>
                                    )}
                                    {userCards.length > 2 && (
                                        <Link to="/cards" className="block">
                                            <Button variant="ghost" className="w-full text-muted-foreground">
                                                View all {userCards.length} cards <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Transactions */}
                        <motion.div variants={itemVariants}>
                            <Card className="card-hover">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-display">Recent Activity</CardTitle>
                                        <Link to="/transactions">
                                            <Button variant="ghost" size="sm">
                                                View All <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {recentTransactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentTransactions.map((tx, i) => (
                                                <motion.div
                                                    key={tx.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                                                        {getCategoryIcon(tx.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{tx.description || 'Transaction'}</p>
                                                        <p className="text-xs text-muted-foreground">{tx.category}</p>
                                                    </div>
                                                    <div className={cn("font-bold", tx.type === 'expense' ? 'text-slate-600' : 'text-blue-600')}>
                                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                                    </div>

                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No transactions yet</p>
                                            <Link to="/transactions" className="mt-2 inline-block">
                                                <Button size="sm" variant="link">Add your first transaction</Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={itemVariants}>
                            <Card className="card-hover bg-slate-50/50 border-slate-200/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="font-display flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link to="/budgets">
                                            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                                                <Target className="h-5 w-5" />
                                                <span className="text-xs">Budgets</span>
                                            </Button>
                                        </Link>
                                        <Link to="/goals">
                                            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                                                <PiggyBank className="h-5 w-5" />
                                                <span className="text-xs">Goals</span>
                                            </Button>
                                        </Link>
                                        <Link to="/analytics">
                                            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                                                <BarChart3 className="h-5 w-5" />
                                                <span className="text-xs">Analytics</span>
                                            </Button>
                                        </Link>
                                        <Link to="/subscriptions">
                                            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                                                <Calendar className="h-5 w-5" />
                                                <span className="text-xs">Subscriptions</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* AI Insights Section */}
                <motion.div variants={itemVariants} className="mt-6">
                    <MoneyTwinPulse userId={user?.id || ''} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default DashboardPage;
