// RunwaySimulator — Interactive What-If Velocity Restraint Widget
// Allows real-time manipulation of discretionary spending to visualize runway impact
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gauge, AlertTriangle, ShieldCheck, TrendingDown, Sparkles, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { formatCurrency } from '../services/currencyService';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';

interface RunwaySimulatorProps {
    /** Current liquid balance (cash reserves) */
    totalBalance: number;
    /** This month's expenses so far */
    monthlyExpense: number;
    /** This month's income so far */
    monthlyIncome: number;
    /** Total committed bills in next 30 days */
    committedBills: number;
    /** Current daily burn rate (can be derived) */
    dailyBurnRate?: number;
    /** Day of month (1-31) for partial month calculations */
    currentDayOfMonth?: number;
    /** Major fixed rent/obligation threshold amount */
    fixedRentThreshold?: number;
    /** Compact mode for dashboard sidebar */
    compact?: boolean;
    /** Variant: 'dashboard' for the main dashboard, 'twin' for MoneyTwin page */
    variant?: 'dashboard' | 'twin';
}

interface SimulationPoint {
    day: number;
    baseline: number;
    restrained: number;
    isDeficit: boolean;
}

const RESTRAINT_PRESETS = [
    { value: 0, label: 'No Change' },
    { value: 2000, label: '−₹2K' },
    { value: 5000, label: '−₹5K' },
    { value: 8000, label: '−₹8K' },
    { value: 10000, label: '−₹10K' },
    { value: 15000, label: '−₹15K' },
];

