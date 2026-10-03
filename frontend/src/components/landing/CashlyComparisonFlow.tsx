import { useState } from 'react';
import { 
    Clock, 
    ShieldAlert, 
    Sparkles, 
    Check, 
    X, 
    ArrowRight, 
    ArrowDown, 
    Zap,
    Lock,
    Eye,
    TrendingDown,
    TrendingUp
} from 'lucide-react';

interface ComparisonDimension {
    id: string;
    title: string;
    traditionalTitle: string;
    traditionalDesc: string;
    cashlyTitle: string;
    cashlyDesc: string;
}

const DIMENSIONS: ComparisonDimension[] = [
    {
        id: 'capture',
        title: 'Transaction Ingestion',
        traditionalTitle: 'Delayed Screen Scraping (3–5 Days)',
        traditionalDesc: 'Demands bank passwords, breaks on 2FA, delays transaction recording by days, and mislabels merchants as cryptic codes.',
        cashlyTitle: 'Zero-Password Browser Interception',
        cashlyDesc: 'Lightweight companion captures checkouts silently as you shop. Zero bank logins required, instant staging with itemized clarity.',
    },
    {
        id: 'control',
        title: 'Posting Authority',
        traditionalTitle: 'Uncontrolled Auto-Posting',
        traditionalDesc: 'Every scraped charge dumps into your posted balance immediately. Duplicates, pending authorizations, and mistakes corrupt your books.',
        cashlyTitle: 'Needs Review Staging Inbox',
        cashlyDesc: 'Unposted captures wait in a calm queue. Nothing touches your balance, ledger, or budgets until you review and approve it.',
    },
    {
        id: 'planning',
        title: 'Forward Commitments',
        traditionalTitle: 'Fragmented Recurring Bills',
        traditionalDesc: 'Subscriptions, utility bills, and rent live in separate tabs. You never know your true unencumbered spending limit.',
        cashlyTitle: 'Unified Headroom Engine',
        cashlyDesc: 'Consolidates subscriptions, utility bills, and rent into one forward schedule, calculating exact discretionary headroom.',
    },
    {
        id: 'forecasting',
        title: 'Predictive Horizon',
        traditionalTitle: 'Rearview Mirror Analytics',
        traditionalDesc: 'Passive pie charts show where you overspent two weeks ago, with zero warning before you breach your limits.',
        cashlyTitle: 'Money Twin Trajectory',
        cashlyDesc: 'Simulates daily burn velocity and projects month-end cash balances in real time before budget overruns occur.',
    },
    {
        id: 'intelligence',
        title: 'Artificial Intelligence',
        traditionalTitle: 'Generic Floating Chatbot',
        traditionalDesc: 'Disconnected chat window reciting generic textbook advice without real context or executable actions.',
        cashlyTitle: 'Grounded Action Chips',
        cashlyDesc: 'High-confidence AI connected directly to approved ledger numbers, generating one-click action buttons to execute decisions.',
    },
];

