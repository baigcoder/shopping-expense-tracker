import { useState, useEffect } from 'react';
import { 
    Chrome, 
    Inbox, 
    BarChart3, 
    Target, 
    Sparkles, 
    Brain,
    Check,
    CreditCard,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Calendar,
    ChevronRight,
    CheckCircle2,
    DollarSign,
    Sliders
} from 'lucide-react';

interface Stage {
    id: string;
    number: string;
    tag: string;
    title: string;
    headline: string;
    description: string;
    highlights: string[];
    icon: any;
}

const STAGES: Stage[] = [
    {
        id: 'capture',
        number: '01',
        tag: 'CAPTURE',
        title: 'Browser Ingestion',
        headline: 'Shop naturally. Checkouts stage themselves silently.',
        description: 'Install the lightweight Cashly companion. When you complete an order on Amazon, Foodpanda, Shopify, or anywhere on the web, Cashly captures the order directly from your active browser session.',
        highlights: [
            'Zero bank credentials or passwords requested',
            'Captures line items, merchant name, and order total',
            'Safely stages into your private review queue'
        ],
        icon: Chrome,
    },
    {
        id: 'review',
        number: '02',
        tag: 'REVIEW',
        title: 'Needs Review Inbox',
        headline: 'Nothing touches your ledger until you approve it.',
        description: 'Unposted captures wait in a calm staging area. You maintain authoritative control over what becomes real financial data. Categorize, split, assign to recurring commitments, or reject with one click.',
        highlights: [
            'One-click approval to canonical ledger',
            'Inline category override and merchant tag editing',
            'Full privacy: unapproved items never affect balances'
        ],
        icon: Inbox,
    },
    {
        id: 'understand',
        number: '03',
        tag: 'UNDERSTAND',
        title: 'Canonical Ledger',
        headline: 'Authoritative data. Intelligent spending patterns.',
        description: 'Approved transactions post to your canonical Postgres ledger. Decision analytics break down where cash flows: online digital checkouts vs physical in-store POS terminals, velocity trends, and merchant concentration.',
        highlights: [
            'Instant real-time search, filters, and audit tags',
            'Channel split: 64% Digital Checkout / 36% Physical POS',
            'Velocity burn curves comparing against prior periods'
        ],
        icon: BarChart3,
    },
    {
        id: 'plan',
        number: '04',
        tag: 'PLAN',
        title: 'Unified Commitments',
        headline: 'Commitments unified. Discretionary headroom revealed.',
        description: 'Never guess how much cash is truly free. Cashly merges software subscriptions, utility bills, rent, and trial conversions into a single forward calendar, computing your exact unencumbered headroom.',
        highlights: [
            'Unified forward calendar for recurring obligations',
            'Automatic free-trial expiration warnings',
            'True net discretionary headroom calculated live'
        ],
        icon: Target,
    },
    {
        id: 'predict',
        number: '05',
        tag: 'PREDICT',
        title: 'Money Twin Forecast',
        headline: 'Know where your month ends before it is over.',
        description: 'Most finance apps tell you what went wrong weeks after the money is gone. Cashly’s Money Twin continuously models your daily burn velocity to project your exact month-end balance and cash runway.',
        highlights: [
            'Live trajectory curve modeling remaining month-end balance',
            'Calculates daily burn velocity and safe spending limits',
            'Simulate trimming discretionary spend to extend runway'
        ],
        icon: Sparkles,
    },
    {
        id: 'act',
        number: '06',
        tag: 'ACT',
        title: 'Contextual AI Co-Pilot',
        headline: 'Grounded intelligence with direct action chips.',
        description: 'Cashly’s AI is not a generic chatbot reciting internet advice. It detects real deviations in your approved numbers and provides direct, clickable action buttons to execute decisions immediately.',
        highlights: [
            'Grounded exclusively in approved ledger numbers',
            'Clickable action chips: adjust caps, inspect items, audit bills',
            'Weekly Coach plan: 3 bite-sized habits tailored to the week'
        ],
        icon: Brain,
    },
];