export function RunwaySimulator({
    totalBalance,
    monthlyExpense,
    monthlyIncome,
    committedBills,
    dailyBurnRate: externalDailyBurn,
    currentDayOfMonth: externalDay,
    fixedRentThreshold,
    compact = false,
    variant = 'dashboard',
}: RunwaySimulatorProps) {
    const [restraint, setRestraint] = useState(0);
    const [isExpanded, setIsExpanded] = useState(variant === 'twin');
    const [activePreset, setActivePreset] = useState(0);
    const sliderRef = useRef<HTMLInputElement>(null);

    const now = new Date();
    const dayOfMonth = externalDay || now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - dayOfMonth;

    // Core financial calculations
    const simulation = useMemo(() => {
        const dailyBurn = externalDailyBurn || (dayOfMonth > 0 ? monthlyExpense / dayOfMonth : 0);
        const dailyRestraint = remainingDays > 0 ? restraint / remainingDays : 0;
        const restrainedDailyBurn = Math.max(0, dailyBurn - dailyRestraint);

        // Baseline scenario (no restraint)
        const baselineTotalExpectedExpense = monthlyExpense + (dailyBurn * remainingDays);
        const baselineSafeToSpend = Math.max(0, totalBalance - committedBills - (dailyBurn * remainingDays));
        const baselineRunwayDays = dailyBurn > 0 ? Math.round(totalBalance / dailyBurn) : 999;

        // Restrained scenario
        const restrainedTotalExpectedExpense = monthlyExpense + (restrainedDailyBurn * remainingDays);
        const restrainedSafeToSpend = Math.max(0, totalBalance - committedBills - (restrainedDailyBurn * remainingDays));
        const restrainedRunwayDays = restrainedDailyBurn > 0 ? Math.round(totalBalance / restrainedDailyBurn) : 999;

        // Runway improvement
        const runwayGain = restrainedRunwayDays - baselineRunwayDays;
        const safeToSpendGain = restrainedSafeToSpend - baselineSafeToSpend;

        // Deficit Collision Radar
        const rent = fixedRentThreshold || committedBills * 0.6; // Use 60% of committed as proxy for rent
        let deficitCollisionDay: number | null = null;
        let deficitCollisionDayRestrained: number | null = null;
        let runningBalance = totalBalance;
        let runningBalanceRestrained = totalBalance;

        // Generate 30-day trajectory points for the SVG curve
        const trajectoryPoints: SimulationPoint[] = [];
        for (let d = 0; d <= 30; d++) {
            if (d > 0) {
                runningBalance -= dailyBurn;
                runningBalanceRestrained -= restrainedDailyBurn;

                // Check if we cross rent threshold
                if (runningBalance < rent && deficitCollisionDay === null) {
                    deficitCollisionDay = dayOfMonth + d;
                }
                if (runningBalanceRestrained < rent && deficitCollisionDayRestrained === null) {
                    deficitCollisionDayRestrained = dayOfMonth + d;
                }
            }

            trajectoryPoints.push({
                day: dayOfMonth + d,
                baseline: Math.max(0, runningBalance),
                restrained: Math.max(0, runningBalanceRestrained),
                isDeficit: runningBalance < rent,
            });
        }

        return {
            dailyBurn,
            restrainedDailyBurn,
            dailyRestraint,
            baselineSafeToSpend,
            restrainedSafeToSpend,
            baselineRunwayDays,
            restrainedRunwayDays,
            runwayGain,
            safeToSpendGain,
            deficitCollisionDay,
            deficitCollisionDayRestrained,
            trajectoryPoints,
            rent,
        };
    }, [totalBalance, monthlyExpense, committedBills, restraint, remainingDays, dayOfMonth, externalDailyBurn, fixedRentThreshold]);

    // Handle preset selection
    const handlePresetClick = useCallback((value: number, index: number) => {
        setRestraint(value);
        setActivePreset(index);
        soundManager.play('click');
    }, []);

    // Handle slider change
    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setRestraint(val);
        // Find closest preset
        const closest = RESTRAINT_PRESETS.reduce((prev, curr) =>
            Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
        );
        setActivePreset(RESTRAINT_PRESETS.indexOf(closest));
    }, []);

    // Debounced haptic feedback
    useEffect(() => {
        if (restraint > 0) {
            const timeout = setTimeout(() => soundManager.play('whoosh'), 50);
            return () => clearTimeout(timeout);
        }
    }, [restraint]);

    // SVG Trajectory Renderer
    const svgWidth = compact ? 300 : 520;
    const svgHeight = compact ? 120 : 160;

    const svgPaths = useMemo(() => {
        const points = simulation.trajectoryPoints;
        if (points.length === 0) return { baseline: '', restrained: '', threshold: 0 };

        const maxVal = Math.max(...points.map(p => Math.max(p.baseline, p.restrained)), 1);
        const xScale = svgWidth / (points.length - 1);
        const yScale = svgHeight * 0.85;

        const toY = (val: number) => svgHeight - (val / maxVal) * yScale - 8;
        const toX = (idx: number) => idx * xScale;

        const buildPath = (key: 'baseline' | 'restrained') => {
            return points.map((p, i) => {
                const x = toX(i);
                const y = toY(p[key]);
                if (i === 0) return `M ${x} ${y}`;
                // Smooth curve using bezier
                const prev = points[i - 1];
                const prevX = toX(i - 1);
                const prevY = toY(prev[key]);
                const cpX = (prevX + x) / 2;
                return `C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
            }).join(' ');
        };

        const thresholdY = toY(simulation.rent);

        return {
            baseline: buildPath('baseline'),
            restrained: buildPath('restrained'),
            threshold: thresholdY,
        };
    }, [simulation, svgWidth, svgHeight]);

    // Collision radar message
    const radarMessage = useMemo(() => {
        if (!simulation.deficitCollisionDay && !simulation.deficitCollisionDayRestrained) {
            return null;
        }

        if (simulation.deficitCollisionDay && !simulation.deficitCollisionDayRestrained && restraint > 0) {
            return {
                type: 'success' as const,
                text: `At current 7-day velocity, you risk dipping below fixed threshold on Day ${simulation.deficitCollisionDay}. Restraining by ${formatCurrency(restraint)} restores safe buffer.`,
            };
        }

        if (simulation.deficitCollisionDay && simulation.deficitCollisionDayRestrained) {
            const daysDifference = simulation.deficitCollisionDayRestrained - simulation.deficitCollisionDay;
            if (daysDifference > 0) {
                return {
                    type: 'warning' as const,
                    text: `Deficit collision expected on Day ${simulation.deficitCollisionDay}. Restraining by ${formatCurrency(restraint)} extends buffer by ${daysDifference} days to Day ${simulation.deficitCollisionDayRestrained}.`,
                };
            }
        }

        if (simulation.deficitCollisionDay) {
            return {
                type: 'danger' as const,
                text: `At current velocity, you risk dipping below fixed threshold on Day ${simulation.deficitCollisionDay}. Increase restraint to restore safe buffer.`,
            };
        }

        return null;
    }, [simulation, restraint]);

    return (
        <div className={cn(
            'rounded-2xl border overflow-hidden transition-all duration-300',
            variant === 'twin'
                ? 'border-[var(--color-brand)]/30 bg-gradient-to-br from-[var(--color-brand-soft)]/20 via-[var(--color-surface)] to-[var(--color-surface-2)]/60'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]',
            compact && 'rounded-xl'
        )}>
            {/* Header */}
            <button
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    soundManager.play('click');
                }}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[var(--color-surface-2)]/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                        variant === 'twin'
                            ? 'bg-[var(--color-brand)] text-white'
                            : 'bg-[#111111] text-white'
                    )}>
                        <Gauge className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-sm text-[var(--color-ink)]">
                                Velocity Restraint Simulator
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
                                Interactive
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-muted)] font-mono mt-0.5">
                            Drag to simulate discretionary restraint → watch runway recalculate live
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {restraint > 0 && (
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        >
                            +{simulation.runwayGain} days
                        </motion.span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--color-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-5 pb-5 space-y-5">
                            {/* Preset Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {RESTRAINT_PRESETS.map((preset, idx) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handlePresetClick(preset.value, idx)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all border',
                                            activePreset === idx
                                                ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-xs'
                                                : 'bg-[var(--color-surface-2)] text-[var(--color-ink)] border-[var(--color-border)] hover:bg-[var(--color-border)]'
                                        )}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tactile Slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-[var(--color-muted)]">Monthly restraint</span>
                                    <span className="font-mono font-bold text-[var(--color-ink)] tabular-nums">
                                        −{formatCurrency(restraint)}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        ref={sliderRef}
                                        type="range"
                                        min="0"
                                        max="20000"
                                        step="500"
                                        value={restraint}
                                        onChange={handleSliderChange}
                                        className="runway-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${(restraint / 20000) * 100}%, var(--color-surface-2) ${(restraint / 20000) * 100}%, var(--color-surface-2) 100%)`,
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-[var(--color-muted)] mt-1 px-0.5">
                                        <span>₹0</span>
                                        <span>₹5K</span>
                                        <span>₹10K</span>
                                        <span>₹15K</span>
                                        <span>₹20K</span>
                                    </div>
                                </div>
                            </div>

                            {/* Live SVG Trajectory Curve */}
                            <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-canvas)]/50 p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold">
                                        30-Day Cash Trajectory
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px] font-mono">
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-0.5 rounded bg-[var(--color-muted)]" /> Baseline
                                        </span>
                                        {restraint > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-0.5 rounded bg-emerald-500" /> Restrained
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-0.5 rounded bg-rose-400 opacity-50" style={{ borderTop: '1px dashed' }} /> Threshold
                                        </span>
                                    </div>
                                </div>

                                <svg
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    className="w-full"
                                    style={{ height: compact ? 120 : 160 }}
                                    preserveAspectRatio="none"
                                >
                                    {/* Threshold line (rent / fixed obligations) */}
                                    <line
                                        x1="0"
                                        y1={svgPaths.threshold}
                                        x2={svgWidth}
                                        y2={svgPaths.threshold}
                                        stroke="var(--color-danger, #ef4444)"
                                        strokeWidth="1"
                                        strokeDasharray="6 4"
                                        opacity="0.4"
                                    />
                                    <text
                                        x={svgWidth - 4}
                                        y={svgPaths.threshold - 4}
                                        textAnchor="end"
                                        className="fill-[var(--color-danger)]"
                                        fontSize="8"
                                        fontFamily="monospace"
                                        opacity="0.6"
                                    >
                                        Fixed threshold
                                    </text>

                                    {/* Baseline trajectory */}
                                    <path
                                        d={svgPaths.baseline}
                                        fill="none"
                                        stroke="var(--color-muted, #999)"
                                        strokeWidth="2"
                                        opacity="0.5"
                                        strokeLinecap="round"
                                    />

                                    {/* Restrained trajectory (only when restraint > 0) */}
                                    {restraint > 0 && (
                                        <>
                                            {/* Gradient fill under the restrained curve */}
                                            <defs>
                                                <linearGradient id="restrainedGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d={`${svgPaths.restrained} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`}
                                                fill="url(#restrainedGradient)"
                                            />
                                            <motion.path
                                                d={svgPaths.restrained}
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                                            />
                                        </>
                                    )}

                                    {/* Deficit collision marker */}
                                    {simulation.deficitCollisionDay && (
                                        <g>
                                            <circle
                                                cx={((simulation.deficitCollisionDay - dayOfMonth) / 30) * svgWidth}
                                                cy={svgPaths.threshold}
                                                r="4"
                                                fill="var(--color-danger, #ef4444)"
                                                opacity="0.8"
                                            />
                                            <circle
                                                cx={((simulation.deficitCollisionDay - dayOfMonth) / 30) * svgWidth}
                                                cy={svgPaths.threshold}
                                                r="8"
                                                fill="none"
                                                stroke="var(--color-danger, #ef4444)"
                                                strokeWidth="1"
                                                opacity="0.4"
                                            >
                                                <animate attributeName="r" from="4" to="12" dur="2s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                        </g>
                                    )}
                                </svg>
                            </div>

                            {/* Realtime Metrics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Safe to Spend */}
                                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/50">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                        Safe to Spend
                                    </span>
                                    <motion.div
                                        key={simulation.restrainedSafeToSpend}
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        className="text-lg font-bold font-mono tabular-nums text-[var(--color-ink)] mt-1"
                                    >
                                        {formatCurrency(simulation.restrainedSafeToSpend)}
                                    </motion.div>
                                    {restraint > 0 && (
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                            +{formatCurrency(simulation.safeToSpendGain)}
                                        </span>
                                    )}
                                </div>

                                {/* Forward Runway */}
                                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/50">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                        Forward Runway
                                    </span>
                                    <motion.div
                                        key={simulation.restrainedRunwayDays}
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        className="text-lg font-bold font-mono tabular-nums text-[var(--color-ink)] mt-1"
                                    >
                                        {Math.min(simulation.restrainedRunwayDays, 999)} Days
                                    </motion.div>
                                    {restraint > 0 && simulation.runwayGain > 0 && (
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                            +{simulation.runwayGain} days gained
                                        </span>
                                    )}
                                </div>

                                {/* Daily Burn */}
                                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/50">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                        Daily Burn
                                    </span>
                                    <motion.div
                                        key={simulation.restrainedDailyBurn}
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        className="text-lg font-bold font-mono tabular-nums text-[var(--color-ink)] mt-1"
                                    >
                                        {formatCurrency(Math.round(simulation.restrainedDailyBurn))}
                                    </motion.div>
                                    {restraint > 0 && (
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                            −{formatCurrency(Math.round(simulation.dailyRestraint))}/day
                                        </span>
                                    )}
                                </div>

                                {/* Collision Radar */}
                                <div className={cn(
                                    'p-3 rounded-xl border',
                                    simulation.deficitCollisionDay
                                        ? restraint > 0 && !simulation.deficitCollisionDayRestrained
                                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                                        : 'bg-[var(--color-surface-2)]/60 border-[var(--color-border)]/50'
                                )}>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] font-semibold block">
                                        Collision Risk
                                    </span>
                                    <div className="text-lg font-bold font-mono tabular-nums mt-1">
                                        {!simulation.deficitCollisionDay ? (
                                            <span className="text-emerald-600 dark:text-emerald-400">CLEAR</span>
                                        ) : restraint > 0 && !simulation.deficitCollisionDayRestrained ? (
                                            <span className="text-emerald-600 dark:text-emerald-400">RESOLVED</span>
                                        ) : (
                                            <span className="text-rose-600 dark:text-rose-400">
                                                Day {simulation.deficitCollisionDay}
                                            </span>
                                        )}
                                    </div>
                                    {simulation.deficitCollisionDay && (
                                        <span className="text-[10px] font-mono text-[var(--color-muted)]">
                                            {!simulation.deficitCollisionDayRestrained && restraint > 0
                                                ? 'Buffer restored'
                                                : 'Increase restraint'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Deficit Collision Radar Alert */}
                            <AnimatePresence>
                                {radarMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        className={cn(
                                            'p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed',
                                            radarMessage.type === 'success' &&
                                                'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
                                            radarMessage.type === 'warning' &&
                                                'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
                                            radarMessage.type === 'danger' &&
                                                'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                                        )}
                                    >
                                        {radarMessage.type === 'success' ? (
                                            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                                        ) : radarMessage.type === 'warning' ? (
                                            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold block mb-1">
                                                Deficit Collision Radar
                                            </span>
                                            {radarMessage.text}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default RunwaySimulator;