export default function CashlyComparisonFlow() {
    const [selectedDimension, setSelectedDimension] = useState<string>('capture');
    const currentDim = DIMENSIONS.find((d) => d.id === selectedDimension) || DIMENSIONS[0];

    return (
        <div className="space-y-12">
            {/* The Visual Narrative Flow (Macro Level) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Paradigm A: The Traditional Breakdown */}
                <div className="relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#DC2626]">
                                <ShieldAlert className="h-4 w-4" />
                            </span>
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#DC2626]">
                                The Passive Pattern
                            </span>
                        </div>
                        <span className="rounded bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-semibold text-[#78716C] border border-[#E7E5E4]">
                            Traditional Apps & Banks
                        </span>
                    </div>

                    <h3 className="mt-4 font-display text-xl font-bold text-[#1C1917]">
                        Delayed, Uncontrolled & Reactive
                    </h3>

                    {/* Sequential Disconnected Flow */}
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] p-3 text-xs">
                            <span className="font-mono font-bold text-[#DC2626]">01</span>
                            <div>
                                <p className="font-semibold text-[#1C1917]">Money spent in browser</p>
                                <p className="text-[11px] text-[#78716C]">Purchase happens on Amazon or delivery app</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[#A8A29E]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] p-3 text-xs">
                            <span className="font-mono font-bold text-[#DC2626]">02</span>
                            <div>
                                <p className="font-semibold text-[#1C1917]">Bank sync delays 3–5 days</p>
                                <p className="text-[11px] text-[#78716C]">Fragile screen scraper breaks on 2FA or bank password reset</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[#A8A29E]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] p-3 text-xs">
                            <span className="font-mono font-bold text-[#DC2626]">03</span>
                            <div>
                                <p className="font-semibold text-[#1C1917]">Everything auto-dumps to balance</p>
                                <p className="text-[11px] text-[#78716C]">Zero review staging; duplicate transactions corrupt balances</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[#A8A29E]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-[#FDA4AF] bg-[#FFF1F2]/60 p-3 text-xs">
                            <span className="font-mono font-bold text-[#DC2626]">04</span>
                            <div>
                                <p className="font-semibold text-[#DC2626]">Surprise overrun at month-end</p>
                                <p className="text-[11px] text-[#78716C]">Passive pie charts reveal you overspent two weeks after the fact</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Paradigm B: The Cashly OS Closed Loop */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-brand)]/30 bg-gradient-to-b from-[var(--color-brand-soft)]/40 via-white to-[var(--color-bg,#F4F3EE)] p-6 sm:p-8 shadow-[0_4px_20px_rgba(14,129,116,0.06)]">
                    <div className="flex items-center justify-between border-b border-[var(--color-brand)]/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                                <Sparkles className="h-4 w-4" />
                            </span>
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
                                The Cashly Operating System
                            </span>
                        </div>
                        <span className="rounded bg-[#17824F] px-2 py-0.5 text-[10px] font-bold text-white">
                            Active & Predictive
                        </span>
                    </div>

                    <h3 className="mt-4 font-display text-xl font-bold text-[#142127]">
                        Real-Time, Controlled & Predictive
                    </h3>

                    {/* Integrated Connected Flow */}
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-3 text-xs shadow-2xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E3F4EA] font-mono text-[10px] font-bold text-[#17824F]">01</span>
                            <div>
                                <p className="font-semibold text-[#142127]">Browser captures checkouts instantly</p>
                                <p className="text-[11px] text-[#17824F]">Zero bank credentials required • Instant order recognition</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[var(--color-brand)]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)]/50 p-3 text-xs shadow-2xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] font-mono text-[10px] font-bold text-white">02</span>
                            <div>
                                <p className="font-semibold text-[#142127]">Staged in quiet Needs Review queue</p>
                                <p className="text-[11px] text-[#56656A]">You retain 100% authority before anything posts to your ledger</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[var(--color-brand)]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-3 text-xs shadow-2xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E3F4EA] font-mono text-[10px] font-bold text-[#17824F]">03</span>
                            <div>
                                <p className="font-semibold text-[#142127]">Budgets & Net Headroom update live</p>
                                <p className="text-[11px] text-[#56656A]">SaaS, rent, and utility bills calculated into forward cashflow</p>
                            </div>
                        </div>

                        <div className="flex justify-center text-[var(--color-brand)]">
                            <ArrowDown className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-[#17824F]/40 bg-[#E3F4EA]/50 p-3 text-xs shadow-2xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#17824F] font-mono text-[10px] font-bold text-white">04</span>
                            <div>
                                <p className="font-semibold text-[#17824F]">Money Twin projects month-end clarity</p>
                                <p className="text-[11px] text-[#56656A]">Contextual AI offers direct action chips before leaks become overruns</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Dimension Inspector */}
            <div className="rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border,#E2E8F0)] pb-5">
                    <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
                            Architectural Comparison
                        </p>
                        <h4 className="mt-1 font-display text-lg font-bold text-[#142127]">
                            Deep-dive into the five design differences
                        </h4>
                    </div>

                    {/* Dimension Pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {DIMENSIONS.map((dim) => (
                            <button
                                key={dim.id}
                                onClick={() => setSelectedDimension(dim.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    dim.id === selectedDimension
                                        ? 'bg-[#142127] text-white shadow-xs'
                                        : 'bg-[var(--color-bg,#F4F3EE)] text-[#56656A] hover:bg-[#E9ECE8]'
                                }`}
                            >
                                {dim.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Dimension Comparison Card */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#C94343]">
                            <X className="h-4 w-4" />
                            <span>Traditional Apps: {currentDim.traditionalTitle}</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#56656A]">
                            {currentDim.traditionalDesc}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)]/30 p-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#17824F]">
                            <Check className="h-4 w-4" />
                            <span>Cashly OS: {currentDim.cashlyTitle}</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#142127] font-medium">
                            {currentDim.cashlyDesc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
