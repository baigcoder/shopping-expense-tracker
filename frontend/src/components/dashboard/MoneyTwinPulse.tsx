// SpendSync AI Forecast - Enhanced MoneyTwin Dashboard Component
// Midnight Coral Theme - Premium AI Redesign (BEST EVER)
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { moneyTwinService, MoneyTwinState } from '../../services/moneyTwinService';
import { formatCurrency, getCurrencySymbol } from '../../services/currencyService';
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Activity,
    Zap, Target, Plus, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './MoneyTwinPulse.module.css';

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
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border-3 border-slate-200 p-6 flex items-center justify-center h-[380px] shadow-xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <motion.div
                            className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 relative border-2 border-white shadow-inner">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synthesizing Spend Patterns...</p>
                </div>
            </div>
        );
    }

    if (!twinState) return null;

    const { velocity, forecasts, healthScore, riskAlerts, patterns } = twinState;
    const currencySymbol = getCurrencySymbol();

    const chartData = [
        {
            month: 'Start',
            expenses: velocity.monthlyRate * 0.9,
            savings: velocity.monthlyRate * 1.1
        },
        {
            month: 'Current',
            expenses: velocity.monthlyRate,
            savings: forecasts[0]?.predictedIncome ? forecasts[0].predictedIncome - velocity.monthlyRate : velocity.monthlyRate * 1.2
        },
        ...forecasts.slice(0, 3).map(f => ({
            month: f.month.split(' ')[0],
            expenses: f.predictedExpenses,
            savings: f.predictedSavings + f.predictedExpenses
        }))
    ];

    const getHealthBg = (score: number) => {
        if (score >= 80) return 'from-blue-500 via-indigo-500 to-indigo-600';
        if (score >= 60) return 'from-indigo-500 via-purple-500 to-purple-600';
        if (score >= 40) return 'from-amber-500 via-orange-500 to-orange-600';
        return 'from-rose-500 via-red-500 to-red-600';
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className={styles.aiMagicContainer}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            {/* Premium Header */}
            <div className={styles.header}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            className={styles.aiBrainIcon}
                            animate={{
                                boxShadow: [
                                    "0 8px 16px -4px rgba(37, 99, 235, 0.3)",
                                    "0 8px 32px 0px rgba(37, 99, 235, 0.5)",
                                    "0 8px 16px -4px rgba(37, 99, 235, 0.3)"
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Brain size={20} className="relative z-10" />
                            <motion.div
                                className="absolute inset-0 bg-white/20 rounded-inherit"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">AI Neural Pulse</h3>
                            <p className="text-[10px] font-black text-slate-400 mt-1.5 uppercase tracking-[0.15em] opacity-80 flex items-center gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                {patterns.length > 0 ? `${patterns.length} Active Clusters` : 'Live Forecasting'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-300 hover:text-blue-500 hover:rotate-180 duration-500"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        </button>
                        <div className={cn(styles.healthBadge, "bg-gradient-to-br", getHealthBg(healthScore))}>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] font-black opacity-60 uppercase tracking-tighter">Velocity Score</span>
                                <span className="text-xl leading-none mt-0.5">{healthScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glassy Stats Grid */}
            <div className={styles.statsRow}>
                <motion.div className={styles.statCell} variants={itemVariants} whileHover={{ y: -2 }}>
                    <p className={styles.statLabel}>
                        <Activity size={10} className="text-blue-500" /> Daily Burn
                    </p>
                    <p className={styles.statVal}>{formatCurrency(velocity.dailyRate)}</p>
                    <div className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-black mt-2 uppercase tracking-wide",
                        velocity.acceleration > 0 ? "text-amber-500 bg-amber-50/50" : "text-blue-500 bg-blue-50/50",
                        "px-2 py-0.5 rounded-md"
                    )}>
                        {velocity.acceleration > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(velocity.acceleration)}%
                    </div>
                </motion.div>
                <motion.div className={styles.statCell} variants={itemVariants} whileHover={{ y: -2 }}>
                    <p className={styles.statLabel}>
                        <Target size={10} className="text-indigo-500" /> Est. Interval
                    </p>
                    <p className={styles.statVal}>{formatCurrency(velocity.monthlyRate)}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-wide opacity-60">Projection</p>
                </motion.div>
                <motion.div className={styles.statCell} variants={itemVariants} whileHover={{ y: -2 }}>
                    <p className={styles.statLabel}>
                        <Zap size={10} className="text-amber-500" /> Efficiency
                    </p>
                    <p className={cn(
                        styles.statVal,
                        velocity.burnRate > 100 ? "text-rose-500" :
                            velocity.burnRate > 80 ? "text-amber-500" : "text-teal-600"
                    )}>{Math.max(0, 100 - velocity.burnRate)}%</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-wide opacity-60">Optimal Surplus</p>
                </motion.div>
            </div>

            {/* Live Risk Alerts Bar */}
            <div className="px-5 py-3.5 flex flex-wrap gap-3 bg-white/30 backdrop-blur-md border-b-2 border-slate-50 relative z-20">
                <AnimatePresence mode="wait">
                    {riskAlerts.length > 0 ? (
                        riskAlerts.slice(0, 1).map(alert => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className={cn(
                                    styles.riskBadge,
                                    alert.severity === 'critical' ? "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm shadow-rose-100" :
                                        alert.severity === 'danger' ? "bg-amber-50 text-amber-600 border-amber-100/50 shadow-sm shadow-amber-100" :
                                            "bg-blue-50 text-blue-600 border-blue-100/50 shadow-sm shadow-blue-100"
                                )}
                            >
                                <AlertTriangle size={12} className="shrink-0" />
                                <span className="truncate max-w-[150px]">{alert.title.split(':')[0]}</span>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] bg-teal-50/50 text-teal-600 border-2 border-teal-100/50"
                        >
                            <CheckCircle size={12} />
                            AI Audit: Nominal
                        </motion.div>
                    )}
                </AnimatePresence>
                {patterns.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] bg-slate-50/50 text-slate-500 border-2 border-slate-100/50">
                        <Zap size={12} className="text-amber-500" />
                        Peak Flow: {patterns[0].category}
                    </div>
                )}
            </div>

            {/* Immersive Forecast Visualization */}
            <div className={styles.chartArea}>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={cn(styles.dot, "text-slate-200 bg-slate-200")} />
                        <span>Baseline</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={cn(styles.dot, "text-blue-500 bg-blue-500")} />
                        <span>Neural Forecast</span>
                    </div>
                </div>

                <div className="h-[150px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorExPulse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSavPulse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#2563EB" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(241, 245, 249, 0.5)" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 900 }}
                                tickFormatter={(v) => `${currencySymbol}${v}`}
                                width={60}
                            />
                            <Tooltip
                                cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '4 4' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white/95 backdrop-blur-xl border-[3px] border-slate-100 p-4 rounded-2xl shadow-2xl shadow-blue-900/10">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 border-b border-slate-50 pb-2">
                                                    Neural Probability
                                                </p>
                                                {payload.map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between gap-6 mt-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[10px] font-bold text-slate-500 capitalize">{entry.name}</span>
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-800">{formatCurrency(entry.value as number)}</span>
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
                                dataKey="expenses"
                                stroke="#cbd5e1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorExPulse)"
                                strokeDasharray="6 6"
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                            <Area
                                type="basis"
                                dataKey="savings"
                                stroke="#2563EB"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorSavPulse)"
                                animationDuration={2500}
                                animationEasing="ease-in-out"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB', className: 'animate-pulse' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Dynamic Footer */}
            <div className={styles.footer}>
                <div className="flex items-center gap-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    <span className="flex items-center gap-1.5 text-teal-500">
                        <Activity className="h-3 w-3" /> Live
                    </span>
                    <span className="text-[8px] opacity-20">/</span>
                    <span className="flex items-center gap-1.5">
                        Trajectory Optimized
                    </span>
                </div>
                <Link to="/money-twin" className={styles.seeMoreLink}>
                    <span>Simulation Engine</span>
                    <ArrowUpRight size={14} />
                </Link>
            </div>
        </motion.div>
    );
};

export default MoneyTwinPulse;
