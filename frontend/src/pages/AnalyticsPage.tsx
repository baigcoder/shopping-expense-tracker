import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Sector
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Store, Calendar, RefreshCw,
    ArrowUpRight, BarChart3, PieChart as PieIcon, Activity, ArrowRight
} from 'lucide-react';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { useDataRealtime } from '../hooks/useDataRealtime';
import { AnalyticsSkeleton } from '../components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import styles from './AnalyticsPage.module.css';

const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#3b82f6',
    'Food & Dining': '#3b82f6',
    'Shopping': '#6366f1',
    'Transport': '#8b5cf6',
    'Entertainment': '#ec4899',
    'Bills & Utilities': '#14b8a6',
    'Health': '#ef4444',
    'Travel': '#f59e0b',
    'Income': '#10b981',
    'Other': '#94a3b8',
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 10}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={4}
        />
    );
};

// Animation Variants
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 100 } }
};

const AnalyticsPage = () => {
    const { user } = useAuthStore();
    const sound = useSound();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
    const [activeChart, setActiveChart] = useState<'online' | 'instore'>('online');
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const fetchData = useCallback(async (silent = false) => {
        if (!user?.id) return;
        if (!silent) setIsRefreshing(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
            if (loading && !silent) sound.playSuccess();
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id, loading, sound]);

    useDataRealtime({
        onAnalyticsRefresh: () => fetchData(true)
    });

    useEffect(() => {
        const handleRefresh = () => fetchData(true);
        window.addEventListener('analytics-data-changed', handleRefresh);
        return () => window.removeEventListener('analytics-data-changed', handleRefresh);
    }, [fetchData]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Data Filtering & Calculations
    const filteredTx = useMemo(() => {
        const now = new Date();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            switch (timeRange) {
                case 'week': return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                case 'year': return d.getFullYear() === now.getFullYear();
                default: return true;
            }
        });
    }, [transactions, timeRange]);

    const totalSpent = useMemo(() => filteredTx.reduce((sum, t) => sum + t.amount, 0), [filteredTx]);
    const avgTicket = useMemo(() => filteredTx.length > 0 ? totalSpent / filteredTx.length : 0, [filteredTx, totalSpent]);
    const uniqueStores = useMemo(() => new Set(filteredTx.map(t => t.description)).size, [filteredTx]);

    const changePercent = useMemo(() => {
        const now = new Date();
        const prevTotal = transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            if (timeRange === 'month') {
                const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
            }
            return false;
        }).reduce((sum, t) => sum + t.amount, 0);
        return prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;
    }, [transactions, totalSpent, timeRange]);

    // Charts Data
    const chartData = useMemo(() => {
        const dailyData: Record<string, { online: number; instore: number }> = {};
        const now = new Date();
        const daysToShow = timeRange === 'week' ? 7 : 30;

        for (let i = daysToShow; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyData[key] = { online: 0, instore: 0 };
        }

        transactions.filter(t => t.type === 'expense').forEach(t => {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (dailyData[dateKey]) {
                const isOnline = t.description?.toLowerCase().includes('amazon') ||
                    t.description?.toLowerCase().includes('online') ||
                    t.amount > 1000; // Heuristic
                if (isOnline) dailyData[dateKey].online += t.amount;
                else dailyData[dateKey].instore += t.amount;
            }
        });

        return Object.entries(dailyData).map(([date, values]) => ({
            date,
            online: values.online,
            instore: values.instore,
        }));
    }, [transactions, timeRange]);

    const categoryData = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        filteredTx.forEach(t => {
            const cat = (t.category as any)?.name || (typeof t.category === 'string' ? t.category : 'Other');
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });
        return Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
                name,
                value,
                fill: CATEGORY_COLORS[name] || '#94A3B8',
            }));
    }, [filteredTx]);

    const weeklyData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = days.map(day => ({ day, thisWeek: 0, lastWeek: 0 }));
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        transactions.filter(t => t.type === 'expense').forEach(t => {
            const d = new Date(t.date);
            const dayIndex = (d.getDay() + 6) % 7;
            if (d >= weekAgo) data[dayIndex].thisWeek += t.amount;
            else if (d >= twoWeeksAgo) data[dayIndex].lastWeek += t.amount;
        });
        return data;
    }, [transactions]);

    const topMerchants = useMemo(() => {
        const stores: Record<string, { count: number; amount: number }> = {};
        filteredTx.forEach(t => {
            const store = t.description || 'Unknown';
            if (!stores[store]) stores[store] = { count: 0, amount: 0 };
            stores[store].count++;
            stores[store].amount += t.amount;
        });
        return Object.entries(stores)
            .map(([name, data]) => ({ name: name.length > 18 ? name.slice(0, 15) + '...' : name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8);
    }, [filteredTx]);

    if (loading) {
        return (
            <div className={styles.mainContent}>
                <AnalyticsSkeleton />
            </div>
        );
    }
    return (
        <div className={styles.mainContent}>
            <motion.div
                className={styles.contentArea}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* Glass Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Analytics & Trends
                                <div className={styles.liveBadge}>
                                    <div className={styles.pulseDot}></div>
                                    LIVE FEED
                                </div>
                            </h1>
                            <p className="text-muted-foreground text-sm font-medium">
                                Visualizing your financial journey
                            </p>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.premiumTabs}>
                            {(['week', 'month', 'year'] as const).map((range) => (
                                <button
                                    key={range}
                                    className={cn(styles.tabBtn, timeRange === range && styles.tabActive)}
                                    onClick={() => { setTimeRange(range); sound.playClick(); }}
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </button>
                            ))}
                        </div>

                        <button
                            className={styles.refreshCircle}
                            onClick={() => fetchData()}
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                        </button>
                    </div>
                </header>

                {/* Hero Stats Section */}
                <div className={styles.heroStats}>
                    <motion.div className={styles.mainHeroCard} variants={fadeInUp}>
                        <div className={styles.heroMesh} />
                        <div className={styles.heroIcon}>
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <span className={styles.heroLabel}>Total Spent {timeRange === 'month' ? 'Current Month' : timeRange}</span>
                            <div className="flex items-center gap-4">
                                <h2 className={styles.heroValue}>{formatCurrency(totalSpent)}</h2>
                                <div className={cn(styles.heroTrend, changePercent >= 0 ? styles.trendDown : styles.trendUp)}>
                                    {changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(changePercent).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className={styles.miniStatsContainer}>
                        {[
                            { label: 'Avg Order', value: formatCurrency(avgTicket), icon: <Activity />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                            { label: 'Merchants', value: uniqueStores, icon: <Store />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
                            { label: 'Transactions', value: filteredTx.length, icon: <Calendar />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' }
                        ].map((stat, i) => (
                            <motion.div key={i} className={styles.premiumMiniCard} variants={fadeInUp}>
                                <div className={styles.miniIconBox} style={{ background: stat.bg, color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className={styles.miniLabel}>{stat.label}</span>
                                    <span className={styles.miniValueText}>{stat.value}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Main Charts Grid */}
                <div className={styles.chartsGrid}>
                    {/* Area Chart: Spending Trend */}
                    <motion.div className={cn(styles.visualCard, styles.fullWidth)} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Spending Trend</h3>
                                <p className={styles.cardSubtitle}>Insight into online vs in-store activity</p>
                            </div>
                            <div className={styles.premiumTabs}>
                                <button
                                    className={cn(styles.tabBtn, activeChart === 'online' && styles.tabActive)}
                                    onClick={() => setActiveChart('online')}
                                >
                                    Online
                                </button>
                                <button
                                    className={cn(styles.tabBtn, activeChart === 'instore' && styles.tabActive)}
                                    onClick={() => setActiveChart('instore')}
                                >
                                    In-Store
                                </button>
                            </div>
                        </div>
                        <div style={{ height: 350, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94A3B8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        formatter={(val: number) => [formatCurrency(val), activeChart === 'online' ? 'Online' : 'In-Store']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={activeChart}
                                        stroke="#2563EB"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#gradientPrimary)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Pie Chart: Categories */}
                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Category Breakdown</h3>
                                <p className={styles.cardSubtitle}>Distribution of top expenses</p>
                            </div>
                            <PieIcon size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={activeCategoryIndex}
                                        activeShape={renderActiveShape}
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={85}
                                        outerRadius={105}
                                        dataKey="value"
                                        onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                                        animationBegin={200}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black" style={{ color: categoryData[activeCategoryIndex]?.fill }}>
                                    {categoryData[activeCategoryIndex] ? formatCurrency(categoryData[activeCategoryIndex].value) : '$0'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                    {categoryData[activeCategoryIndex]?.name || 'Total'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bar Chart: Weekly */}
                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Weekly Activity</h3>
                                <p className={styles.cardSubtitle}>Current Week vs Prior</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Bar dataKey="thisWeek" name="This Week" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="lastWeek" name="Last Week" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Top Merchants Section */}
                <motion.div className={styles.merchantsSection} variants={fadeInUp}>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className={styles.cardH3}>Top Merchants</h3>
                            <p className={styles.cardSubtitle}>Leading destinations for your spending</p>
                        </div>
                        <ArrowRight size={20} className="text-slate-400" />
                    </div>

                    <div className={styles.merchantGrid}>
                        {topMerchants.length > 0 ? (
                            topMerchants.map((merchant, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.merchantTile}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className={styles.rankCircle}>{i + 1}</div>
                                    <div className={styles.merchantInfo}>
                                        <span className={styles.mName}>{merchant.name}</span>
                                        <span className={styles.mCount}>{merchant.count} visits</span>
                                    </div>
                                    <div className={styles.mAmount}>{formatCurrency(merchant.amount)}</div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                                No merchant activity discovered yet.
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AnalyticsPage;