export default function LifecycleScroller() {
    const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
    const activeStage = STAGES[activeStageIndex];

    return (
        <div className="w-full">
            {/* ============================================================== */}
            {/* DESKTOP EXPERIENCE: Synchronized Visual Journey */}
            {/* ============================================================== */}
            <div className="hidden lg:block">
                {/* Horizontal Stage Progression Ribbon */}
                <div className="relative mb-12 flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                    {STAGES.map((stage, idx) => {
                        const Icon = stage.icon;
                        const isCurrent = idx === activeStageIndex;
                        const isPast = idx < activeStageIndex;
                        return (
                            <button
                                key={stage.id}
                                onClick={() => setActiveStageIndex(idx)}
                                className={`group relative flex items-center gap-3 py-2 text-left transition-all ${
                                    isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                                }`}
                            >
                                <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                                        isCurrent
                                            ? 'bg-[#1C1917] text-white shadow-sm'
                                            : isPast
                                            ? 'bg-[#ECFDF5] text-[#059669]'
                                            : 'bg-[#FAF8F5] text-[#78716C] border border-[#E7E5E4]'
                                    }`}
                                >
                                    {isPast ? '✓' : stage.number}
                                </span>
                                <div>
                                    <p className={`font-mono text-[10px] font-bold tracking-wider uppercase ${
                                        isCurrent ? 'text-[var(--color-brand)]' : 'text-[#8C9B9E]'
                                    }`}>
                                        {stage.tag}
                                    </p>
                                    <p className={`font-display text-sm font-semibold ${
                                        isCurrent ? 'text-[#142127]' : 'text-[#8C9B9E]'
                                    }`}>
                                        {stage.title}
                                    </p>
                                </div>
                                {isCurrent && (
                                    <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[var(--color-brand)] transition-all" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 2-Column Synchronized Composition */}
                <div className="grid grid-cols-[1fr_1.25fr] gap-14 items-center">
                    {/* Left: Editorial Storytelling */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-3.5 py-1 text-xs font-semibold text-[var(--color-brand)]">
                            <activeStage.icon className="h-3.5 w-3.5" />
                            <span>Stage {activeStage.number} of 06 — {activeStage.tag}</span>
                        </div>

                        <h3 className="font-display text-3xl font-extrabold tracking-tight text-[#1C1917] xl:text-4xl">
                            {activeStage.headline}
                        </h3>

                        <p className="text-base leading-relaxed text-[#57534E]">
                            {activeStage.description}
                        </p>

                        <div className="space-y-3 pt-2">
                            {activeStage.highlights.map((highlight, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                                        <Check className="h-2.5 w-2.5" />
                                    </div>
                                    <p className="text-sm font-medium text-[#1C1917]">{highlight}</p>
                                </div>
                            ))}
                        </div>

                        {/* Stage Navigator Controls */}
                        <div className="flex items-center gap-4 pt-4 border-t border-[#E7E5E4]">
                            <button
                                onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                                disabled={activeStageIndex === 0}
                                className="rounded-lg border border-[#E7E5E4] bg-white px-3.5 py-2 text-xs font-semibold text-[#57534E] hover:bg-[#FAF8F5] disabled:opacity-40 transition-all"
                            >
                                ← Previous Stage
                            </button>
                            <button
                                onClick={() => setActiveStageIndex((prev) => (prev + 1) % STAGES.length)}
                                className="flex items-center gap-1.5 rounded-lg bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2E2A27] transition-all"
                            >
                                <span>{activeStageIndex === STAGES.length - 1 ? 'Back to Start' : 'Next Stage'}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-[#FDA4AF]" />
                            </button>
                            <span className="font-mono text-xs text-[#78716C]">
                                {activeStageIndex + 1} / {STAGES.length}
                            </span>
                        </div>
                    </div>

                    {/* Right: Distinct Visual Transformation Canvas */}
                    <div className="relative min-h-[440px] rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_4px_24px_rgba(28,25,23,0.06)] transition-all duration-300">
                        {renderStageVisual(activeStageIndex)}
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* MOBILE & TABLET EXPERIENCE: Connected Vertical Narrative Line */}
            {/* ============================================================== */}
            <div className="lg:hidden space-y-12">
                <div className="relative border-l-2 border-[#E7E5E4] ml-4 pl-6 space-y-12 sm:ml-6 sm:pl-8">
                    {STAGES.map((stage, idx) => {
                        const Icon = stage.icon;
                        return (
                            <div key={stage.id} className="relative space-y-4">
                                {/* Timeline Node Badge */}
                                <div className="absolute -left-[35px] sm:-left-[43px] top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#1C1917] font-mono text-xs font-bold text-white shadow-xs">
                                    {stage.number}
                                </div>

                                <div>
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
                                        {stage.tag}
                                    </span>
                                    <h3 className="mt-1 font-display text-xl font-bold text-[#142127]">
                                        {stage.headline}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[#56656A]">
                                        {stage.description}
                                    </p>
                                </div>

                                {/* Integrated Product Visual in Flow */}
                                <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-4 shadow-sm">
                                    {renderStageVisual(idx)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

{/* Distinct Product Visuals for Each Stage */}
function renderStageVisual(index: number) {
    switch (index) {
        case 0:
            /* STAGE 1: BROWSER CAPTURE */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#C94343]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#B8680B]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#17824F]" />
                            <span className="ml-2 font-mono text-xs text-[#8C9B9E]">chrome / checkout</span>
                        </div>
                        <span className="rounded-full bg-[#E3F4EA] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#17824F]">
                            ORDER PLACED
                        </span>
                    </div>

                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#8C9B9E]">Merchant Storefront:</span>
                            <span className="font-mono font-semibold text-[#142127]">amazon.com</span>
                        </div>
                        <div className="mt-3 flex items-start justify-between gap-4">
                            <div>
                                <p className="font-display text-sm font-bold text-[#142127]">
                                    Minimalist LED Desk Lamp with Dimmer
                                </p>
                                <p className="text-xs text-[#8C9B9E]">Order #114-839201 • Prime 2-Day</p>
                            </div>
                            <span className="font-mono text-base font-bold text-[#142127] tabular-nums">
                                $42.90
                            </span>
                        </div>
                    </div>

                    {/* Companion Docked Interception Visual */}
                    <div className="relative rounded-xl border border-[var(--color-brand)]/30 bg-gradient-to-br from-[var(--color-brand-soft)]/50 to-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white text-xs font-bold">
                                    C
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#142127]">Cashly Companion Captured</p>
                                    <p className="text-[10px] text-[#56656A]">Queued for review • Zero bank credentials shared</p>
                                </div>
                            </div>
                            <span className="rounded bg-[#17824F] px-2 py-0.5 text-[10px] font-bold text-white">
                                Staged
                            </span>
                        </div>
                        <p className="mt-3 text-xs text-[#56656A] leading-relaxed">
                            Interception completed silently in your browser session. The purchase is safely staged in your private inbox.
                        </p>
                    </div>
                </div>
            );

        case 1:
            /* STAGE 2: REVIEW INBOX */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <Inbox className="h-4 w-4 text-[var(--color-brand)]" />
                            <span className="font-display text-xs font-bold text-[#142127]">Needs Review Queue</span>
                        </div>
                        <span className="rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-brand)]">
                            1 Unposted Item
                        </span>
                    </div>

                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand)]">
                                    AMZ
                                </div>
                                <div>
                                    <p className="font-display text-sm font-bold text-[#142127]">Amazon Commerce</p>
                                    <p className="text-xs text-[#56656A]">Minimalist LED Desk Lamp</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium border border-[var(--color-border,#E2E8F0)]">
                                            Home Office
                                        </span>
                                        <span className="text-[10px] text-[#8C9B9E]">Captured 2m ago</span>
                                    </div>
                                </div>
                            </div>
                            <span className="font-mono text-base font-bold text-[#142127] tabular-nums">
                                $42.90
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border,#E2E8F0)] pt-3">
                            <span className="text-[11px] text-[#8C9B9E]">Does not alter balance until approved.</span>
                            <div className="flex items-center gap-2">
                                <button className="rounded-md border border-[var(--color-border,#E2E8F0)] bg-white px-2.5 py-1 text-xs font-medium text-[#56656A]">
                                    Edit / Dismiss
                                </button>
                                <button className="rounded-md bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[var(--color-brand-hover)]">
                                    Approve ✓
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#FAF8F5] p-3 text-xs text-[#78716C]">
                        <p className="font-medium text-[#1C1917]">The Cashly Distinction:</p>
                        <p className="mt-0.5">Traditional apps auto-post incorrect numbers. Cashly puts you in total control.</p>
                    </div>
                </div>
            );

        case 2:
            /* STAGE 3: UNDERSTAND LEDGER */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-[#17824F]" />
                            <span className="font-display text-xs font-bold text-[#142127]">Canonical Ledger & Analytics</span>
                        </div>
                        <span className="rounded-full bg-[#E3F4EA] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#17824F]">
                            Posted Record #8429
                        </span>
                    </div>

                    {/* Posted Transaction Entry */}
                    <div className="flex items-center justify-between rounded-xl border border-[#17824F]/30 bg-[#E3F4EA]/50 p-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#17824F] text-white">
                                <Check className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#142127]">Amazon Commerce • Desk Lamp</p>
                                <p className="text-[10px] text-[#56656A]">Posted to Debit Card • Oct 3</p>
                            </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-[#142127] tabular-nums">
                            -$42.90
                        </span>
                    </div>

                    {/* Analytics Channel Split */}
                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#142127]">Spending Channel Split</span>
                            <span className="text-[10px] text-[#8C9B9E]">This Month</span>
                        </div>
                        <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-2,#E9ECE8)]">
                            <div className="bg-[var(--color-brand)] transition-all" style={{ width: '64%' }} title="Digital Checkout: 64%" />
                            <div className="bg-[#142127] transition-all" style={{ width: '36%' }} title="Physical POS: 36%" />
                        </div>
                        <div className="mt-2 flex justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 font-medium text-[#142127]">
                                <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                                64% Online Checkouts
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-[#56656A]">
                                <span className="h-2 w-2 rounded-full bg-[#142127]" />
                                36% Physical In-Store POS
                            </span>
                        </div>
                    </div>
                </div>
            );

        case 3:
            /* STAGE 4: PLAN & COMMITMENTS */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-[var(--color-brand)]" />
                            <span className="font-display text-xs font-bold text-[#142127]">Unified Commitments & Net Headroom</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#8C9B9E]">
                            Forward Calendar
                        </span>
                    </div>

                    {/* Discretionary Headroom Callout */}
                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-gradient-to-br from-[var(--color-bg,#F4F3EE)] to-white p-4">
                        <p className="text-[11px] font-medium text-[#8C9B9E]">True Unencumbered Discretionary Headroom</p>
                        <p className="mt-1 font-mono text-2xl font-extrabold text-[#142127] tabular-nums">
                            $2,840.00
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#17824F]">
                            Safe to spend after all recurring commitments are secured.
                        </p>
                    </div>

                    {/* Forward Obligations List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                                <span className="font-medium text-[#142127]">Apartment Rent</span>
                            </div>
                            <span className="font-mono font-semibold text-[#142127]">$950.00 (Due 1st)</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#B8680B]" />
                                <span className="font-medium text-[#142127]">Electric Utility</span>
                            </div>
                            <span className="font-mono font-semibold text-[#142127]">$142.50 (Due Friday)</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#3677E8]" />
                                <span className="font-medium text-[#142127]">Netflix Subscription</span>
                            </div>
                            <span className="font-mono font-semibold text-[#142127]">$17.99 (Auto-renews)</span>
                        </div>
                    </div>
                </div>
            );

        case 4:
            /* STAGE 5: PREDICT (MONEY TWIN) */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[var(--color-brand)]" />
                            <span className="font-display text-xs font-bold text-[#142127]">Money Twin Forecast Trajectory</span>
                        </div>
                        <span className="rounded-full bg-[#E3F4EA] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#17824F]">
                            REAL-TIME MODEL
                        </span>
                    </div>

                    {/* Metric Duo */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3.5">
                            <p className="text-[10px] font-semibold text-[#8C9B9E] uppercase">Daily Burn Velocity</p>
                            <p className="mt-1 font-mono text-lg font-extrabold text-[#142127] tabular-nums">$1,840/day</p>
                            <p className="text-[10px] text-[#17824F]">Within safe variance</p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3.5">
                            <p className="text-[10px] font-semibold text-[#8C9B9E] uppercase">Projected Month-End</p>
                            <p className="mt-1 font-mono text-lg font-extrabold text-[#17824F] tabular-nums">$24,150</p>
                            <p className="text-[10px] text-[#8C9B9E]">42 days cash runway</p>
                        </div>
                    </div>

                    {/* Trajectory Art Line Mockup */}
                    <div className="relative rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-4">
                        <div className="flex items-center justify-between text-xs text-[#8C9B9E]">
                            <span>Day 01</span>
                            <span>Day 15 (Today)</span>
                            <span>Day 30 (Projected)</span>
                        </div>
                        {/* Interactive SVG Curve */}
                        <div className="mt-2 h-16 w-full">
                            <svg className="h-full w-full overflow-visible" viewBox="0 0 300 60">
                                {/* Safe buffer zone fill */}
                                <path
                                    d="M 0 45 Q 150 40 300 20 L 300 60 L 0 60 Z"
                                    fill="rgba(23, 130, 79, 0.10)"
                                />
                                {/* Baseline actual curve */}
                                <path
                                    d="M 0 50 Q 80 48 150 38"
                                    fill="none"
                                    stroke="#142127"
                                    strokeWidth="2.5"
                                />
                                {/* Projected future curve */}
                                <path
                                    d="M 150 38 Q 225 30 300 22"
                                    fill="none"
                                    stroke="#0E8174"
                                    strokeWidth="2.5"
                                    strokeDasharray="4 4"
                                />
                                {/* Current Day Dot */}
                                <circle cx="150" cy="38" r="4" fill="#0E8174" />
                            </svg>
                        </div>
                        <p className="mt-2 text-center text-[10px] text-[#8C9B9E]">
                            Slate: Actuals to date • Dashed Jade: Money Twin predictive trajectory
                        </p>
                    </div>
                </div>
            );

        case 5:
            /* STAGE 6: ACT WITH AI */
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-3">
                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-[var(--color-ai,#7753C7)]" />
                            <span className="font-display text-xs font-bold text-[#142127]">Grounded AI Observation</span>
                        </div>
                        <span className="rounded-full bg-[#F1ECFF] border border-[#7753C7]/30 px-2 py-0.5 text-[10px] font-bold text-[#7753C7]">
                            Pattern Detected
                        </span>
                    </div>

                    {/* Contextual Action Notification Card */}
                    <div className="rounded-xl border border-[#7753C7]/30 bg-gradient-to-b from-[#F1ECFF]/40 to-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#7753C7]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Dining Spend Alert</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[#142127]">
                            "Dining is running <strong>34% above your normal pace</strong> this month. If continued, this has a potential <strong>Rs 6,300 month-end impact</strong>."
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#142127] hover:bg-[var(--color-bg,#F4F3EE)] shadow-xs">
                                [Inspect Dining Ledger]
                            </button>
                            <button className="rounded-lg border border-[#7753C7]/30 bg-[#F1ECFF] px-2.5 py-1 text-[11px] font-semibold text-[#7753C7] hover:bg-[#EAE2FD] shadow-xs">
                                [Adjust Monthly Limit]
                            </button>
                        </div>
                    </div>

                    {/* Weekly Coach Habit Plan */}
                    <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3.5">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--color-border,#E2E8F0)]">
                            <span className="font-bold text-[#142127]">Weekly Coach Micro-Plan</span>
                            <span className="text-[10px] font-semibold text-[#17824F]">2 of 3 Done</span>
                        </div>
                        <div className="mt-2 space-y-1.5 text-xs text-[#56656A]">
                            <div className="flex items-center gap-2 text-[#8C9B9E] line-through">
                                <Check className="h-3.5 w-3.5 text-[#17824F]" />
                                <span>Reviewed 3 unposted browser checkouts</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#8C9B9E] line-through">
                                <Check className="h-3.5 w-3.5 text-[#17824F]" />
                                <span>Audited upcoming trial renewal</span>
                            </div>
                            <div className="flex items-center gap-2 font-medium text-[#142127]">
                                <span className="h-3.5 w-3.5 rounded-full border border-[#B8680B]" />
                                <span>Protect Friday headroom for utility bill</span>
                            </div>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
