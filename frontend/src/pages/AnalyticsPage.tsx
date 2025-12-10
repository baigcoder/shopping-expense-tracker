// Analytics Page - Real Supabase Data with Modern UI
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, Store,
    Calendar, RefreshCw, Loader2, ArrowUp, ArrowDown,
    Utensils, Car, Gamepad2, Zap, Heart, Plane, Home, Smartphone, Coffee, Wallet
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import styles from './AnalyticsPage.module.css';

// Category config
const CATEGORY_CONFIG: Record<string, { icon: any; color: string }> = {
    'Food & Dining': { icon: Utensils, color: '#FF6B6B' },
    'Shopping': { icon: ShoppingBag, color: '#4ECDC4' },
    'Transport': { icon: Car, color: '#FFE66D' },
    'Entertainment': { icon: Gamepad2, color: '#9D4EDD' },
    'Bills & Utilities': { icon: Zap, color: '#FF9F1C' },
    'Health': { icon: Heart, color: '#2EC4B6' },
    'Travel': { icon: Plane, color: '#A18CD1' },
    'Rent': { icon: Home, color: '#84FAB0' },
    'Tech': { icon: Smartphone, color: '#F093FB' },
    'Coffee': { icon: Coffee, color: '#8B4513' },
    'Other': { icon: Wallet, color: '#64748B' },
};

const AnalyticsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    // Fetch transactions
    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setIsRefreshing(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Listen for real-time updates from extension
    useEffect(() => {
        if (!user?.id) return;

        const handleNewTransaction = () => {
            console.log('📊 Analytics: Auto-refreshing after new transaction');
            fetchData();
        };

        // Listen for custom events and postMessage
        window.addEventListener('new-transaction', handleNewTransaction);
        window.addEventListener('transactions-synced', handleNewTransaction);

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.source === 'vibe-tracker-extension') {
                if (['TRANSACTION_ADDED', 'NEW_TRANSACTION', 'TRANSACTIONS_SYNCED'].includes(event.data.type)) {
                    handleNewTransaction();
                }
            }
        };
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('new-transaction', handleNewTransaction);
            window.removeEventListener('transactions-synced', handleNewTransaction);
            window.removeEventListener('message', handleMessage);
        };
    }, [user?.id, fetchData]);

    // Filter transactions by time range
    const getFilteredTransactions = () => {
        const now = new Date();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            switch (timeRange) {
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return d >= weekAgo;
                case 'month':
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                case 'year':
                    return d.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    };

    const filteredTx = getFilteredTransactions();

    // Calculate stats
    const stats = {
        totalSpent: filteredTx.reduce((sum, t) => sum + t.amount, 0),
        avgTicket: filteredTx.length > 0 ? filteredTx.reduce((sum, t) => sum + t.amount, 0) / filteredTx.length : 0,
        transactionCount: filteredTx.length,
        uniqueStores: new Set(filteredTx.map(t => t.description)).size,
    };

    // Top category
    const categoryTotals: Record<string, number> = {};
    filteredTx.forEach(t => {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Compare with previous period
    const getPreviousPeriodTotal = () => {
        const now = new Date();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            switch (timeRange) {
                case 'week':
                    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return d >= twoWeeksAgo && d < oneWeekAgo;
                case 'month':
                    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear();
                case 'year':
                    return d.getFullYear() === now.getFullYear() - 1;
                default:
                    return false;
            }
        }).reduce((sum, t) => sum + t.amount, 0);
    };

    const prevTotal = getPreviousPeriodTotal();
    const changePercent = prevTotal > 0 ? ((stats.totalSpent - prevTotal) / prevTotal) * 100 : 0;

    // Monthly chart data
    const getMonthlyData = () => {
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months[monthNames[d.getMonth()]] = 0;
        }

        transactions.filter(t => t.type === 'expense').forEach(t => {
            const d = new Date(t.date);
            const monthName = monthNames[d.getMonth()];
            if (months.hasOwnProperty(monthName)) {
                months[monthName] += t.amount;
            }
        });

        return Object.entries(months).map(([name, amount]) => ({ name, amount }));
    };

    // Category pie data
    const getCategoryData = () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#9D4EDD', '#FF9F1C', '#2EC4B6'];
        return Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value], index) => ({
                name: name.length > 10 ? name.slice(0, 10) + '...' : name,
                fullName: name,
                value,
                color: CATEGORY_CONFIG[name]?.color || colors[index % colors.length],
            }));
    };

    // Top stores/merchants
    const getTopStores = () => {
        const stores: Record<string, { count: number; amount: number }> = {};
        filteredTx.forEach(t => {
            const store = t.description || 'Unknown';
            if (!stores[store]) stores[store] = { count: 0, amount: 0 };
            stores[store].count++;
            stores[store].amount += t.amount;
        });
        return Object.entries(stores)
            .map(([name, data]) => ({ name: name.slice(0, 20), ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    };

    const monthlyData = getMonthlyData();
    const categoryData = getCategoryData();
    const topStores = getTopStores();

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <motion.div
                        className={styles.loaderCard}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        <span style={{ fontSize: '3rem' }}>📊</span>
                    </motion.div>
                    <p>crunching your numbers bestie<span className={styles.loadingDots}></span></p>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            {/* Header */}
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1>Money Stats 📊</h1>
                    <p>Your spending insights, visualized.</p>
                </div>
                <div className={styles.headerActions}>
                    {/* Time Range Selector */}
                    <div className={styles.timeSelector}>
                        {(['week', 'month', 'year'] as const).map(range => (
                            <button
                                key={range}
                                className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
                                onClick={() => setTimeRange(range)}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        className={styles.refreshBtn}
                        onClick={fetchData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                    </button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                {/* Total Spent */}
                <motion.div
                    className={styles.statCard}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#FFD93D' }}>
                            <DollarSign size={24} />
                        </div>
                        {changePercent !== 0 && (
                            <div className={`${styles.statChange} ${changePercent > 0 ? styles.up : styles.down}`}>
                                {changePercent > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                {Math.abs(changePercent).toFixed(0)}%
                            </div>
                        )}
                    </div>
                    <div className={styles.statValue}>{formatCurrency(stats.totalSpent)}</div>
                    <div className={styles.statLabel}>Total Spent</div>
                </motion.div>

                {/* Average Ticket */}
                <motion.div
                    className={styles.statCard}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#4ECDC4' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{formatCurrency(stats.avgTicket)}</div>
                    <div className={styles.statLabel}>Avg Ticket</div>
                </motion.div>

                {/* Top Category */}
                <motion.div
                    className={styles.statCard}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#FF6B6B' }}>
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{topCategory[0]}</div>
                    <div className={styles.statLabel}>Top Category</div>
                </motion.div>

                {/* Transaction Count */}
                <motion.div
                    className={styles.statCard}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#9D4EDD', color: '#fff' }}>
                            <Calendar size={24} />
                        </div>
                    </div>
                    <div className={styles.statValue}>{stats.transactionCount}</div>
                    <div className={styles.statLabel}>Transactions</div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className={styles.chartsGrid}>
                {/* Monthly Trend Chart */}
                <motion.div
                    className={styles.chartCard}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className={styles.cardTitle}>
                        <span>Monthly Trend 📈</span>
                    </div>
                    <div className={styles.chartWrapper}>
                        {monthlyData.every(d => d.amount === 0) ? (
                            <div className={styles.noData}>No data yet for this period</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFD93D" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#FFD93D" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '2px solid #000',
                                            boxShadow: '4px 4px 0px #000',
                                            fontWeight: 600,
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Spent']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#000"
                                        strokeWidth={3}
                                        fill="url(#colorAmount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                    className={styles.chartCard}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className={styles.cardTitle}>
                        <span>Category Split 🍕</span>
                    </div>
                    <div className={styles.pieWrapper}>
                        {categoryData.length === 0 ? (
                            <div className={styles.noData}>No categories yet</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    stroke="#000"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '2px solid #000',
                                                boxShadow: '4px 4px 0px #000',
                                            }}
                                            formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.legendList}>
                                    {categoryData.slice(0, 4).map(cat => (
                                        <div key={cat.name} className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ background: cat.color }} />
                                            <span>{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Top Merchants */}
            <motion.div
                className={styles.storesCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <div className={styles.cardTitle}>
                    <span>Top Merchants 🏪</span>
                </div>
                <div className={styles.storesList}>
                    {topStores.length === 0 ? (
                        <div className={styles.noData}>No transactions yet</div>
                    ) : topStores.map((store, index) => (
                        <motion.div
                            key={store.name}
                            className={styles.storeItem}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.05 }}
                        >
                            <div className={styles.storeRank}>#{index + 1}</div>
                            <div className={styles.storeIcon}>
                                <Store size={18} />
                            </div>
                            <div className={styles.storeInfo}>
                                <div className={styles.storeName}>{store.name}</div>
                                <div className={styles.storeCount}>{store.count} transactions</div>
                            </div>
                            <div className={styles.storeAmount}>{formatCurrency(store.amount)}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default AnalyticsPage;
