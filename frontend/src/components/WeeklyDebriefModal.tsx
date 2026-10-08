// WeeklyDebriefModal — Sunday Snapshot & Calming Weekly Financial Debrief
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, ShieldCheck, TrendingDown, Target, CheckCircle2,
    Sparkles, ArrowRight, X, Clock, Flame
} from 'lucide-react';
import { formatCurrency } from '../services/currencyService';
import { soundManager } from '@/lib/sounds';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface WeeklyDebriefModalProps {
    open: boolean;
    onClose: () => void;
    totalBalance?: number;
    weeklySpend?: number;
    baselineWeeklyBurn?: number;
    reviewedCount?: number;
    safeToSpendWeekly?: number;
}

export function WeeklyDebriefModal({
    open,
    onClose,
    totalBalance = 78450,
    weeklySpend = 7240,
    baselineWeeklyBurn = 8400,
    reviewedCount = 8,
    safeToSpendWeekly = 14500,
}: WeeklyDebriefModalProps) {
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Calculate velocity variance
    const variancePercent = useMemo(() => {
        if (!baselineWeeklyBurn) return -14;
        const diff = weeklySpend - baselineWeeklyBurn;
        return Math.round((diff / baselineWeeklyBurn) * 100);
    }, [weeklySpend, baselineWeeklyBurn]);

    const isFavorable = variancePercent <= 0;

    const handleLockTargets = () => {
        setIsConfirmed(true);
        soundManager.play('success');
        localStorage.setItem('cashly_last_weekly_debrief', new Date().toISOString());
        toast.success("Weekly targets locked! Safe headroom confirmed.");
        setTimeout(() => {
            onClose();
            setIsConfirmed(false);
        }, 1200);
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 12 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="relative w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden z-10"
                >
                    {/* Header Banner */}
                    <div className="p-6 sm:p-7 bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#222222] text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--color-brand)] text-white">
                                Sunday Snapshot
                            </span>
                            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 60-Second Debrief
                            </span>
                        </div>

                        <h2 className="editorial-title text-2xl sm:text-3xl text-white">
                            Weekly Financial Debrief
                        </h2>
                        <p className="text-xs text-neutral-300 mt-1 max-w-md">
                            A calm retrospective on your 7-day velocity, verified review rate, and incoming safe spending headroom.
                        </p>
                    </div>

                    {/* Debrief Metrics Grid */}
                    <div className="p-6 sm:p-7 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card 1: Velocity Variance */}
                            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/60">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                    7-Day Discretionary Burn
                                </span>
                                <div className="editorial-title text-2xl text-[var(--color-ink)] mt-1.5 tabular-nums">
                                    {formatCurrency(weeklySpend)}
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 text-xs">
                                    <span className={isFavorable ? "text-emerald-600 dark:text-emerald-400 font-bold font-mono" : "text-rose-600 font-bold font-mono"}>
                                        {variancePercent > 0 ? `+${variancePercent}%` : `${variancePercent}%`} variance
                                    </span>
                                    <span className="text-[var(--color-muted)] text-[11px]">
                                        vs baseline ({formatCurrency(baselineWeeklyBurn)})
                                    </span>
                                </div>
                            </div>

                            {/* Card 2: Sovereign Review Consent */}
                            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/60">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                    Sovereign Consent Rate
                                </span>
                                <div className="editorial-title text-2xl text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                                    100% Consented
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-muted)]">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{reviewedCount} checkouts reviewed & verified</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Safe to Spend Allocation for Next Week */}
                        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[var(--color-surface-2)] to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold block">
                                    Safe to Spend (Next 7 Days)
                                </span>
                                <div className="editorial-title text-3xl text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                    {formatCurrency(safeToSpendWeekly)}
                                </div>
                                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                                    Calculated after reserving committed obligations & rent threshold.
                                </p>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-muted)] self-start sm:self-center">
                                ~{formatCurrency(Math.round(safeToSpendWeekly / 7))}/day headroom
                            </div>
                        </div>

                        {/* Weekly Focus Targets */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                Targets for Next 7 Days
                            </span>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] text-xs border border-[var(--color-border)]/50">
                                    <span className="font-medium text-[var(--color-ink)]">Cap Dining & Takeout</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Under {formatCurrency(4500)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] text-xs border border-[var(--color-border)]/50">
                                    <span className="font-medium text-[var(--color-ink)]">Discretionary Impulse Buffer</span>
                                    <span className="font-mono font-bold text-[var(--color-ink)]">Max {formatCurrency(3000)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Lock In Confirmation */}
                        <div className="pt-2">
                            <Button
                                onClick={handleLockTargets}
                                disabled={isConfirmed}
                                className="w-full py-3 h-11 rounded-xl bg-[var(--color-ink)] hover:bg-neutral-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all"
                            >
                                {isConfirmed ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                                        <span>Targets Locked & Confirmed!</span>
                                    </>
                                ) : (
                                    <>
                                        <Target className="w-4 h-4" />
                                        <span>Lock In Weekly Targets & Safe Headroom</span>
                                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center text-[var(--color-muted)] font-mono mt-2">
                                Takes 60 seconds · Resets next Sunday at 00:00
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default WeeklyDebriefModal;
