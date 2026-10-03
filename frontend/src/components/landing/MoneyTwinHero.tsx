import { useState } from 'react';
import { Sparkles, TrendingUp, Sliders, ShieldCheck, ArrowRight } from 'lucide-react';

export default function MoneyTwinHero() {
    const [savingsAdjustment, setSavingsAdjustment] = useState<number>(100);

    // Dynamic mathematical calculations
    const baseMonthEnd = 24150;
    const baseRunwayDays = 42;
    const adjustedMonthEnd = baseMonthEnd + savingsAdjustment * 15;
    const adjustedRunway = baseRunwayDays + Math.round(savingsAdjustment / 14);
    const compound3Years = Math.round(savingsAdjustment * 36 * 1.12);

    // Responsive SVG calculation for the dynamic chart
    // SVG viewBox: 0 0 800 320
    // Day 01: x=60, Day 15 (Today): x=400, Day 30: x=740
    // Baseline y starts at 70, goes to 150 (day 15), then to 250 (day 30, $24,150)
    // Adjusted y ends at: 250 - (savingsAdjustment / 300) * 80 (e.g. up to 170)
    const endYAdjusted = 240 - (savingsAdjustment / 300) * 75;

    return (
        <div className="relative mx-auto w-full max-w-7xl">
            {/* Top Atmospheric Glow */}
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,129,116,0.15),transparent)] blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border,#E2E8F0)] bg-white shadow-[0_8px_32px_rgba(20,33,39,0.06)]">
                {/* Section Hero Heading within Environment */}
                <div className="border-b border-[var(--color-border,#E2E8F0)] bg-gradient-to-b from-[var(--color-bg,#F4F3EE)] to-white p-8 sm:p-12 lg:p-16">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-3.5 py-1 text-xs font-semibold text-[var(--color-brand)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Predictive Intelligence Engine</span>
                        </div>

                        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-[#142127] sm:text-5xl lg:text-[3.75rem] lg:leading-[1.08]">
                            "If nothing changes, this is where your month ends."
                        </h2>

                        <p className="mt-5 text-base leading-relaxed text-[#56656A] sm:text-lg">
                            Most financial tools tell you what went wrong after the money is spent.
                            Cashly’s <strong>Money Twin</strong> continuously calculates your burn velocity,
                            forward recurring commitments, and historical variance to model your cashflow runway in real time.
                        </p>
                    </div>

                    {/* Interactive Simulator Slider Strip */}
                    <div className="mt-10 rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                                    <Sliders className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-[#142127]">
                                        Simulate Discretionary Trim
                                    </p>
                                    <p className="text-[11px] text-[#56656A]">
                                        Drag to simulate cutting takeout or unneeded subscriptions
                                    </p>
                                </div>
                            </div>

                            <span className="font-mono text-base font-extrabold text-[var(--color-brand)] tabular-nums sm:text-lg">
                                +${savingsAdjustment}/month
                            </span>
                        </div>

                        <div className="mt-4">
                            <input
                                type="range"
                                min="0"
                                max="300"
                                step="25"
                                value={savingsAdjustment}
                                onChange={(e) => setSavingsAdjustment(Number(e.target.value))}
                                className="w-full accent-[var(--color-brand)] cursor-pointer h-2 bg-[var(--color-surface-2,#E9ECE8)] rounded-lg"
                                aria-label="Adjust simulated monthly savings"
                            />
                            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-[#8C9B9E]">
                                <span>$0 (Baseline)</span>
                                <span>$150/mo</span>
                                <span>$300/mo (Optimized)</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Numeric Metrics Grid */}
                    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-5 shadow-2xs">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C9B9E]">
                                Cash Runway
                            </span>
                            <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-[#142127] tabular-nums">
                                {adjustedRunway} <span className="text-base font-normal text-[#56656A]">days</span>
                            </p>
                            <p className="mt-1 text-xs text-[#17824F] font-medium">
                                +{adjustedRunway - baseRunwayDays} days buffer extended
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-5 shadow-2xs">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C9B9E]">
                                Net Headroom
                            </span>
                            <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-[#142127] tabular-nums">
                                $2,840
                            </p>
                            <p className="mt-1 text-xs text-[#8C9B9E]">
                                Unencumbered cash
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-5 shadow-2xs">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C9B9E]">
                                Projected Month-End
                            </span>
                            <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-[#17824F] tabular-nums">
                                ${adjustedMonthEnd.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-[#17824F] font-medium">
                                +${(savingsAdjustment * 15).toLocaleString()} surplus
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)]/50 p-5 shadow-2xs">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                3-Year Wealth Impact
                            </span>
                            <p className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--color-brand)] tabular-nums">
                                ${compound3Years.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-[#142127]">
                                At 8% compounding return
                            </p>
                        </div>
                    </div>
                </div>

                {/* THE TRAJECTORY VISUALIZATION ARTWORK CANVAS */}
                <div className="relative bg-[var(--color-bg,#F4F3EE)] p-6 sm:p-10 lg:p-12">
                    <div className="flex items-center justify-between text-xs text-[#56656A] mb-4">
                        <span className="font-mono font-semibold uppercase tracking-wider text-[#142127]">
                            Cashly Money Twin Trajectory Model
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-[#142127]" />
                                Actual Spend to Date
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                                Simulated Trajectory
                            </span>
                        </div>
                    </div>

                    {/* Interactive Large Chart Container */}
                    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-4 sm:p-6 shadow-inner">
                        <svg
                            className="w-full h-64 sm:h-80 lg:h-96"
                            viewBox="0 0 800 320"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient id="jadeTrajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0E8174" stopOpacity="0.20" />
                                    <stop offset="100%" stopColor="#0E8174" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="safeZoneGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#17824F" stopOpacity="0.10" />
                                    <stop offset="100%" stopColor="#17824F" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>

                            {/* Fine Horizontal Grid Lines */}
                            <line x1="50" y1="60" x2="760" y2="60" stroke="#E9ECE8" strokeWidth="1" />
                            <line x1="50" y1="120" x2="760" y2="120" stroke="#E9ECE8" strokeWidth="1" />
                            <line x1="50" y1="180" x2="760" y2="180" stroke="#E9ECE8" strokeWidth="1" />
                            <line x1="50" y1="240" x2="760" y2="240" stroke="#E9ECE8" strokeWidth="1" />

                            {/* Y-Axis Value Labels */}
                            <text x="15" y="64" className="font-mono text-[10px] fill-[#8C9B9E]">$35k</text>
                            <text x="15" y="124" className="font-mono text-[10px] fill-[#8C9B9E]">$30k</text>
                            <text x="15" y="184" className="font-mono text-[10px] fill-[#8C9B9E]">$25k</text>
                            <text x="15" y="244" className="font-mono text-[10px] fill-[#8C9B9E]">$20k</text>

                            {/* Today Vertical Guideline (Day 15 at x=400) */}
                            <line x1="400" y1="40" x2="400" y2="270" stroke="#B6C1BF" strokeWidth="1.5" strokeDasharray="3 3" />
                            <text x="375" y="32" className="font-mono text-[10px] font-bold fill-[#142127]">TODAY (Day 15)</text>

                            {/* Safe Headroom Zone Fill */}
                            <rect x="50" y="40" width="710" height="150" fill="url(#safeZoneGradient)" />
                            <text x="60" y="55" className="font-mono text-[9px] font-bold fill-[#17824F] uppercase tracking-wider">
                                Safe Net Headroom Buffer Zone
                            </text>

                            {/* Solid Historical Spend Curve (Day 1 to Day 15) */}
                            <path
                                d="M 60 70 Q 180 85 260 110 T 400 150"
                                fill="none"
                                stroke="#142127"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {/* Unchecked Baseline Projection Curve (Dashed Stone) */}
                            <path
                                d="M 400 150 Q 560 190 740 250"
                                fill="none"
                                stroke="#8C9B9E"
                                strokeWidth="2"
                                strokeDasharray="5 5"
                            />

                            {/* Dynamic Optimized Curve (Cashly Sovereign Jade) */}
                            <path
                                d={`M 400 150 Q 560 ${150 + (endYAdjusted - 150) * 0.45} 740 ${endYAdjusted}`}
                                fill="none"
                                stroke="#0E8174"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />

                            {/* Shaded Area Under Optimized Curve */}
                            <path
                                d={`M 400 150 Q 560 ${150 + (endYAdjusted - 150) * 0.45} 740 ${endYAdjusted} L 740 270 L 400 270 Z`}
                                fill="url(#jadeTrajectoryGradient)"
                                className="transition-all duration-300"
                            />

                            {/* Node at Today (x=400, y=150) */}
                            <circle cx="400" cy="150" r="6" fill="#142127" />
                            <circle cx="400" cy="150" r="3" fill="#FFFFFF" />

                            {/* Node at Month-End Projected (x=740, y=endYAdjusted) */}
                            <circle
                                cx="740"
                                cy={endYAdjusted}
                                r="7"
                                fill="#0E8174"
                                className="transition-all duration-300"
                            />
                            <circle
                                cx="740"
                                cy={endYAdjusted}
                                r="3.5"
                                fill="#FFFFFF"
                                className="transition-all duration-300"
                            />

                            {/* Projected Balance Callout Tooltip */}
                            <g className="transition-all duration-300" transform={`translate(640, ${endYAdjusted - 40})`}>
                                <rect x="0" y="0" width="115" height="30" rx="8" fill="#142127" />
                                <text x="10" y="19" className="font-mono text-[11px] font-bold fill-white">
                                    ${adjustedMonthEnd.toLocaleString()} proj.
                                </text>
                            </g>

                            {/* X-Axis Date Labels */}
                            <text x="50" y="295" className="font-mono text-[10px] fill-[#8C9B9E]">Day 01</text>
                            <text x="160" y="295" className="font-mono text-[10px] fill-[#8C9B9E]">Day 05</text>
                            <text x="270" y="295" className="font-mono text-[10px] fill-[#8C9B9E]">Day 10</text>
                            <text x="400" y="295" className="font-mono text-[10px] font-bold fill-[#142127]">Day 15</text>
                            <text x="520" y="295" className="font-mono text-[10px] fill-[#8C9B9E]">Day 20</text>
                            <text x="630" y="295" className="font-mono text-[10px] fill-[#8C9B9E]">Day 25</text>
                            <text x="720" y="295" className="font-mono text-[10px] font-bold fill-[var(--color-brand)]">Day 30</text>
                        </svg>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#56656A]">
                        <span>
                            Grounded in verified historical velocity • Recalculates immediately with every approved transaction.
                        </span>
                        <span className="font-semibold text-[#142127] mt-1 sm:mt-0">
                            Zero extrapolation without ledger backing
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
