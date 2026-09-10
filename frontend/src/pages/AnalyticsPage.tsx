// AnalyticsPage — Calm Finance spending charts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Sector
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Store, Calendar, RefreshCw,
    ArrowUpRight, BarChart3, PieChart as PieIcon, Activity, ArrowRight, Zap, Target
} from 'lucide-react';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { FINANCIAL_DATA_EVENTS } from '../services/financialDataEvents';
import { AnalyticsSkeleton } from '../components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import styles from './AnalyticsPage.module.css';

const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#78716C',
    'Food & Dining': '#78716C',
    'Shopping': '#E11D48',
    'Transport': '#57534E',
    'Entertainment': '#BE123C',
    'Bills & Utilities': '#A8A29E',
    'Health': '#E11D48',
    'Travel': '#1C1917',
    'Income': '#059669',
    'Other': '#A8A29E',
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 12}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke="#E7E5E4"
            strokeWidth={1}
        />
    );
};

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

    useEffect(() => {
        const handleRefresh = () => fetchData(true);
        window.addEventListener('analytics-data-changed', handleRefresh);
        FINANCIAL_DATA_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleRefresh);
        });

        return () => {
            window.removeEventListener('analytics-data-changed', handleRefresh);
            FINANCIAL_DATA_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleRefresh);
            });
        };
    }, [fetchData]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
                    t.amount > 1000;
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
                fill: CATEGORY_COLORS[name] || '#64748b',
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
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Zap className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Analytics
                                <div className={styles.liveBadge}>
                                    <div className={styles.pulseDot}></div>
                                    Live
                                </div>
                            </h1>
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
                                    {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'Year'}
                                </button>
                            ))}
                        </div>

                        <button
                            className={styles.refreshCircle}
                            onClick={() => fetchData()}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn("h-6 w-6", isRefreshing && styles.spinning)} strokeWidth={3} />
                        </button>
                    </div>
                </header>

                {/* Hero Stats Section */}
                <div className={styles.heroStats}>
                    <motion.div className={styles.mainHeroCard} variants={fadeInUp}>
                        <div className={styles.heroIcon}>
                            <Target className="h-9 w-9" strokeWidth={3} />
                        </div>
                        <div>
                            <span className={styles.heroLabel}>Spent this {timeRange}</span>
                            <div className="flex items-center gap-6">
                                <h2 className={styles.heroValue}>{formatCurrency(totalSpent)}</h2>
                                <div className={cn(styles.heroTrend, changePercent >= 0 ? styles.trendDown : styles.trendUp)}>
                                    {changePercent >= 0 ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                                    {Math.abs(changePercent).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className={styles.miniStatsContainer}>
                        {[
                            { label: 'Average purchase', value: formatCurrency(avgTicket), icon: <Activity strokeWidth={2} /> },
                            { label: 'Merchants', value: uniqueStores, icon: <Store strokeWidth={2} /> },
                            { label: 'Purchases', value: filteredTx.length, icon: <Calendar strokeWidth={2} /> }
                        ].map((stat, i) => (
                            <motion.div key={i} className={styles.premiumMiniCard} variants={fadeInUp}>
                                <div className={styles.miniIconBox}>
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
                    <motion.div className={cn(styles.visualCard, styles.fullWidth)} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Spending</h3>
                                <p className={styles.cardSubtitle}>Online vs in store</p>
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
                                    In store
                                </button>
                            </div>
                        </div>
                        <div style={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#E7E5E4" strokeWidth={1} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#78716C"
                                        fontSize={12}
                                        fontWeight={500}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#E11D48', strokeWidth: 1 }}
                                        contentStyle={{
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #E7E5E4',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            color: '#1C1917',
                                            boxShadow: '0 8px 24px rgba(28,25,23,0.06)'
                                        }}
                                        itemStyle={{ color: '#1C1917', fontWeight: 600, textTransform: 'none' }}
                                        formatter={(val: number) => [formatCurrency(val), activeChart === 'online' ? 'Online' : 'In store']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={activeChart}
                                        stroke="#E11D48"
                                        strokeWidth={2}
                                        fill="#E11D48"
                                        fillOpacity={0.12}
                                        animationDuration={800}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Categories</h3>
                                <p className={styles.cardSubtitle}>Where the money went</p>
                            </div>
                            <PieIcon size={24} className="text-black" strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-h-[350px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={activeCategoryIndex}
                                        activeShape={renderActiveShape}
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={90}
                                        outerRadius={120}
                                        dataKey="value"
                                        onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                                        animationDuration={800}
                                        stroke="#E7E5E4"
                                        strokeWidth={1}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-semibold">
                                    {categoryData[activeCategoryIndex] ? formatCurrency(categoryData[activeCategoryIndex].value) : '$0'}
                                </span>
                                <span className="mt-2 rounded-full bg-[#F4F0EB] px-2.5 py-0.5 text-xs font-medium text-[#57534E]">
                                    {categoryData[activeCategoryIndex]?.name || 'None'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>This week vs last week</h3>
                                <p className={styles.cardSubtitle}>Weekday comparison</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid vertical={false} stroke="#E7E5E4" strokeWidth={1} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716C', fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: '#E11D48', opacity: 0.08 }}
                                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', borderRadius: 12, color: '#1C1917' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Bar dataKey="thisWeek" name="This week" fill="#1C1917" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="lastWeek" name="Last week" fill="#E11D48" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Top Merchants Section */}
                <motion.div className={styles.merchantsSection} variants={fadeInUp}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={styles.cardH3}>Top merchants</h3>
                            <p className={styles.cardSubtitle}>Where you spend most</p>
                        </div>
                        <ArrowUpRight size={28} className="text-black" strokeWidth={4} />
                    </div>

                    <div className={styles.merchantGrid}>
                        {topMerchants.length > 0 ? (
                            topMerchants.map((merchant, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.merchantTile}
                                    whileHover={{ x: 10 }}
                                >
                                    <div className={styles.rankCircle}>{i + 1}</div>
                                    <div className={styles.merchantInfo}>
                                        <span className={styles.mName}>{merchant.name}</span>
                                        <span className={styles.mCount}>{merchant.count} purchases</span>
                                    </div>
                                    <div className={styles.mAmount}>{formatCurrency(merchant.amount)}</div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-[var(--r-lg)] border border-dashed border-[var(--border)] py-16 text-center text-sm text-[var(--text-muted)]">
                                No merchant data yet
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AnalyticsPage;
