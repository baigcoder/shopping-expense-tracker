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
            <div className="bg-white border-4 border-black p-6 flex items-center justify-center h-[380px] shadow-[8px_8px_0px_#000000]">
                <div className="flex flex-col items-center gap-6">
                    <div className="p-5 border-4 border-black bg-white shadow-[4px_4px_0px_#000000]">
                        <Loader2 className="h-10 w-10 animate-spin text-black" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">SYNTHESIZING_SPEND_PATTERNS...</p>
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
                            <h3 className="text-xl font-black uppercase tracking-tight">AI_NEURAL_PULSE</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-[#E11D48] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                    {patterns.length > 0 ? `${patterns.length}_ACTIVE_CLUSTERS` : 'LIVE_FORECASTING'}
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
                                <span className="text-[8px] font-black uppercase">VELOCITY</span>
                                <span className="text-2xl font-black mt-1">{healthScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCell}>
                    <div className={styles.statLabel}>
                        <Activity size={12} strokeWidth={3} /> DAILY_BURN
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
                        <Target size={12} strokeWidth={3} /> EST_INTERVAL
                    </div>
                    <p className={styles.statVal}>{formatCurrency(velocity.monthlyRate)}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">PROJECTION_ACTIVE</p>
                </div>
                <div className={styles.statCell}>
                    <div className={styles.statLabel}>
                        <Zap size={12} strokeWidth={3} /> EFFICIENCY
                    </div>
                    <p className={cn(
                        styles.statVal,
                        velocity.burnRate > 100 ? "text-rose-600" : "text-emerald-600"
                    )}>{Math.max(0, 100 - velocity.burnRate)}%</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">SURPLUS_OPTIMAL</p>
                </div>
            </div>

            <div className="px-6 py-4 border-b-4 border-black bg-slate-50 flex items-center gap-4">
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
                                <span>ANOMALY: {alert.title.split(':')[0]}</span>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-700 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={14} strokeWidth={3} />
                            <span>AUDIT: NOMINAL</span>
                        </div>
                    )}
                </AnimatePresence>
                {patterns.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest">
                        <Zap size={14} className="text-amber-400" strokeWidth={3} />
                        <span>FLOW: {patterns[0].category}</span>
                    </div>
                )}
            </div>

            <div className={styles.chartArea}>
                <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="0" stroke="#000000" vertical={true} />
                            <XAxis
                                dataKey="month"
                                axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                            />
                            <YAxis
                                axisLine={{ stroke: '#000000', strokeWidth: 3 }}
                                tickLine={false}
                                tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                                tickFormatter={(v) => `${currencySymbol}${v}`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_#000000]">
                                                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3 border-b-2 border-black pb-2">
                                                    PROBABILITY_MATRIX
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
                            <Area type="stepAfter" dataKey="expenses" stroke="#000000" strokeWidth={3} fill="#000000" fillOpacity={0.1} strokeDasharray="5 5" name="Baseline" />
                            <Area type="stepAfter" dataKey="savings" stroke="#E11D48" strokeWidth={4} fill="#E11D48" fillOpacity={0.2} name="Neural_Forecast" activeDot={{ r: 8, strokeWidth: 3, stroke: '#000000', fill: '#E11D48' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.footer}>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-2 text-[#E11D48]">
                        <Activity className="h-3 w-3" /> LIVE_TELEMETRY
                    </span>
                    <span>OPTIMIZED_TRAJECTORY</span>
                </div>
                <Link to="/money-twin" className={styles.seeMoreLink}>
                    <span>SIMULATION_ENGINE</span>
                    <ArrowUpRight size={16} strokeWidth={3} />
                </Link>
            </div>
        </motion.div>
    );
};

export default MoneyTwinPulse;
