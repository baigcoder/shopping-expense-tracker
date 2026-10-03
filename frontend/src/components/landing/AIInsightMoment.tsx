import { useState } from 'react';
import { Brain, Sparkles, Check, ArrowRight, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIInsightMoment() {
    const [actionState, setActionState] = useState<'idle' | 'adjusted' | 'protected'>('idle');

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
                {/* Left: The Calibrated Premium System Alert */}
                <div className="space-y-4">
                    {/* High-Status Alert Surface */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#7753C7]/30 bg-gradient-to-b from-[#F1ECFF]/40 via-white to-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(119,83,199,0.06)]">
                        <div className="flex items-center justify-between border-b border-[#7753C7]/20 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-ai,#7753C7)] text-white">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ai,#7753C7)]">
                                    Contextual Observation #104
                                </span>
                            </div>
                            <span className="rounded-full bg-[#E3F4EA] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#17824F]">
                                HIGH CONFIDENCE
                            </span>
                        </div>

                        {/* Observation Narrative */}
                        <div className="mt-5">
                            <h4 className="font-display text-xl sm:text-2xl font-bold text-[#142127]">
                                Dining velocity is running 34% above your 30-day baseline.
                            </h4>
                            <p className="mt-3 text-sm leading-relaxed text-[#56656A]">
                                At your current 7-day rate, projected month-end dining burn will reach <strong>Rs 14,200</strong> against your target cap of <strong>Rs 10,000</strong>.
                            </p>
                        </div>

                        {/* Impact Metric Strip */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C9B9E]">
                                    Estimated Month-End Variance
                                </span>
                                <p className="font-mono text-xl font-extrabold text-[#C94343] tabular-nums">
                                    +Rs 4,200 overrun
                                </p>
                            </div>
                            <div className="border-l border-[var(--color-border,#E2E8F0)] pl-4">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C9B9E]">
                                    Impending Commitments
                                </span>
                                <p className="font-mono text-sm font-bold text-[#142127]">
                                    2 bills due Friday (Rs 4,600)
                                </p>
                            </div>
                        </div>

                        {/* Executable One-Click Action Chips */}
                        <div className="mt-6 pt-4 border-t border-[var(--color-border,#E2E8F0)]">
                            <p className="text-xs font-semibold text-[#8C9B9E] mb-3">
                                Executable Decisions (Click to simulate):
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                                <button
                                    onClick={() => setActionState('protected')}
                                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                                        actionState === 'protected'
                                            ? 'bg-[#17824F] text-white shadow-xs'
                                            : 'border border-[#7753C7]/30 bg-[#F1ECFF] text-[#7753C7] hover:bg-[#EAE2FD]'
                                    }`}
                                >
                                    {actionState === 'protected' ? '✓ Friday Headroom Protected' : '[Protect Friday Headroom]'}
                                </button>

                                <button
                                    onClick={() => setActionState('adjusted')}
                                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                                        actionState === 'adjusted'
                                            ? 'bg-[#142127] text-white shadow-xs'
                                            : 'border border-[var(--color-border,#E2E8F0)] bg-white text-[#142127] hover:bg-[var(--color-bg,#F4F3EE)]'
                                    }`}
                                >
                                    {actionState === 'adjusted' ? '✓ Budget Adjusted (+Rs 2,000)' : '[Adjust Monthly Cap]'}
                                </button>

                                <button
                                    onClick={() => alert("Opens deep-dive Dining category ledger view.")}
                                    className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white px-3.5 py-2 text-xs font-semibold text-[#56656A] hover:bg-[var(--color-bg,#F4F3EE)]"
                                >
                                    [Inspect Dining Ledger →]
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Trust micro-guarantee */}
                    <div className="flex items-center gap-2 text-xs text-[#8C9B9E] px-2">
                        <ShieldCheck className="h-4 w-4 text-[#17824F]" />
                        <span>AI operates strictly on approved numbers • Never invents balances or leaks data</span>
                    </div>
                </div>

                {/* Right: The Weekly Coach Habit Engine */}
                <div className="rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#142127] text-white">
                                    <Brain className="h-4 w-4 text-[#DDF3EF]" />
                                </span>
                                <h4 className="font-display text-sm font-bold text-[#142127]">
                                    Weekly Coach Micro-Plan
                                </h4>
                            </div>
                            <span className="rounded-full bg-[#E3F4EA] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#17824F]">
                                2 of 3 Completed
                            </span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-[#56656A]">
                            Replacing overwhelming monthly financial resolutions with 3 high-impact micro-actions each week.
                        </p>
                    </div>

                    {/* Weekly Tasks */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3 text-xs">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#17824F] mt-0.5" />
                            <div>
                                <p className="font-semibold text-[#8C9B9E] line-through">
                                    Review 3 unposted browser checkouts
                                </p>
                                <p className="text-[11px] text-[#8C9B9E]">Completed Tuesday • Zero backlog in queue</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3 text-xs">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#17824F] mt-0.5" />
                            <div>
                                <p className="font-semibold text-[#8C9B9E] line-through">
                                    Verify upcoming Netflix rate adjustment
                                </p>
                                <p className="text-[11px] text-[#8C9B9E]">Completed Wednesday • Rule updated to $17.99</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-[#7753C7]/30 bg-[#F1ECFF]/50 p-3 text-xs">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-ai,#7753C7)] mt-0.5" />
                            <div>
                                <p className="font-semibold text-[#142127]">
                                    Allocate $50 to Emergency Goal to maintain schedule
                                </p>
                                <p className="text-[11px] text-[#7753C7]">Active task for this weekend</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
