// AnalyticsPage - Stark Gen Z Brutalist Intel Manager
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
    'Food': '#000000',
    'Food & Dining': '#000000',
    'Shopping': '#E11D48',
    'Transport': '#000000',
    'Entertainment': '#E11D48',
    'Bills & Utilities': '#000000',
    'Health': '#E11D48',
    'Travel': '#000000',
    'Income': '#000000',
    'Other': '#64748b',
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
            stroke="#000000"
            strokeWidth={2}
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
                {/* Brutalist Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Zap className="h-8 w-8" strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Analytics
                                <div className={styles.liveBadge}>
                                    <div className={styles.pulseDot}></div>
                                    STARK_INTEL
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
                                    {range.toUpperCase()}
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
                            <span className={styles.heroLabel}>Resource Depletion / {timeRange.toUpperCase()}</span>
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
                            { label: 'Avg Ticket', value: formatCurrency(avgTicket), icon: <Activity strokeWidth={3} /> },
                            { label: 'Identified Merchants', value: uniqueStores, icon: <Store strokeWidth={3} /> },
                            { label: 'Total Events', value: filteredTx.length, icon: <Calendar strokeWidth={3} /> }
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
                                <h3 className={styles.cardH3}>Spending Pulse</h3>
                                <p className={styles.cardSubtitle}>Online vs Ground Operations</p>
                            </div>
                            <div className={styles.premiumTabs}>
                                <button
                                    className={cn(styles.tabBtn, activeChart === 'online' && styles.tabActive)}
                                    onClick={() => setActiveChart('online')}
                                >
                                    ONLINE
                                </button>
                                <button
                                    className={cn(styles.tabBtn, activeChart === 'instore' && styles.tabActive)}
                                    onClick={() => setActiveChart('instore')}
                                >
                                    GROUND
                                </button>
                            </div>
                        </div>
                        <div style={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" strokeWidth={2} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#000000"
                                        fontSize={12}
                                        fontWeight={900}
                                        tickLine={true}
                                        axisLine={true}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#000000', strokeWidth: 4 }}
                                        contentStyle={{
                                            backgroundColor: '#000000',
                                            border: '4px solid #000000',
                                            borderRadius: '0px',
                                            padding: '12px',
                                            color: '#FFFFFF'
                                        }}
                                        itemStyle={{ color: '#FFFFFF', fontWeight: 900, textTransform: 'uppercase' }}
                                        formatter={(val: number) => [formatCurrency(val), activeChart.toUpperCase()]}
                                    />
                                    <Area
                                        type="stepAfter"
                                        dataKey={activeChart}
                                        stroke="#E11D48"
                                        strokeWidth={6}
                                        fill="#000000"
                                        fillOpacity={1}
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Category Sector</h3>
                                <p className={styles.cardSubtitle}>Resource Allocation Map</p>
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
                                        stroke="#000000"
                                        strokeWidth={4}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black italic">
                                    {categoryData[activeCategoryIndex] ? formatCurrency(categoryData[activeCategoryIndex].value) : '$0'}
                                </span>
                                <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 mt-2 uppercase">
                                    {categoryData[activeCategoryIndex]?.name || 'UNKNOWN'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className={styles.visualCard} variants={fadeInUp}>
                        <div className={styles.cardTop}>
                            <div>
                                <h3 className={styles.cardH3}>Mission Cycle</h3>
                                <p className={styles.cardSubtitle}>Weekly Execution Contrast</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeWidth={2} />
                                    <XAxis dataKey="day" axisLine={true} tickLine={true} tick={{ fontSize: 12, fill: '#000000', fontWeight: 900 }} />
                                    <Tooltip
                                        cursor={{ fill: '#E11D48', opacity: 0.1 }}
                                        contentStyle={{ backgroundColor: '#000000', border: 'none', borderRadius: 0, color: '#FFF' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Bar dataKey="thisWeek" name="Current" fill="#000000" stroke="#000000" strokeWidth={2} radius={0} />
                                    <Bar dataKey="lastWeek" name="Previous" fill="#E11D48" stroke="#000000" strokeWidth={2} radius={0} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Top Merchants Section */}
                <motion.div className={styles.merchantsSection} variants={fadeInUp}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={styles.cardH3}>Priority Merchants</h3>
                            <p className={styles.cardSubtitle}>High-frequency expenditure nodes</p>
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
                                        <span className={styles.mCount}>{merchant.count} EVENTS</span>
                                    </div>
                                    <div className={styles.mAmount}>{formatCurrency(merchant.amount)}</div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-4 border-dashed border-black/20 font-black uppercase text-black/20">
                                Zero Merchant Data Collected
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AnalyticsPage;
