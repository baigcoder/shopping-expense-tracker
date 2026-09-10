// SpendSync AI Forecast - Stark Gen Z Brutalist Neural Pulse
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { moneyTwinService, MoneyTwinState } from '../../services/moneyTwinService';
import { getCurrencySymbol, formatCurrency } from '../../services/currencyService';
import {
    Activity, Brain, Zap, Target, Loader2, RefreshCw, AlertTriangle, CheckCircle, ArrowUpRight
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
            <div className="flex h-[380px] items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[#FAF8F5] p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">Building your forecast…</p>
                </div>
            </div>
        );
    }

    if (!twinState) return null;

    const { velocity, forecasts, healthScore, riskAlerts, patterns } = twinState;
    const currencySymbol = getCurrencySymbol();

    const chartData = [
        { month: 'S', expenses: velocity.monthlyRate * 0.9, savings: velocity.monthlyRate * 1.1 },
        { month: 'C', expenses: velocity.monthlyRate, savings: forecasts[0]?.predictedIncome ? forecasts[0].predictedIncome - velocity.monthlyRate : velocity.monthlyRate * 1.2 },
        ...forecasts.slice(0, 3).map(f => ({
            month: f.month.charAt(0),
            expenses: f.predictedExpenses,
            savings: f.predictedSavings + f.predictedExpenses
        }))
    ];

    return (
        <motion.div
            className={styles.aiMagicContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className={styles.header}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={styles.aiBrainIcon}>
                            <Brain size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="font-display text-xl font-semibold tracking-tight">Money Twin</h3>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-[#E11D48]" />
                                <span className="text-xs text-[var(--text-muted)]">
                                    {patterns.length > 0 ? `${patterns.length} patterns` : 'Live forecast'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2 bg-white text-black border-2 border-white hover:bg-black hover:text-white transition-colors"
                        >
                            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} strokeWidth={3} />
                        </button>
                        <div className={styles.healthBadge}>
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[10px] font-medium text-[var(--text-muted)]">Health</span>
                                <span className="text-2xl font-black mt-1">{healthScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCell}>
                    <div className={styles.statLabel}>
                        <Activity size={12} strokeWidth={2} /> Daily spend
                    </div>
                    <p className={styles.statVal}>{formatCurrency(velocity.dailyRate)}</p>
                    <div className={cn(
                        "mt-2 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 border-2 border-black inline-block",
                        velocity.acceleration > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                        {velocity.acceleration > 0 ? '+' : ''}{velocity.acceleration}%
                    </div>
                </div>
                <div className={styles.statCell}>
                    <div className={styles.statLabel}>
                        <Target size={12} strokeWidth={2} /> This month
                    </div>
                    <p className={styles.statVal}>{formatCurrency(velocity.monthlyRate)}</p>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">Projected</p>
                </div>
                <div className={styles.statCell}>
                    <div className={styles.statLabel}>
                        <Zap size={12} strokeWidth={2} /> Headroom
                    </div>
                    <p className={cn(
                        styles.statVal,
                        velocity.burnRate > 100 ? "text-rose-600" : "text-emerald-600"
                    )}>{Math.max(0, 100 - velocity.burnRate)}%</p>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">Room to save</p>
                </div>
            </div>

            <div className="flex items-center gap-4 border-b border-[var(--border)] bg-[#FAF8F5] px-6 py-4">
                <AnimatePresence mode="wait">
                    {riskAlerts.length > 0 ? (
                        riskAlerts.slice(0, 1).map(alert => (
                            <motion.div
                                key={alert.id}
                                className={styles.riskBadge}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <AlertTriangle size={14} className="text-rose-600" strokeWidth={3} />
                                <span>Watch: {alert.title.split(':')[0]}</span>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 rounded-full border border-[#059669]/20 bg-[#ECFDF5] px-3 py-1.5 text-xs font-medium text-[#059669]">
                            <CheckCircle size={14} strokeWidth={2} />
                            <span>Looking steady</span>
                        </div>
                    )}
                </AnimatePresence>
                {patterns.length > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">
                        <Zap size={14} className="text-[var(--brand)]" strokeWidth={2} />
                        <span>{patterns[0].category}</span>
                    </div>
                )}
            </div>

            <div className={styles.chartArea}>
                <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 6" stroke="#E7E5E4" vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78716C', fontSize: 11, fontWeight: 500 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78716C', fontSize: 11, fontWeight: 500 }}
                                tickFormatter={(v) => `${currencySymbol}${v}`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-md)]">
                                                <p className="mb-2 border-b border-[var(--border)] pb-2 text-xs font-medium text-[var(--text-muted)]">
                                                    Forecast
                                                </p>
                                                {payload.map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between gap-6 mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[10px] font-black uppercase text-black">{entry.name}</span>
                                                        </div>
                                                        <span className="text-sm font-black text-black">{formatCurrency(entry.value as number)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area type="monotone" dataKey="expenses" stroke="#78716C" strokeWidth={2} fill="#78716C" fillOpacity={0.08} name="Spending" />
                            <Area type="monotone" dataKey="savings" stroke="#E11D48" strokeWidth={2} fill="#E11D48" fillOpacity={0.12} name="Forecast" activeDot={{ r: 5, strokeWidth: 0, fill: '#E11D48' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.footer}>
                <div className="flex items-center gap-6 text-xs font-medium text-[var(--text-muted)]">
                    <span className="flex items-center gap-2 text-[#E11D48]">
                        <Activity className="h-3 w-3" /> Live
                    </span>
                    <span>On track</span>
                </div>
                <Link to="/money-twin" className={styles.seeMoreLink}>
                    <span>Open Money Twin</span>
                    <ArrowUpRight size={16} strokeWidth={3} />
                </Link>
            </div>
        </motion.div>
    );
};

export default MoneyTwinPulse;
