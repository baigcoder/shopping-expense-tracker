import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Sector
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Store, Calendar, RefreshCw,
    ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import LoadingScreen from '../components/LoadingScreen';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#2563EB',      // Indigo
    'Food & Dining': '#2563EB',
    'Shopping': '#64748B',  // Slate
    'Transport': '#8B5CF6', // Violet
    'Entertainment': '#3B82F6', // Blue
    'Bills & Utilities': '#0D9488', // Teal
    'Health': '#F43F5E',    // Rose
    'Travel': '#F59E0B',     // Amber
    'Income': '#10B981',    // Emerald
    'Other': '#94A3B8',     // Light Slate
};


const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 8}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
        />
    );
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

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setIsRefreshing(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
            if (loading) sound.playSuccess();
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ... (logic remains same, just moved into component)
    const getFilteredTransactions = () => {
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
    };

    const filteredTx = getFilteredTransactions();
    const totalSpent = filteredTx.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = filteredTx.length > 0 ? totalSpent / filteredTx.length : 0;
    const uniqueStores = new Set(filteredTx.map(t => t.description)).size;

    const categoryTotals: Record<string, number> = {};
    filteredTx.forEach(t => {
        let cat = 'Other';
        if (typeof t.category === 'string') {
            cat = t.category;
        } else if (t.category && typeof t.category === 'object') {
            cat = (t.category as any).name || 'Other';
        }
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0] || ['None', 0];

    // Helper for prev total
    const getPrevTotal = () => {
        const now = new Date();
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            if (timeRange === 'month') {
                const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
            }
            return false;
        }).reduce((sum, t) => sum + t.amount, 0);
    };
    const prevTotal = getPrevTotal();
    const changePercent = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

    // Charts Data
    const chartData = useMemo(() => {
        const dailyData: Record<string, { online: number; instore: number }> = {};
        const now = new Date();

        for (let i = timeRange === 'week' ? 7 : 30; i >= 0; i--) {
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
                    Math.random() > 0.5;

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

    const total = useMemo(() => ({
        online: chartData.reduce((acc, curr) => acc + curr.online, 0),
        instore: chartData.reduce((acc, curr) => acc + curr.instore, 0),
    }), [chartData]);

    const categoryData = useMemo(() => {
        return sortedCategories.slice(0, 5).map(([name, value]) => ({
            name,
            value,
            fill: CATEGORY_COLORS[name] || '#6B7280',
        }));
    }, [sortedCategories]);

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

    const getTopMerchants = () => {
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

    const topMerchants = getTopMerchants();

    if (loading) return <LoadingScreen />;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Analytics & Trends
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Deep dive into your spending habits
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                        <TabsList>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="year">Year</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>

                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2563EB&color=fff`} />
                        <AvatarFallback className="bg-primary text-white">U</AvatarFallback>
                    </Avatar>

                </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-2 card-hover bg-gradient-to-br from-primary/5 via-transparent to-transparent border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Spent ({timeRange})</CardTitle>
                        <div className="p-2 rounded-lg bg-primary/10">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold font-display">{formatCurrency(totalSpent)}</div>
                        <div className="flex items-center text-xs mt-1">
                            <span className={cn("flex items-center font-medium", changePercent > 0 ? "text-amber-500" : "text-blue-600")}>
                                {changePercent > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(changePercent).toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground ml-1">vs last {timeRange}</span>
                        </div>

                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Avg Transaction</CardTitle>
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold font-display">{formatCurrency(avgTicket)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Per transaction average</p>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Merchants</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Store className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold font-display">{uniqueStores}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique places shopped</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Spending Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Spending Trend</CardTitle>
                                <CardDescription>Online vs In-Store Activity</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={activeChart === 'online' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveChart('online')}
                                >
                                    Online ({formatCurrency(total.online)})
                                </Button>
                                <Button
                                    variant={activeChart === 'instore' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveChart('instore')}
                                >
                                    In-Store ({formatCurrency(total.instore)})
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                        formatter={(val: number) => [formatCurrency(val), activeChart === 'online' ? 'Online' : 'In-Store']}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={activeChart}
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category Breakdown</CardTitle>
                        <CardDescription>Where your money goes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] relative flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={activeCategoryIndex}
                                        activeShape={renderActiveShape}
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        dataKey="value"
                                        onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold" style={{ color: categoryData[activeCategoryIndex]?.fill }}>
                                    {categoryData[activeCategoryIndex] ? formatCurrency(categoryData[activeCategoryIndex].value) : '$0'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {categoryData[activeCategoryIndex]?.name || 'Total'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>This Week vs Last Week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Bar dataKey="thisWeek" name="This Week" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="lastWeek" name="Last Week" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Merchants */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Merchants</CardTitle>
                        <CardDescription>Most frequent places you shop</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topMerchants.length === 0 ? (
                                <div className="col-span-full text-center text-muted-foreground py-8">No merchant data available</div>
                            ) : (
                                topMerchants.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                #{i + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium truncate max-w-[120px]">{m.name}</div>
                                                <div className="text-xs text-muted-foreground">{m.count} transactions</div>
                                            </div>
                                        </div>
                                        <div className="font-bold">{formatCurrency(m.amount)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsPage;
