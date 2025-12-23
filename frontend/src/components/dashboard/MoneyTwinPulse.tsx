// Cashly AI Forecast - Enhanced MoneyTwin Dashboard Component
// Uses real transaction data for accurate predictions
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { moneyTwinService, MoneyTwinState } from '../../services/moneyTwinService';
import { formatCurrency, getCurrencySymbol } from '../../services/currencyService';
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Activity,
    Zap, Target, PiggyBank, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Props {
    userId: string;
}

const MoneyTwinPulse: React.FC<Props> = ({ userId }) => {
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async (force = false) => {
        if (!userId) return;
        try {
            if (force) {
                setRefreshing(true);
                moneyTwinService.clearCache();
            }
            const data = await moneyTwinService.getMoneyTwin(userId, force);
            setTwinState(data);
        } catch (error) {
            console.error("Failed to load Money Twin data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();

        // Listen for data changes
        const handleDataChange = () => loadData(true);
        window.addEventListener('transaction-added', handleDataChange);
        window.addEventListener('transaction-updated', handleDataChange);
        window.addEventListener('transaction-deleted', handleDataChange);

        return () => {
            window.removeEventListener('transaction-added', handleDataChange);
            window.removeEventListener('transaction-updated', handleDataChange);
            window.removeEventListener('transaction-deleted', handleDataChange);
        };
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-[350px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing your spending patterns...</p>
                </div>
            </div>

        );
    }

    if (!twinState) return null;

    const { velocity, forecasts, healthScore, riskAlerts, patterns } = twinState;
    const currencySymbol = getCurrencySymbol();

    // Prepare chart data with actual current month and 2-month forecasts
    const chartData = [
        {
            month: 'Current',
            expenses: velocity.monthlyRate,
            savings: forecasts[0]?.predictedIncome ? forecasts[0].predictedIncome - velocity.monthlyRate : 0
        },
        ...forecasts.slice(0, 2).map(f => ({
            month: f.month.split(' ')[0], // Just month name
            expenses: f.predictedExpenses,
            savings: f.predictedSavings
        }))
    ];

    // Get top spending patterns
    const topPatterns = patterns.slice(0, 3);

    // Health score color
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-blue-600';
        if (score >= 60) return 'text-indigo-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };


    const getHealthBg = (score: number) => {
        if (score >= 80) return 'from-blue-500 to-blue-600';
        if (score >= 60) return 'from-indigo-500 to-indigo-600';
        if (score >= 40) return 'from-amber-500 to-amber-600';
        return 'from-red-500 to-red-600';
    };


    return (
        <motion.div
            className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"

            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20">
                            <Brain className="h-5 w-5 text-white" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-800">SpendSync AI Forecast</h3>

                            <p className="text-xs text-slate-500">
                                Based on {patterns.length > 0 ? `${patterns.length} spending patterns` : 'your habits'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw className={cn("h-4 w-4 text-slate-500", refreshing && "animate-spin")} />
                        </button>
                        {/* Health Score Badge */}
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "relative w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg",
                                getHealthBg(healthScore)
                            )}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{healthScore}</span>
                                </div>
                                <Activity className="absolute -bottom-1 -right-1 h-4 w-4 text-white/80" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-px bg-slate-100">
                <div className="bg-white p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Daily Burn</p>
                    <p className="font-semibold text-slate-800">{formatCurrency(velocity.dailyRate)}</p>
                    <div className={cn(
                        "inline-flex items-center gap-1 text-xs mt-1",
                        velocity.acceleration > 0 ? "text-amber-600" : "text-blue-600"
                    )}>
                        {velocity.acceleration > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(velocity.acceleration)}%
                    </div>

                </div>
                <div className="bg-white p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Monthly Rate</p>
                    <p className="font-semibold text-slate-800">{formatCurrency(velocity.monthlyRate)}</p>
                    <p className="text-xs text-slate-500 mt-1">This month</p>
                </div>
                <div className="bg-white p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Burn Rate</p>
                    <p className={cn(
                        "font-semibold",
                        velocity.burnRate > 100 ? "text-orange-600" :
                            velocity.burnRate > 80 ? "text-amber-600" : "text-teal-600"
                    )}>{velocity.burnRate}%</p>
                    <p className="text-xs text-slate-500 mt-1">of income</p>
                </div>
            </div>

            {/* Risk Alerts or All Clear */}
            <div className="px-4 py-3 flex flex-wrap gap-2 bg-white">
                {riskAlerts.length > 0 ? (
                    riskAlerts.slice(0, 2).map(alert => (
                        <div
                            key={alert.id}
                            className={cn(
                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                                alert.severity === 'critical' ? "bg-red-100 text-red-700" :
                                    alert.severity === 'danger' ? "bg-orange-100 text-orange-700" :
                                        "bg-amber-100 text-amber-700"
                            )}
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {alert.title.replace(/[^\w\s]/gi, '')}
                        </div>
                    ))
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        All spending on track
                    </div>

                )}

                {/* Top Patterns Preview */}
                {topPatterns.length > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Target className="h-3.5 w-3.5" />
                        Top: {topPatterns[0].category} ({formatCurrency(topPatterns[0].avgMonthlySpend)}/mo)
                    </div>

                )}
            </div>

            {/* Forecast Chart - Enhanced ShadCN Style */}
            <div className="px-4 pb-4 bg-white">
                {/* Chart Legend */}
                <div className="flex items-center justify-end gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                        <span className="text-xs text-slate-600">Predicted Spend</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-slate-600">Projected Savings</span>
                    </div>

                </div>

                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#94A3B8" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#2563EB" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>

                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E2E8F0"
                            />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                width={55}
                            />
                            <Tooltip
                                cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                                    background: 'white',
                                    padding: '12px 16px'
                                }}
                                labelStyle={{ fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}
                                formatter={(value: number, name: string) => [
                                    formatCurrency(value),
                                    name === 'expenses' ? 'Predicted Spend' : 'Projected Savings'
                                ]}
                            />
                            <Area
                                type="natural"
                                dataKey="expenses"
                                stroke="#94A3B8"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorExpenses)"
                                dot={{ r: 4, fill: '#94A3B8', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#94A3B8', strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Area
                                type="natural"
                                dataKey="savings"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorSavings)"
                                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <p className="text-xs text-slate-500">
                    Updated {new Date(twinState.lastUpdated).toLocaleTimeString()}
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Zap className="h-3 w-3 text-amber-500" />
                        2-month AI forecast
                    </div>
                    <Link
                        to="/money-twin"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/90 transition-colors"
                    >
                        See more
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>

                </div>
            </div>
        </motion.div>
    );
};

export default MoneyTwinPulse;
